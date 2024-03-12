from .subjects import Subjects
from .base_publisher import Publisher
from .ticket_created_event import TicketCreatedEventData


class TicketCreatedPublisher(Publisher[TicketCreatedEventData]):
    subject = Subjects.TicketCreated
