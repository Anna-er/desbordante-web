#include "spider.h"

#include <set>

#include <boost/mp11.hpp>
#include <boost/mp11/algorithm.hpp>
#include <easylogging++.h>

#include "algorithms/options/descriptions.h"
#include "algorithms/options/names.h"
#include "algorithms/options/thread_number_opt.h"
#include "model/cursor.h"

namespace algos {

using namespace ind::details;
using namespace ind::preproc;

decltype(Spider::TempOpt) Spider::TempOpt{{config::names::kTemp, config::descriptions::kDTemp},
                                          {"temp"}};

decltype(Spider::MemoryLimitMBOpt) Spider::MemoryLimitMBOpt{
        {config::names::kMemoryLimit, config::descriptions::kDMemoryLimit}, 8 * 1024};

decltype(Spider::MemoryCheckFreq) Spider::MemoryCheckFreq{
        {config::names::kMemoryCheckFrequency, config::descriptions::kDMemoryCheckFrequency},
        {100000}};

decltype(Spider::ColTypeOpt) Spider::ColTypeOpt{
        {config::names::kColType, config::descriptions::kDColType}, {ColType::VECTOR}};

decltype(Spider::KeyTypeOpt) Spider::KeyTypeOpt{
        {config::names::kKeyType, config::descriptions::kDKeyType}, {KeyType::STRING_VIEW}};

void Spider::RegisterOptions() {
    RegisterOption(TempOpt.GetOption(&temp_dir_));
    RegisterOption(MemoryLimitMBOpt.GetOption(&mem_limit_mb_));
    RegisterOption(MemoryCheckFreq.GetOption(&mem_check_frequency_));
    RegisterOption(config::ThreadNumberOpt.GetOption(&threads_count_));
    RegisterOption(ColTypeOpt.GetOption(&col_type_));
    RegisterOption(KeyTypeOpt.GetOption(&key_type_));
}

void Spider::MakePreprocessOptsAvailable() {
    MakeOptionsAvailable(config::GetOptionNames(TempOpt, MemoryLimitMBOpt, MemoryCheckFreq,
                                                config::ThreadNumberOpt, ColTypeOpt, KeyTypeOpt));
}

template <ColTypeImpl col_type, typename... Args>
decltype(auto) CreateConcreteChunkProcessor(ColTypeImpl value, Args&&... args) {
    auto create = [&args...](auto i) -> std::unique_ptr<BaseTableProcessor> {
        constexpr auto key_type_v = static_cast<KeyTypeImpl>(static_cast<std::size_t>(i));
        using ConcreteChunkProcessor = ChunkProcessor<key_type_v, col_type>;
        return std::make_unique<ConcreteChunkProcessor>(std::forward<Args>(args)...);
    };
    return boost::mp11::mp_with_index<std::tuple_size<ind::util::KeysTuple>>(
            static_cast<std::size_t>(value), create);
}

std::unique_ptr<BaseTableProcessor> Spider::CreateChunkProcessor(
        model::IDatasetStream& stream, SortedColumnWriter& writer) const {
    auto col_type = static_cast<ColTypeImpl>(col_type_._to_index());
    if (col_type_ == +ColType::SET) {
        return CreateConcreteChunkProcessor<ColTypeImpl::SET>(
                col_type, writer, stream, GetMemoryLimitInBytes(), mem_check_frequency_);
    } else {
        return CreateConcreteChunkProcessor<ColTypeImpl::VECTOR>(
                col_type, writer, stream, GetMemoryLimitInBytes(), threads_count_);
    }
}

unsigned long long Spider::ExecuteInternal() {
    LOG(INFO) << "Initialize attributes";
    auto init_time = std::chrono::system_clock::now();
    InitializeAttributes();
    timings_.initializing = std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now() - init_time);

    LOG(INFO) << "Compute UIDs";
    auto compute_time = std::chrono::system_clock::now();
    ComputeUIDs();
    timings_.computing = std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now() - compute_time);

    LOG(INFO) << std::endl << "SUMMARY INFO";

    Output();
    timings_.Print();
    LOG(INFO) << "Deps: " << uinds_.size();
    PrintResult(std::cout);
    return 0;
}

