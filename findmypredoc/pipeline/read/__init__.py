from bs4 import BeautifulSoup
from . import docx, google_drive_file, pdf, website

MIN_TEXT_LENGTH = 300


def read(url: str):
    """
    Reads the content of a website, Google Drive file, PDF, or DOCX file and returns the cleaned
    extracted text.
    """

    content = None
    lower_url = url.lower()
    is_google_drive_file = (
        "drive.google.com" in lower_url or "docs.google.com" in lower_url
    ) and "/forms/" not in lower_url

    if is_google_drive_file:
        content = google_drive_file.read(url)
    elif lower_url.endswith(".pdf"):
        content = pdf.read(url)
    elif lower_url.endswith(".docx"):
        content = docx.read(url)
    else:
        content = website.read(url)

    soup = BeautifulSoup(content, "html.parser")

    for tag in soup(["script", "style", "nav", "header", "footer", "form", "aside"]):
        tag.decompose()

    text = soup.get_text(separator="\n", strip=True)

    if len(text) < MIN_TEXT_LENGTH:
        raise ValueError(f"Extracted text too short ({len(text)} chars) to be a real posting")

    return text
