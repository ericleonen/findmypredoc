from urllib.parse import urljoin

from .Source import Source
from bs4 import BeautifulSoup
import requests

def extract_urls(url):
    soup = BeautifulSoup(requests.get(url).content, "html.parser")
    
    links = soup.find_all("a", class_="icon")

    return [urljoin(url, link["href"]) for link in links]

predoc = Source(
    "PREDOC.org",
    "https://www.predoc.org/opportunities",
    extract_urls
)