#include "ac_algorithm.h"

#include <cmath>
#include <functional>
#include <iostream>
#include <random>

#include <easylogging++.h>

#include "types/create_type.h"

namespace algos {

size_t ACAlgorithm::CalculateSampleSize(size_t k_bumps) const {
    /* Calculation of formula 26.2.23 from <<Mathematical Tables>>
    by Abramowitz & Stegun. Constants are given */
    double xp;
    double t, t_2, t_3;
    constexpr double c0 = 2.515517;
    constexpr double c1 = 0.802853;
    constexpr double c2 = 0.010328;
    constexpr double d1 = 1.432788;
    constexpr double d2 = 0.189269;
    constexpr double d3 = 0.001308;
    t = sqrt(log(1 / pow(1.0 - p_fuzz_, 2.0)));
    t_2 = pow(t, 2.0);
    t_3 = pow(t, 3.0);
    xp = t - ((c0 + c1 * t + c2 * t_2) / (1 + d1 * t + d2 * t_2 + d3 * t_3));
    /* Calculation of formula 26.4.17 from <<Mathematical Tables>> by Abramowitz & Stegun*/
    double freedom_degree = 2 * (k_bumps + 1);
    double tmp1 = 2 / (9 * freedom_degree);
    double tmp2 = (1 - tmp1 + xp * sqrt(tmp1));
    double Xp_2 = freedom_degree * pow(tmp2, 3.0);
    /* Formula (7) from <<BHUNT: Automatic Discovery of Fuzzy Algebraic Constraints
     * in Relational Data>> by Paul G. Brown & Peter J. Haas*/
    size_t sample_size = (Xp_2 * (2 - fuzziness_)) / (4 * fuzziness_) + k_bumps / 2.0;
    return sample_size;
}

std::vector<std::byte const*> ACAlgorithm::Sampling(std::vector<model::TypedColumnData> const& data,
                                                    size_t lhs_i, size_t rhs_i,
                                                    size_t k_bumps = 1) {
    Constraints constraints;
    std::vector<std::byte const*> ranges;
    size_t i = 0;
    size_t sample_size = CalculateSampleSize(k_bumps);
    size_t new_k_bumps = 1;
    size_t n_rows = data.at(lhs_i).GetData().size();
    double probability = sample_size / static_cast<double>(n_rows);
    while (i < iterations_limit &&
           (ranges.empty() || sample_size < CalculateSampleSize(new_k_bumps))) {
        k_bumps = new_k_bumps;
        sample_size = CalculateSampleSize(k_bumps);
        probability = sample_size / static_cast<double>(n_rows);
        ranges = SamplingIteration(data, lhs_i, rhs_i, probability, constraints);
        new_k_bumps = ranges.size() / 2;
        if (new_k_bumps == 0) {
            new_k_bumps = k_bumps + 1;
        }
        ++i;
    }
    RestrictRangesAmount(ranges);
    alg_constraints_.emplace_back(std::move(constraints));
    return ranges;
}

std::vector<std::byte const*> ACAlgorithm::SamplingIteration(
        std::vector<model::TypedColumnData> const& data, size_t lhs_i, size_t rhs_i,
        double probability, Constraints& constraints) {
    std::vector<std::byte const*> const& lhs = data.at(lhs_i).GetData();
    std::vector<std::byte const*> const& rhs = data.at(rhs_i).GetData();
    constraints.clear();
    std::random_device rd;
    std::mt19937 gen(rd());

    if (test_mode_) {
        gen = std::mt19937(0);
    }

    std::bernoulli_distribution d(probability);
    for (size_t i = 0; i < lhs.size(); ++i) {
        if (d(gen)) {
            std::byte const* l = lhs.at(i);
            std::byte const* r = rhs.at(i);
            if (data[lhs_i].IsNullOrEmpty(i) || data[rhs_i].IsNullOrEmpty(i)) {
                continue;
            }
            auto res = std::unique_ptr<std::byte[]>(num_type_->Allocate());
            num_type_->ValueFromStr(res.get(), "0");
            if (bin_operation_ == Binop::Division &&
                num_type_->Compare(r, res.get()) == model::CompareResult::kEqual) {
                continue;
            }
            InvokeBinop(l, r, res.get());
            auto ac = std::make_unique<model::AC>(model::AC::ColumnValueIndex{lhs_i, i},
                                                  model::AC::ColumnValueIndex{rhs_i, i}, l, r,
                                                  std::move(res));
            constraints.emplace_back(std::move(ac));
        }
    }

    std::sort(constraints.begin(), constraints.end(),
              [this](std::unique_ptr<model::AC> const& a, std::unique_ptr<model::AC> const& b) {
                  return model::CompareResult::kLess ==
                         this->num_type_->Compare(a->GetRes(), b->GetRes());
              });

    return ConstructDisjunctiveRanges(constraints);
}

void ACAlgorithm::RestrictRangesAmount(std::vector<std::byte const*>& ranges) const {
    if (bumps_limit_ == 0) {
        return;
    }

    size_t bumps = ranges.size() / 2;

    if (bumps == 1) {
        return;
    }

    while (bumps > bumps_limit_) {
        double min_dist = -1;
        size_t min_index = 1;
        for (size_t i = min_index; i < bumps * 2 - 1; i += 2) {
            double dist = num_type_->Dist(ranges.at(i), ranges.at(i + 1));
            if (min_dist == -1 || dist < min_dist) {
                min_dist = dist;
                min_index = i;
            }
        }
        ranges.erase(ranges.begin() + min_index);
        ranges.erase(ranges.begin() + min_index + 1);
        --bumps;
    }
}

ACAlgorithm::RangesCollection const& ACAlgorithm::GetRangesByColumns(size_t lhs_i,
                                                                     size_t rhs_i) const {
    auto res =
            std::find_if(ranges_.begin(), ranges_.end(), [lhs_i, rhs_i](RangesCollection const& r) {
                return (r.column_indices.first == lhs_i && r.column_indices.second == rhs_i);
            });
    if (res == ranges_.end()) {
        throw std::invalid_argument("No ranges for selected pair of columns");
    }
    return *res;
}

void ACAlgorithm::PrintRanges(std::vector<model::TypedColumnData> const& data) const {
    for (size_t i = 0; i < ranges_.size(); ++i) {
        LOG(DEBUG) << "lhs: " << data.at(ranges_[i].column_indices.first).ToString() << std::endl;
        LOG(DEBUG) << "rhs: " << data.at(ranges_[i].column_indices.second).ToString() << std::endl;
        if (ranges_[i].ranges.empty()) {
            LOG(DEBUG) << "No intervals were found." << std::endl;
            continue;
        }
        for (size_t k = 0; k < ranges_[i].ranges.size() - 1; k += 2) {
            auto* num_type = ranges_[i].num_type.get();
            LOG(DEBUG) << "[" << num_type->ValueToString(ranges_[i].ranges[k]) << ", "
                       << num_type->ValueToString(ranges_[i].ranges[k + 1]) << "]";
            if (k != ranges_[i].ranges.size() - 2) {
                LOG(DEBUG) << ", ";
            }
        }
        LOG(DEBUG) << std::endl;
    }
}

std::vector<std::byte const*> ACAlgorithm::ConstructDisjunctiveRanges(
        Constraints& constraints) const {
    std::vector<std::byte const*> ranges;
    if (constraints.size() < 2) {
        ranges = std::vector<std::byte const*>();
        return ranges;
    }
    model::AC const* l_border = constraints.front().get();
    model::AC const* r_border = nullptr;
    double delta = num_type_->Dist(constraints.front()->GetRes(), constraints.back()->GetRes()) *
                   (weight_ / (1 - weight_));

    for (size_t i = 0; i < constraints.size() - 1; ++i) {
        if (num_type_->Dist(constraints[i]->GetRes(), constraints[i + 1]->GetRes()) <= delta) {
            r_border = constraints[i + 1].get();
        } else {
            ranges.emplace_back(l_border->GetRes());
            ranges.emplace_back(constraints[i]->GetRes());
            l_border = constraints[i + 1].get();
            r_border = constraints[i + 1].get();
        }
    }
    if (r_border == constraints.back().get()) {
        ranges.emplace_back(l_border->GetRes());
        ranges.emplace_back(r_border->GetRes());
    }
    return ranges;
}

ACAlgorithm::Binop ACAlgorithm::InitializeBinop(char bin_operation) {
    switch (static_cast<Binop>(bin_operation)) {
        case Binop::Plus:
            binop_pointer_ = &model::INumericType::Add;
            break;
        case Binop::Minus:
            binop_pointer_ = &model::INumericType::Sub;
            break;
        case Binop::Multiplication:
            binop_pointer_ = &model::INumericType::Mul;
            break;
        case Binop::Division:
            binop_pointer_ = &model::INumericType::Div;
            break;
        default:
            throw std::invalid_argument("Invalid operation for algebraic constraints discovery");
    }
    return static_cast<Binop>(bin_operation);
}

unsigned long long ACAlgorithm::ExecuteInternal() {
    std::vector<model::TypedColumnData> const& data = typed_relation_->GetColumnData();
    if (data.empty()) {
        throw std::runtime_error("Empty table was given.");
    }
    auto start_time = std::chrono::system_clock::now();

    for (size_t col_i = 0; col_i < data.size() - 1; ++col_i) {
        if (!data.at(col_i).GetType().IsNumeric()) continue;
        num_type_ =
                model::CreateSpecificType<model::INumericType>(data.at(col_i).GetTypeId(), true);
        for (size_t col_k = col_i + 1; col_k < data.size(); ++col_k) {
            if (data.at(col_i).GetTypeId() == data.at(col_k).GetTypeId()) {
                ranges_.emplace_back(
                        RangesCollection{model::CreateSpecificType<model::INumericType>(
                                                 data.at(col_i).GetTypeId(), true),
                                         Sampling(data, col_i, col_k), col_i, col_k});
                /* Because of asymmetry and division by 0, we need to rediscover ranges.
                 * We don't need to do that for minus: (column1 - column2) lies in *some ranges*
                 * there we can express one column through another without possible problems */
                if (bin_operation_ == Binop::Division) {
                    ranges_.emplace_back(
                            RangesCollection{model::CreateSpecificType<model::INumericType>(
                                                     data.at(col_i).GetTypeId(), true),
                                             Sampling(data, col_k, col_i), col_k, col_i});
                }
            }
        }
    }

    auto elapsed_milliseconds = std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::system_clock::now() - start_time);
    PrintRanges(data);
    return elapsed_milliseconds.count();
}

}  // namespace algos
