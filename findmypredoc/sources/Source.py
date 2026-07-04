import pipeline

class Source:
    def __init__(self, name: str, url: str, extract_position_urls: callable):
        self.name = name
        self.url = url
        self.extract_position_urls = extract_position_urls
        self.position_urls = None

    def fetch(self):
        urls = self.extract_position_urls(self.url)

        # Aggregator pages sometimes link the same posting URL multiple times
        # (e.g. one page listing several faculty projects); dedupe so each URL
        # is only read/extracted once.
        seen = set()
        deduped = []
        for url in urls:
            if url not in seen:
                seen.add(url)
                deduped.append(url)

        self.position_urls = deduped
        return self.position_urls
    
    def extract_positions(self, **extract_kwargs):
        if self.position_urls is None:
            raise ValueError("Position URLs have not been fetched yet. Call fetch() first.")

        positions = []
        for url in self.position_urls:
            try:
                text = pipeline.read(url)
                position = pipeline.extract(text, **extract_kwargs)
                positions.append(position)
            except Exception as e:
                print(f"Error extracting position from {url}: {type(e).__name__}: {repr(e)}")
        return positions