from .subjects import Subjects
from .base_listener import Listener
from .ticket_created_event import TicketCreatedEventData
import asyncio


class TicketCreatedListener(Listener[TicketCreatedEventData]):
    subject = Subjects.TicketCreated
    queue_group_name = 'ticket-service-python'

    async def on_message(self, data: TicketCreatedEventData, msg, sc):
        print(data)
        await sc.ack(msg)
        # return await super().on_message
