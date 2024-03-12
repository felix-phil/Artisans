from nats.aio.client import Client as NATS
from stan.aio.client import Client as STAN
from src.events.ticket_created_publisher import TicketCreatedPublisher
import asyncio


async def run(loop):

    nc = NATS()
    await nc.connect('nats://localhost:4222', io_loop=loop)

    sc = STAN()
    await sc.connect("artisans", "client-python-publisher", nats=nc)

    future = await TicketCreatedPublisher(sc, loop).publish(
        {"id": "mongolikeid", "title": "Joeboy concert from python", "price": 50})
    print(future)
if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    try:
        loop.run_until_complete(run(loop))
        loop.run_forever()
    except KeyboardInterrupt:
        print('Shutting down...')
        loop.stop()
        print('Publisher stopped')
