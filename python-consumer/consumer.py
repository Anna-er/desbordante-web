import time
import sys
import json
import logging
import signal
from enum import Enum
import confluent_kafka
import docker
import config
from error_handlers import update_internal_server_error
from error_handlers import update_resource_limit_error


docker_client = docker.from_env()
docker_api_client = docker.APIClient(base_url='unix://var/run/docker.sock')


def create_consumer():
    kafka_consumer_config = {'bootstrap.servers': config.KAFKA_ADDR,
                             'group.id': 'tasks_1',
                             'session.timeout.ms': 6000,
                             # 'on_commit': my_commit_callback,
                             'auto.offset.reset': 'earliest'}
    consumer = confluent_kafka.Consumer(kafka_consumer_config)
    consumer.subscribe(['tasks'])
    return consumer


def container_exit_handler(container, container_state, active_tasks, task_id):
    class exit_codes(Enum):
        TASK_SUCCESSFULLY_PROCESSED = 0
        TASK_CRASHED_STATUS_UPDATED = 1
        TASK_CRASHED_WITHOUT_STATUS_UPDATING = 2
        TASK_NOT_FOUND = 3

    exitCode = container_state["ExitCode"]
    match exitCode:
        case exit_codes.TASK_SUCCESSFULLY_PROCESSED:
            logging.info(f"[{task_id}] task done successfully")
            logging.info(container.logs())

        case exit_codes.TASK_CRASHED_STATUS_UPDATED:
            logging.warning(f"[{task_id}] cpp-consumer has crashed, \
                status was updated by cpp-consumer")
            logging.warning(container.logs())

        case exit_codes.TASK_CRASHED_WITHOUT_STATUS_UPDATING:
            logging.warning(f"[{task_id}] cpp-consumer has crashed \
                without status updating")
            update_internal_server_error(task_id,
                                         f"Crash {container.logs()}")
            logging.warning(container.logs())

        case exit_codes.TASK_NOT_FOUND:
            logging.warning(f"[{task_id}] task not found")

    container.remove()
    active_tasks.pop(task_id)


def container_OOMKilled_handler(container, active_tasks, task_id):
    logging.warning(f"{task_id} ML")
    container.remove()
    active_tasks.pop(task_id)
    update_resource_limit_error(task_id, "MEMORY_LIMIT")


def check_active_containers(active_tasks):
    for task_id, (container, t) in active_tasks.items():
        container.reload()

        logging.info(f'{task_id}, {container}, {container.status}, \
              {int(time.time() - t)}s')

        if time.time() - t >= config.TIMELIMIT:
            # TL
            logging.info(f'time exceeded for {task_id}, \
            container {container} removed')
            container.stop(timeout=1)
            container.remove()
            active_tasks.pop(task_id)
            update_resource_limit_error(task_id, "TIME_LIMIT")
            break

        container_state = docker_api_client.inspect_container(container.id)[
            "State"]

        OOMKilled = container_state["OOMKilled"]
        if OOMKilled:
            container_OOMKilled_handler(container, active_tasks, task_id)
            break

        if container.status == "exited":
            container_exit_handler(
                container, container_state, active_tasks, task_id)
            break

def create_command(j):
    cmd = ''
    for key, value in j.items():
        cmd += f"--{key}={value} "
    return cmd

def create_container(task_id, command):
    logging.info(f"creating container for {task_id}")
    env_variables = {
        "POSTGRES_HOST": config.POSTGRES_HOST,
        "POSTGRES_PORT": config.POSTGRES_PORT,
        "POSTGRES_USER": config.POSTGRES_USER,
        "POSTGRES_PASSWORD": config.POSTGRES_PASSWORD,
        "POSTGRES_DBNAME": config.POSTGRES_DBNAME
    }

    logging.info(f"Cmd={command}")

    container_properties = {
        'image': "cpp-consumer:latest",
        'network': config.DOCKER_NETWORK,
        'command': command,
        'volumes': [
            'desbordante_uploads:/server/uploads/',
            'desbordante_datasets:/build/target/input_data/'],
        'detach': True,
        'mem_limit': f'{config.MAX_RAM}m',
        'environment': env_variables,
        'labels': {"type": "cpp-consumer"}
    }

    return docker_client.containers.run(**container_properties)


def main(containers):
    logging.getLogger().setLevel(logging.INFO)
    logging.getLogger().addHandler(logging.StreamHandler(sys.stderr))
    consumer = create_consumer()

    while True:
        check_active_containers(containers)

        containers_amount = len(containers)
        if containers_amount >= config.MAX_ACTIVE_TASKS:
            time.sleep(1)
            continue

        msg = consumer.poll(3.0)

        if msg is None:
            continue
        if msg.error():
            logging.error(f"Consumer error: {msg.error()}")
            continue
        consumer.commit()

        msg_value = json.loads(msg.value().decode("utf-8"))
        logging.info(f'Received task: {msg_value}')
        task_id = msg_value['task_id']
        container = create_container(task_id, create_command(msg_value))
        containers[task_id] = (container, time.time())

    consumer.close()


def exit_gracefully(*args):
    for _, (container, _) in containers.items():
        container.stop(timeout=1)
        container.remove(force=True)


def remove_dangling_containers():
    active_cpp_containers = docker_client.containers.list(
        filters={"label": "type=cpp-consumer"})
    for container in active_cpp_containers:
        logging.info("removing dangling", container.id)
        container.stop(timeout=1)
        container.remove(force=True)


if __name__ == '__main__':
    global containers
    containers = dict()
    signal.signal(signal.SIGINT, exit_gracefully)
    signal.signal(signal.SIGTERM, exit_gracefully)
    try:
        remove_dangling_containers()
        main(containers)
    except Exception:
        exit_gracefully()
