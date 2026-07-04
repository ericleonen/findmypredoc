import json
from importlib.resources import files

import anthropic

from .dates import parse_fuzzy_date
from .format_schema import format_schema

_SYSTEM_PROMPT = """You extract structured fields from predoctoral research assistant job postings.

If a field's value is not stated in the text (and cannot be reasonably inferred), set "value" to
null and use "why" to explain that it's missing. Never use placeholder strings such as
"<UNKNOWN>", "N/A", "unknown", or "none" in place of null.

Many postings describe a recurring position (e.g. "our predocs typically start each summer")
alongside a specific upcoming application cycle (e.g. "applications for the position open
October 2026"). These two pieces of text can describe different hiring cycles -- the recurring
description may be talking about the current or a past cohort, not the one being applied to. Make
sure position.starts describes the same hiring cycle as application.opens/application.closes: if
the posting's literal start date predates when applications would even open, infer the start date
for the upcoming cycle instead (e.g. a recurring "starts each Summer" position with applications
opening Fall 2026 should be extracted as starting Summer 2027, not Summer 2026).

For each field's "why", give a brief explanation in your own words of where the value came from
or why it's missing. Do not quote the source text verbatim."""

_PLACEHOLDER_VALUES = {"<unknown>", "unknown", "n/a", "none", "null", "not specified", "not provided"}


def _default_schema() -> dict:
    return json.loads(files(__package__).joinpath("schema.json").read_text())


def _check_no_placeholders(result: dict) -> None:
    for area, fields in result.items():
        for field, obj in fields.items():
            value = obj.get("value")
            if isinstance(value, str) and value.strip().lower() in _PLACEHOLDER_VALUES:
                raise ValueError(
                    f"Model returned placeholder string {value!r} for '{area}.{field}' instead of null"
                )


def _strip_quotes(text: str) -> str:
    if len(text) >= 2 and text[0] == text[-1] and text[0] in ("'", '"'):
        return text[1:-1]
    return text


def _strip_why_quotes(result: dict) -> None:
    for fields in result.values():
        for obj in fields.values():
            obj["why"] = _strip_quotes(obj["why"])


def _null_inconsistent_starts(result: dict) -> None:
    """
    Guards against the model reading a recurring position's generic/past start date
    alongside a specific upcoming application window, and extracting the two as if they
    describe the same cycle. If the extracted start date falls entirely before the
    application window could even open, it's almost certainly the wrong cycle -- null it out
    rather than surface a self-contradictory posting.
    """
    starts_field = result.get("position", {}).get("starts")
    opens_field = result.get("application", {}).get("opens")
    if starts_field is None or opens_field is None:
        return

    starts_range = parse_fuzzy_date(starts_field.get("value"))
    opens_range = parse_fuzzy_date(opens_field.get("value"))
    if starts_range is None or opens_range is None:
        return

    if starts_range.latest < opens_range.earliest:
        starts_field["value"] = None
        starts_field["why"] = (
            "Nulled by a consistency check: the extracted start date fell entirely before "
            "the application window could even open, which usually means it described a "
            "different (likely past) hiring cycle than the one being applied to."
        )


def extract(
    text: str,
    schema: dict = None,
    anthropic_model: str = "claude-opus-4-8",
    max_tokens: int = 1024,
    return_usage: bool = False
):
    """
    Extract structured fields from a predoc job posting with reasoning 'why' for each.

    If return_usage is True, returns (result, response.usage) instead of just result.
    """

    if schema is None:
        schema = _default_schema()

    client = anthropic.Anthropic()

    response = client.messages.create(
        model=anthropic_model,
        max_tokens=max_tokens,
        cache_control={"type": "ephemeral"},
        system=_SYSTEM_PROMPT,
        tools=[{
            "name": "extract_predoc_posting_info",
            "description": "Extract structured fields from a predoc job posting with reasoning 'why' for each",
            "input_schema": format_schema(schema),
            "strict": True
        }],
        tool_choice={"type": "tool", "name": "extract_predoc_posting_info"},
        messages=[{"role": "user", "content": text}]
    )

    if response.stop_reason == "max_tokens":
        raise ValueError("Response truncated by max_tokens before extraction completed")

    result = next(b.input for b in response.content if b.type == "tool_use")
    _check_no_placeholders(result)
    _strip_why_quotes(result)
    _null_inconsistent_starts(result)

    if return_usage:
        return result, response.usage
    return result