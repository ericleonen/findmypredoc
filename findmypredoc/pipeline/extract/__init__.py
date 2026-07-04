import json
from importlib.resources import files

import anthropic

from .format_schema import format_schema

_SYSTEM_PROMPT = """You extract structured fields from predoctoral research assistant job postings.

If a field's value is not stated in the text (and cannot be reasonably inferred), set "value" to
null and use "why" to explain that it's missing. Never use placeholder strings such as
"<UNKNOWN>", "N/A", "unknown", or "none" in place of null.

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

    if return_usage:
        return result, response.usage
    return result