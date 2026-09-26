"""Attach relative_path to seeded house media assets."""
from pathlib import Path
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")
db = MongoClient(os.environ["MONGO_URL"])[os.environ["MONGO_DB"]]

mapping = {
    "6ab7ac0e660dfdd67ea6d360": "/house-1.png",
    "6ab7ac0e660dfdd67ea6d361": "/house-2.png",
    "6ab7ac0e660dfdd67ea6d362": "/house-3.png",
}

for mid, rel in mapping.items():
    result = db.media_assets.update_one(
        {"_id": ObjectId(mid)},
        {"$set": {"relative_path": rel, "filename": rel.lstrip("/")}},
    )
    doc = db.media_assets.find_one({"_id": ObjectId(mid)})
    print(mid, "ok" if result.matched_count else "missing", doc.get("relative_path"), doc.get("filename"))

site = db.site_settings.find_one({"_id": "homepage"})
print("hero:", site["content"]["hero"]["thumbnail_media_ids"])
for i, item in enumerate(site["content"]["properties"]["items"][:3]):
    print(f"HOUSE {i+1}: {item['price']} media={item['media_id']}")
