from urllib.parse import urljoin

from .Source import Source
from bs4 import BeautifulSoup
import requests

def extract_urls(url):
    soup = BeautifulSoup(requests.get(url).content, "html.parser")
    links = soup.find_all("a", string="Link for Job Posting")
    return [urljoin(url, link["href"]) for link in links]

nber_not_at_nber = Source(
    "NBER Listings (not at the NBER)",
    "https://www.nber.org/career-resources/research-assistant-positions-not-nber",
    extract_urls
)