void Spider::RegisterUID(UIND uid) {
    uinds_.emplace_back(std::move(uid));
}

void Spider::InitializeAttributes() {
    attrs_.reserve(stats_.n_cols);
    for (std::size_t attr_id = 0; attr_id != stats_.n_cols; ++attr_id) {
        auto path = stats_.attribute_paths[attr_id];
        auto [attr_it, is_inserted] = attrs_.emplace(
                attr_id, Attribute{attr_id, stats_.n_cols, StrCursor{path}, stats_.max_values});
        if (!is_inserted) {
            throw std::runtime_error("New attribute wasn't inserted " + std::to_string(attr_id));
        }
        auto attr_ptr = &attr_it->second;
        if (!attr_ptr->HasFinished()) {
            attribute_queue_.emplace(attr_ptr);
        }
    }
}

void Spider::ComputeUIDs() {
    Attribute::SSet attr_ids;
    while (!attribute_queue_.empty()) {
        auto top_attribute = attribute_queue_.top();
        attribute_queue_.pop();

        attr_ids.emplace(top_attribute->GetId());
        while (!attribute_queue_.empty() &&
               top_attribute->GetCursor().GetValue() ==
                       (attribute_queue_.top()->GetCursor().GetValue())) {
            attr_ids.emplace(attribute_queue_.top()->GetId());
            attribute_queue_.pop();
        }
        for (auto attr_id : attr_ids) {
            attrs_.at(attr_id).IntersectRefs(attr_ids, attrs_);
        }
        for (auto attr_id : attr_ids) {
            auto& attr = attrs_.at(attr_id);
            if (!attr.HasFinished()) {
                attr.GetCursor().GetNext();
                attribute_queue_.emplace(&attr);
            }
        }
        attr_ids.clear();
    }
}

void Spider::Output() {
    for (const auto& [dep_id, attr] : attrs_) {
        for (auto const& ref_id : attr.GetRefs()) {
            RegisterUID({dep_id, ref_id});
        }
    }
}

void Spider::PrintResult(std::ostream& out) const {
    std::vector<std::string> columns;
    columns.reserve(stats_.n_cols);
    for (std::size_t i = 0; i != stats_.number_of_columns.size(); ++i) {
        for (std::size_t j = 0; j != stats_.number_of_columns[i]; ++j) {
            std::string name = std::to_string(i) + "." + std::to_string(j);
            columns.emplace_back(name);
        }
    }
    for (auto const& uid : uinds_) {
        out << uid.first << "->" << uid.second;
        out << std::endl;
    }
    out << std::endl;
}

void Spider::FitInternal(InputData& streams) {
    auto preprocess_time = std::chrono::system_clock::now();
    ExecutePrepare();

    SortedColumnWriter writer{temp_dir_};
    for (const auto& stream : streams) {
        LOG(INFO) << "Process next dataset";
        auto processor = CreateChunkProcessor(*stream, writer);
        processor->Execute();
        stats_.n_cols += processor->GetHeaderSize();
        stats_.number_of_columns.emplace_back(processor->GetHeaderSize());
        stats_.datasets_order.push_back(
                {.table_name = "path.filename()", .header = processor->GetHeader()});
    }
    stats_.max_values = writer.GetMaxValues();

    for (std::size_t attr_id = 0; attr_id != stats_.n_cols; ++attr_id) {
        stats_.attribute_paths.emplace_back(writer.GetResultColumnPath(attr_id));
    }

    timings_.preprocessing = std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now() - preprocess_time);
}

Spider::INDList Spider::IndList() const {
    INDList list{};
    std::map<unsigned, std::shared_ptr<IND::ColumnCombination>> unique_values;

    auto add_cc = [&](unsigned id) {
        auto it = unique_values.find(id);
        if (it == unique_values.end()) {
            return unique_values[id] = std::make_unique<IND::ColumnCombination>(GetCCByID(id));
        } else {
            return it->second;
        }
    };
    for (auto const& [dep_id, ref_id] : uinds_) {
        list.emplace_back(add_cc(dep_id), add_cc(ref_id));
    }
    return list;
}

}  // namespace algos
