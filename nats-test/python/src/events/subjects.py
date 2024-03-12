import enum
from typing import Literal, get_args
import typing


class Subjects(enum.Enum):
    UserCreated = 'user:created'
    TicketCreated = 'ticket:created'


SubjectsValues = Literal['user:created', 'ticket:created']
assert set(typing.get_args(SubjectsValues)) == {
    member.value for member in Subjects}
