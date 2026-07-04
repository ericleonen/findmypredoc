from urllib.parse import urljoin

from .Source import Source
from bs4 import BeautifulSoup
import requests

def extract_urls(url):
    soup = BeautifulSoup(requests.get(url).content, "html.parser")
    
    buttons = soup.find_all("button", class_="copy-link")

    return [urljoin(url, button["data-url"]) for button in buttons]

ejm = Source(
    "Econ Job Market",
    "https://econjobmarket.org/positions?show=all&type=mkt&searchType=quick&saved_search_id=0&cutoffDate=2007-01-01&position_type_id=23&category_id=&iso2=&oid=",
    extract_urls
)