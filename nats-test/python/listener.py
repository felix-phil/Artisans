from nats.aio.client import Client as NATS
from stan.aio.client import Client as STAN
from src.events.ticket_created_listener import TicketCreatedListener
import asyncio


async def run(loop):
    nc = NATS()
    await nc.connect('nats://localhost:4222', io_loop=loop)

    sc = STAN()
    await sc.connect("artisans", "client-python-listener", nats=nc)

    await TicketCreatedListener(sc, loop).listen()


if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(run(loop))
        loop.run_forever()
    except KeyboardInterrupt:
        print('Shutting down...')
        loop.stop()
        print('Listener stopped')
