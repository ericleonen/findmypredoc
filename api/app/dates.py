"""
Parses the fuzzy date strings findmypredoc's extraction schema produces for pos_starts,
app_opens, and app_closes -- each is either an exact day ("2026-07-01"), a month
("July 2026"), or a season ("Summer 2026") -- into a (earliest, latest) date range, so
postings can be ordered and range-filtered consistently regardless of which precision the
source text supported.
"""

import calendar
import re
from datetime import date
from typing import NamedTuple, Optional


class DateRange(NamedTuple):
    earliest: date
    latest: date


_ISO_DATE_RE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})$")
_WORD_YEAR_RE = re.compile(r"^([A-Za-z]+)\s+(\d{4})$")

_MONTH_NUMBERS = {name.lower(): i for i, name in enumerate(calendar.month_name) if name}

# (start_month, end_month) within the season's year. Winter is the one season that spans
# a year boundary; its end_month falls in year + 1.
_SEASON_MONTHS = {
    "spring": (3, 5),
    "summer": (6, 8),
    "fall": (9, 11),
    "autumn": (9, 11),
    "winter": (12, 2),
}


def parse_fuzzy_date(value: Optional[str]) -> Optional[DateRange]:
    if not value:
        return None
    value = value.strip()

    m = _ISO_DATE_RE.match(value)
    if m:
        d = date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        return DateRange(d, d)

    m = _WORD_YEAR_RE.match(value)
    if not m:
        return None
    word, year = m.group(1).lower(), int(m.group(2))

    if word in _MONTH_NUMBERS:
        month = _MONTH_NUMBERS[word]
        last_day = calendar.monthrange(year, month)[1]
        return DateRange(date(year, month, 1), date(year, month, last_day))

    if word in _SEASON_MONTHS:
        start_month, end_month = _SEASON_MONTHS[word]
        end_year = year + 1 if word == "winter" else year
        end_last_day = calendar.monthrange(end_year, end_month)[1]
        return DateRange(date(year, start_month, 1), date(end_year, end_month, end_last_day))

    return None


# When an application opens date is known but a closes date isn't, we assume a one-month
# application window rather than treating the posting as open indefinitely.
_ASSUMED_APPLICATION_WINDOW_MONTHS = 1


def _add_months(d: date, months: int) -> date:
    month_index = d.month - 1 + months
    year = d.year + month_index // 12
    month = month_index % 12 + 1
    day = min(d.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def application_status(
    starts: Optional[DateRange],
    opens: Optional[DateRange],
    closes: Optional[DateRange],
    today: Optional[date] = None,
) -> str:
    """
    "open"          -- applications can be submitted today (or no window is known to be closed)
    "upcoming"      -- the application window hasn't opened yet
    "likely_closed" -- no closes date is known, but it's been more than the assumed one-month
                       application window since the posting opened
    "closed"        -- the position's start date has passed (regardless of the application
                       window), or the application window itself has passed
    "unknown"       -- neither an opens nor a closes date could be determined
    """
    today = today or date.today()

    if starts is not None and starts.latest < today:
        return "closed"
    if closes is not None:
        if closes.latest < today:
            return "closed"
    elif opens is not None:
        assumed_closes = _add_months(opens.latest, _ASSUMED_APPLICATION_WINDOW_MONTHS)
        if assumed_closes < today:
            return "likely_closed"
    if opens is not None and opens.earliest > today:
        return "upcoming"
    if opens is None and closes is None:
        return "unknown"
    return "open"
