import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError

MIN_TEXT_LENGTH = 300


def read(url: str, min_text_length: int = MIN_TEXT_LENGTH, timeout_ms: int = 60000):
    """
    Reads the content of a website. Tries a plain HTTP GET first; if the
    resulting page has too little visible text (e.g. content is rendered
    client-side via JS), retries with a headless browser that waits for the
    page to load.
    """

    try:
        html = _fetch_static(url)
        text_length = _visible_text_length(html)
    except requests.RequestException:
        text_length = 0

    if text_length < min_text_length:
        html = _fetch_rendered(url, timeout_ms=timeout_ms)

    return html


def _fetch_static(url: str) -> bytes:
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    return response.content


def _fetch_rendered(url: str, timeout_ms: int = 60000) -> str:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            page = browser.new_page()
            page.goto(url, timeout=timeout_ms)
            try:
                page.wait_for_load_state("networkidle", timeout=timeout_ms)
            except PlaywrightTimeoutError:
                # Some sites never go network-idle (polling/analytics); proceed with
                # whatever has rendered so far rather than failing the whole read.
                pass
            # inner_text (unlike page.content()'s raw HTML) pierces open shadow DOM,
            # which sites built on web components (e.g. Workday) render into.
            return page.inner_text("body")
        finally:
            browser.close()


def _visible_text_length(html) -> int:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "header", "footer", "form", "aside"]):
        tag.decompose()
    return len(soup.get_text(strip=True))
