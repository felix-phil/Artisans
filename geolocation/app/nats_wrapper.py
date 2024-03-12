from nats.aio.client import Client as NATS
from stan.aio.client import Client as STAN
from typing import Optional
import asyncio

class NatsWrapper():
    _client: Optional[STAN]
    _nats_client: Optional[NATS]
    _loop: Optional[asyncio.AbstractEventLoop]

    def __init__(self) -> None:
        self._client = None

    @property
    def client(self) -> NATS:
        if self._client is None:
            raise Exception("Cannot access NATS client before initilization")
        return self._client
    @property
    def nats_client(self) -> NATS:
        if self._nats_client is None:
            raise Exception("Cannot access NATS client before initilization")
        return self._nats_client
    @property
    def loop(self) -> asyncio.AbstractEventLoop:
        if self._loop is None:
            raise Exception("Cannot access NATS client before initilization")
        return self._loop

    async def connect(self, cluster_id: str, client_id: str, url: str, loop:asyncio.AbstractEventLoop) -> None:
        self._nats_client = NATS()
        self._client =  STAN()
        self._loop = loop
        print(cluster_id, client_id, url)
        await self.nats_client.connect(url, loop=self.loop)
        await self.client.connect(cluster_id, client_id, nats=self.nats_client)
        print(f"Cluster {cluster_id} with Client Id '{client_id}' connected to NATS")
nats_wrapper = NatsWrapper()