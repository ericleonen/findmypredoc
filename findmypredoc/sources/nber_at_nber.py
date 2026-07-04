from urllib.parse import urljoin

from .Source import Source
from bs4 import BeautifulSoup
import requests

def extract_urls(url):
    soup = BeautifulSoup(requests.get(url).content, "html.parser")

    main = soup.find("div", class_="page-header__intro-inner")

    urls = []
    for p in main.find_all("p", recursive=False):
        text = p.get_text(strip=True)
        if text and set(text) == {"_"}:
            break
        
        urls.extend(urljoin(url, a["href"]) for a in p.find_all("a", href=True))

    return urls


nber_at_nber = Source(
    "NBER Listings (at NBER)",
    "https://www.nber.org/career-resources/research-assistant-positions-nber",
    extract_urls
)