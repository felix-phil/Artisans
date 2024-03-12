from abc import ABC, abstractproperty
import json
from typing import Generic, TypeVar
from stan.aio.client import Client as STAN, Msg
from .subjects import SubjectsValues
import asyncio

T = TypeVar("T")


class Listener(ABC, Generic[T]):
    @abstractproperty
    def subject(self) -> SubjectsValues:
        pass

    @abstractproperty
    def queue_group_name(self) -> str:  # durable_name
        pass

    @abstractproperty
    def on_message(self, data: T, msg: Msg, sc: STAN):
        pass

    ack_wait = 5  # 5 seconds

    client: STAN
    loop: asyncio.AbstractEventLoop

    def __init__(self, client: STAN, loop: asyncio.AbstractEventLoop):
        self.client = client
        self.loop = loop

    def parse_message(self, msg: Msg):
        data = msg.data
        return json.loads(data)

    async def callback_on_message(self, msg: Msg, future: asyncio.Future):
        # print('expecting event to be ack...')
        parsed_data = self.parse_message(msg)
        print(f"Event received from {self.subject} / {self.queue_group_name}")
        await self.on_message(parsed_data, msg, self.client)
        future.set_result(parsed_data)

    async def listen(self) -> asyncio.Future:
        future = asyncio.Future(loop=self.loop)
        await self.client.subscribe(
            subject=self.subject.value,
            ack_wait=self.ack_wait,
            deliver_all_available=True,
            queue=self.queue_group_name,
            durable_name=self.queue_group_name,
            manual_acks=True,
            cb=lambda msg: self.callback_on_message(msg, future=future)
        )
        await asyncio.wait_for(future, timeout=None)
        return future
