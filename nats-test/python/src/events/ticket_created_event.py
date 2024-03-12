from typing import TypedDict


class TicketCreatedEventData(TypedDict):
    id: str
    title: str
    price: float
