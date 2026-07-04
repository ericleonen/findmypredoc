import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()  # repo-root .env
load_dotenv(Path(__file__).resolve().parents[2] / "service" / ".env.local")  # DATABASE_URL

DATABASE_URL = os.environ["DATABASE_URL"]
