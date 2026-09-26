"""Set thumbnail_prices on homepage houses to match seeded property prices."""
from pathlib import Path
import os
from dotenv import load_dotenv
from pymongo import MongoClient

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")
db = MongoClient(os.environ["MONGO_URL"])[os.environ["MONGO_DB"]]

site = db.site_settings.find_one({"_id": "homepage"})
prices = [item["price"] for item in site["content"]["properties"]["items"][:3]]
db.site_settings.update_one(
    {"_id": "homepage"},
    {
        "$set": {
            "content.hero.thumbnail_prices": prices,
            "content.today.thumbnail_prices": prices,
        }
    },
)
site = db.site_settings.find_one({"_id": "homepage"})
print("hero prices:", site["content"]["hero"].get("thumbnail_prices"))
print("today prices:", site["content"]["today"].get("thumbnail_prices"))
for mid in site["content"]["hero"]["thumbnail_media_ids"]:
    doc = db.media_assets.find_one({"_id": __import__("bson").ObjectId(mid)})
    print(mid, "->", doc.get("relative_path"), doc.get("filename"))
