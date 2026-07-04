import io

import requests
from pypdf import PdfReader


def read(url: str) -> str:
    """
    Downloads a PDF from a URL and extracts its text.
    """

    response = requests.get(url, timeout=30)
    response.raise_for_status()

    return read_bytes(response.content)


def read_bytes(data: bytes) -> str:
    """
    Extracts text from raw PDF bytes.
    """

    reader = PdfReader(io.BytesIO(data))

    return "\n".join(page.extract_text() or "" for page in reader.pages)
