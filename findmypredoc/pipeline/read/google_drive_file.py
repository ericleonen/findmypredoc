import re

import requests

from . import docx as docx_reader
from . import pdf as pdf_reader

_FILE_ID_PATTERNS = [
    r"/file/d/([a-zA-Z0-9_-]+)",
    r"/document/d/([a-zA-Z0-9_-]+)",
    r"[?&]id=([a-zA-Z0-9_-]+)",
]


def read(url: str) -> str:
    """
    Reads a Google Drive file. Native Google Docs are exported as plain text;
    uploaded files (PDF, DOCX, ...) are downloaded and dispatched by content.
    """

    file_id = _extract_file_id(url)

    if "docs.google.com/document" in url:
        response = requests.get(
            f"https://docs.google.com/document/d/{file_id}/export?format=txt",
            timeout=30,
        )
        response.raise_for_status()
        return response.text

    data = _download(file_id)

    if data[:4] == b"%PDF":
        return pdf_reader.read_bytes(data)
    if data[:2] == b"PK":
        return docx_reader.read_bytes(data)

    return data.decode("utf-8", errors="ignore")


def _extract_file_id(url: str) -> str:
    for pattern in _FILE_ID_PATTERNS:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    raise ValueError(f"Could not extract a Google Drive file ID from URL: {url}")


def _download(file_id: str) -> bytes:
    """
    Downloads an uploaded Drive file, handling the "can't scan for viruses"
    interstitial that Drive serves for files it doesn't confirm as small/safe.
    """

    session = requests.Session()
    url = "https://drive.google.com/uc?export=download"

    response = session.get(url, params={"id": file_id}, timeout=30, stream=True)

    token = next(
        (value for key, value in response.cookies.items() if key.startswith("download_warning")),
        None,
    )

    if token:
        response = session.get(
            url, params={"id": file_id, "confirm": token}, timeout=30
        )

    response.raise_for_status()

    return response.content
