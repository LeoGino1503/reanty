"""Upload house-1/2/3.png into media DB and assign prices > $7000."""
from __future__ import annotations

import json
import random
import uuid
from pathlib import Path
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"
TOKEN = "qmw2MLsRnvgbY4IhNVkHzPZ6oxpQU7S9Gd5u8OKy"
ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
AUTH = {"Authorization": f"Bearer {TOKEN}"}


def multipart_upload(url: str, filepath: Path, field: str = "file") -> dict:
    boundary = f"----Boundary{uuid.uuid4().hex}"
    data = filepath.read_bytes()
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="{field}"; filename="{filepath.name}"\r\n'
        f"Content-Type: image/png\r\n\r\n"
    ).encode() + data + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={**AUTH, "Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def api(method: str, path: str, payload: dict | None = None) -> dict:
    data = None if payload is None else json.dumps(payload).encode()
    headers = {**AUTH}
    if payload is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(f"{BASE}{path}", data=data, method=method, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def main() -> None:
    ids: list[str] = []
    for n in (1, 2, 3):
        path = PUBLIC / f"house-{n}.png"
        if not path.exists():
            raise SystemExit(f"Missing file: {path}")
        relative = f"/{path.name}"
        rec = multipart_upload(f"{BASE}/api/admin/media", path)
        print(f"uploaded {relative} -> id={rec['id']} filename={rec['filename']} size={rec['size']}")
        ids.append(rec["id"])

    prices = [f"${random.randint(7001, 25000):,}" for _ in range(3)]
    print("prices:", ", ".join(prices))

    site = api("GET", "/api/admin/site")
    content = site["content"]
    content["hero"]["thumbnail_media_ids"] = ids
    content["hero"]["thumbnail_prices"] = prices
    content["today"]["thumbnail_media_ids"] = ids
    content["today"]["thumbnail_prices"] = prices
    for i, item in enumerate(content["properties"]["items"][:3]):
        item["media_id"] = ids[i]
        item["price"] = prices[i]
        item["title"] = f"HOUSE {i + 1}"

    updated = api("PUT", "/api/admin/site", {"content": content, "version": site["version"]})
    print("site updated")
    print("hero thumbs:", updated["content"]["hero"]["thumbnail_media_ids"])
    print("hero prices:", updated["content"]["hero"].get("thumbnail_prices"))
    print("today thumbs:", updated["content"]["today"]["thumbnail_media_ids"])
    for i, item in enumerate(updated["content"]["properties"]["items"][:3]):
        print(f"property[{i}] {item['title']} {item['price']} media={item['media_id']}")

    # Keep public relative paths on media records
    from dotenv import load_dotenv
    import os
    from pymongo import MongoClient
    from bson import ObjectId

    load_dotenv(ROOT / ".env")
    db = MongoClient(os.environ["MONGO_URL"])[os.environ["MONGO_DB"]]
    for n, mid in enumerate(ids, start=1):
        rel = f"/house-{n}.png"
        db.media_assets.update_one(
            {"_id": ObjectId(mid)},
            {"$set": {"relative_path": rel, "filename": f"house-{n}.png"}},
        )
        print(f"relative_path set: {rel}")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as exc:
        print(exc.read().decode())
        raise
