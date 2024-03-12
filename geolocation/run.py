import asyncio
from app import app
from app.nats_wrapper import nats_wrapper
import os
import atexit
import signal

async def start(loop: asyncio.AbstractEventLoop):
    print('Starting up...')

    if os.environ.get('JWT_KEY') is None:
        raise Exception('JWT_KEY env variable must be defined')

    if os.environ.get('NATS_CLIENT_ID') is None:
        raise Exception('NATS_CLIENT_ID env variable must be defined')
    
    if os.environ.get('NATS_URL') is None:
        raise Exception('NATS_URL env variable must be defined')
    
    if os.environ.get('NATS_CLUSTER_ID') is None:
        raise Exception('NATS_CLUSTER_ID env variable must be defined')

    try:
        await nats_wrapper.connect(
            os.environ.get('NATS_CLUSTER_ID'), 
            os.environ.get('NATS_CLIENT_ID'), 
            os.environ.get('NATS_URL'), 
            loop
        )
    except KeyboardInterrupt as e:
        print(e)
        handle_exit()
    
    # Start flask
    app.run('0.0.0.0', port=3000, debug=True)

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(start(loop))
    def handle_exit():
        try:
            print("Cleaning up...")
            loop.run_until_complete(nats_wrapper.client.close())
            print("Closed STAN connection")
            loop.run_until_complete(nats_wrapper.nats_client.close())
            print("Closed NATS connection")
            if loop.is_running:
                loop.stop()
                print("closed loop")
            print("Done!")
        except Exception as e:
            print(e)
    atexit.register(handle_exit)
    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)


