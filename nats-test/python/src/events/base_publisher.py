from abc import ABC, abstractproperty
import asyncio
import json
from stan.aio.client import Client as STAN
from .subjects import Subjects, SubjectsValues
from typing import Any, Generic, TypeVar

T = TypeVar("T")


class Publisher(Generic[T], ABC):
    @abstractproperty
    def subject(self) -> SubjectsValues:
        pass

    client: STAN
    loop: asyncio.AbstractEventLoop

    def __init__(self, client: STAN, loop: asyncio.AbstractEventLoop):
        self.client = client
        self.loop = loop

    def ack_handler(self, ack, future: asyncio.Future):
        if ack.error:
            future.set_exception(
                f'Unable to publish event with subject: {self.subject}')
        future.set_result(
            f'Event published to subject: {self.subject}')
        print(
            f'Event published to subject: {str(self.subject)} with guid: {ack.guid}')

    async def publish(self, data: T):
        future = asyncio.Future(loop=self.loop)

        bytesData = json.dumps(data).encode('utf-8')
        await self.client.publish(
            subject=self.subject.value,
            payload=bytesData,
            ack_handler=lambda ack:  self.ack_handler(ack, future)
        )
        await asyncio.wait_for(future, timeout=None)
        return future
