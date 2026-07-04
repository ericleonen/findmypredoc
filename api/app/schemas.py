from datetime import date
from typing import Optional

from pydantic import BaseModel


class Source(BaseModel):
    id: str
    name: str
    url: str
    posting_count: int


class PredocLink(BaseModel):
    url: str
    source_name: Optional[str]


class Predoc(BaseModel):
    id: str
    source_id: Optional[str]
    source_name: Optional[str]
    url: str
    links: list[PredocLink]

    institution: Optional[str]
    title: Optional[str]
    location: Optional[str]
    length: Optional[str]
    letters_of_recommendation: Optional[int]
    writing_sample: Optional[bool]

    starts: Optional[str]
    starts_earliest: Optional[date]
    starts_latest: Optional[date]

    opens: Optional[str]
    opens_earliest: Optional[date]
    opens_latest: Optional[date]

    closes: Optional[str]
    closes_earliest: Optional[date]
    closes_latest: Optional[date]

    application_status: str


class PredocList(BaseModel):
    total: int
    limit: int
    offset: int
    items: list[Predoc]
