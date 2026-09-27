from __future__ import annotations

import copy
import hmac
import os
import re
import uuid
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable
from urllib.parse import urlsplit

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Header, HTTPException, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, StreamingResponse
from minio import Minio
from pydantic import BaseModel, Field, ValidationError
from pymongo import MongoClient, ReturnDocument
from pymongo.errors import DuplicateKeyError
from bson import ObjectId

from .defaults import DEFAULT_SITE

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
MONGO_DB = os.getenv("MONGO_DB", "reanty")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "reanty-media")
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_MB", "50")) * 1024 * 1024
EMAIL_PATTERN = re.compile(r"^[^\s@]{1,128}@[^\s@]{1,255}\.[^\s@]{2,63}$")
FORM_NAME_PATTERN = re.compile(r"^[a-z][a-z0-9-]{0,40}$")
ALLOWED_ORIGINS = [x.strip() for x in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",") if x.strip()]


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_storage() -> Minio:
    return Minio(
        os.getenv("MINIO_ENDPOINT", "localhost:9000"),
        access_key=os.getenv("MINIO_ACCESS_KEY", ""),
        secret_key=os.getenv("MINIO_SECRET_KEY", ""),
        secure=os.getenv("MINIO_SECURE", "false").lower() == "true",
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=4000)
    client.admin.command("ping")
    app.state.mongo_client = client
    app.state.db = client[MONGO_DB]
    app.state.db.newsletter_subscriptions.create_index("email", unique=True)
    app.state.db.contact_messages.create_index("created_at")
    app.state.db.media_assets.create_index("created_at")
    storage = make_storage()
    if not storage.bucket_exists(MINIO_BUCKET):
        storage.make_bucket(MINIO_BUCKET)
    app.state.storage = storage
    ensure_site(app.state.db)
    try:
        yield
    finally:
        client.close()


app = FastAPI(title="Reanty Local API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "Range"],
)


def database(request: Request):
    return request.app.state.db


def storage(request: Request):
    return request.app.state.storage


def require_admin(authorization: str | None = Header(default=None)) -> None:
    expected = os.getenv("ADMIN_TOKEN", "")
    if not expected:
        raise HTTPException(status_code=503, detail="ADMIN_TOKEN is not configured")
    supplied = authorization.removeprefix("Bearer ") if authorization else ""
    if not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="Invalid admin token")


def ensure_site(db) -> dict:
    db.site_settings.update_one(
        {"_id": "homepage"},
        {"$setOnInsert": {"content": copy.deepcopy(DEFAULT_SITE), "version": uuid.uuid4().hex, "updated_at": now()}},
        upsert=True,
    )
    doc = db.site_settings.find_one({"_id": "homepage"})
    content = with_defaults(doc["content"], DEFAULT_SITE)
    if content != doc["content"]:
        db.site_settings.update_one({"_id": "homepage"}, {"$set": {"content": content}})
        doc["content"] = content
    return doc


def with_defaults(value: Any, example: Any) -> Any:
    """Add fields introduced in DEFAULT_SITE to content saved by an older version."""
    if isinstance(example, dict) and isinstance(value, dict):
        return {**value, **{key: with_defaults(value[key], sample) if key in value else copy.deepcopy(sample) for key, sample in example.items()}}
    if isinstance(example, list) and isinstance(value, list) and example:
        return [with_defaults(item, example[0]) for item in value]
    return value


def site_response(doc: dict, db) -> dict:
    ids: set[str] = set()

    def collect(value: Any):
        if isinstance(value, dict):
            for child in value.values():
                collect(child)
        elif isinstance(value, list):
            for child in value:
                collect(child)
        elif isinstance(value, str) and ObjectId.is_valid(value):
            ids.add(value)

    collect(doc["content"])
    media = {
        str(item["_id"]): {"mime_type": item["mime_type"], "filename": item["filename"]}
        for item in db.media_assets.find({"_id": {"$in": [ObjectId(x) for x in ids]}})
    } if ids else {}
    return {"content": doc["content"], "version": doc["version"], "updated_at": doc["updated_at"], "media": media}


def check_shape(value: Any, example: Any, path: str = "content") -> None:
    """Keep public rendering stable while allowing list items to be added or removed."""
    if isinstance(example, dict):
        if not isinstance(value, dict) or set(value) != set(example):
            raise ValueError(f"{path}: fields do not match the expected schema")
        for key, sample in example.items():
            check_shape(value[key], sample, f"{path}.{key}")
    elif isinstance(example, list):
        if not isinstance(value, list) or len(value) > 30:
            raise ValueError(f"{path}: invalid list")
        for index, item in enumerate(value):
            check_shape(item, example[0], f"{path}[{index}]")
    elif not isinstance(value, str) or len(value) > 5000:
        raise ValueError(f"{path}: must be a string of at most 5000 characters")


class SiteUpdate(BaseModel):
    content: dict[str, Any]
    version: str = Field(min_length=1)


class ContactMessage(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(max_length=255)
    message: str = Field(min_length=5, max_length=5000)


class NewsletterEmail(BaseModel):
    email: str = Field(max_length=255)


def clean_email(email: str) -> str:
    email = email.strip().lower()
    if not EMAIL_PATTERN.fullmatch(email):
        raise HTTPException(status_code=422, detail="Invalid email address")
    return email


@dataclass
class Submission:
    data: dict[str, Any]
    return_url: str | None = None


async def read_submission(request: Request) -> Submission:
    """Scripts post JSON; plain HTML forms post form fields and are redirected back to the page."""
    if not request.headers.get("content-type", "").startswith(("application/x-www-form-urlencoded", "multipart/form-data")):
        try:
            data = await request.json()
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="Invalid JSON body") from exc
        return Submission(data if isinstance(data, dict) else {})
    data = {key: value for key, value in (await request.form()).items() if isinstance(value, str)}
    form_name = data.pop("return_to", "")
    referer = urlsplit(request.headers.get("referer", ""))
    if not FORM_NAME_PATTERN.fullmatch(form_name) or f"{referer.scheme}://{referer.netloc}" not in ALLOWED_ORIGINS:
        return Submission(data)
    return Submission(data, f"{referer._replace(fragment='').geturl()}#{form_name}")


def complete_submission(submission: Submission, save: Callable[[], dict]):
    try:
        result = save()
    except (ValidationError, HTTPException) as exc:
        if submission.return_url:
            return RedirectResponse(f"{submission.return_url}-error", status_code=303)
        if isinstance(exc, ValidationError):
            raise RequestValidationError(exc.errors(include_url=False)) from exc
        raise
    if submission.return_url:
        return RedirectResponse(f"{submission.return_url}-done", status_code=303)
    return result


@app.get("/api/health")
def health(db=Depends(database)):
    db.command("ping")
    return {"status": "ok"}


@app.get("/api/site")
def get_site(db=Depends(database)):
    return site_response(ensure_site(db), db)


@app.get("/api/admin/site", dependencies=[Depends(require_admin)])
def admin_get_site(db=Depends(database)):
    return site_response(ensure_site(db), db)


@app.put("/api/admin/site", dependencies=[Depends(require_admin)])
def update_site(payload: SiteUpdate, db=Depends(database)):
    try:
        check_shape(payload.content, DEFAULT_SITE)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    updated = db.site_settings.find_one_and_update(
        {"_id": "homepage", "version": payload.version},
        {"$set": {"content": payload.content, "version": uuid.uuid4().hex, "updated_at": now()}},
        return_document=ReturnDocument.AFTER,
    )
    if updated is None:
        raise HTTPException(status_code=409, detail="Content has changed. Reload before saving.")
    return site_response(updated, db)


@app.post("/api/contact", status_code=201)
def submit_contact(submission: Submission = Depends(read_submission), db=Depends(database)):
    def save():
        payload = ContactMessage.model_validate(submission.data)
        db.contact_messages.insert_one({
            "name": payload.name.strip(), "email": clean_email(payload.email),
            "message": payload.message.strip(), "created_at": now(),
        })
        return {"message": "Message sent"}
    return complete_submission(submission, save)


@app.post("/api/newsletter", status_code=201)
def subscribe(submission: Submission = Depends(read_submission), db=Depends(database)):
    def save():
        payload = NewsletterEmail.model_validate(submission.data)
        try:
            db.newsletter_subscriptions.insert_one({"email": clean_email(payload.email), "created_at": now()})
        except DuplicateKeyError:
            return {"message": "Email already subscribed"}
        return {"message": "Subscribed"}
    return complete_submission(submission, save)


def public_record(doc: dict) -> dict:
    return {"id": str(doc["_id"]), **{key: value for key, value in doc.items() if key != "_id"}}


@app.get("/api/admin/messages", dependencies=[Depends(require_admin)])
def list_messages(db=Depends(database)):
    return [public_record(x) for x in db.contact_messages.find().sort("created_at", -1).limit(100)]


@app.get("/api/admin/subscribers", dependencies=[Depends(require_admin)])
def list_subscribers(db=Depends(database)):
    return [public_record(x) for x in db.newsletter_subscriptions.find().sort("created_at", -1).limit(100)]


@app.get("/api/admin/media", dependencies=[Depends(require_admin)])
def list_media(db=Depends(database)):
    return [public_record(x) for x in db.media_assets.find().sort("created_at", -1).limit(300)]


def detected_type(header: bytes) -> str | None:
    if header.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if header.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if header.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    if header.startswith(b"RIFF") and header[8:12] == b"WEBP":
        return "image/webp"
    if header[4:8] == b"ftyp":
        return "video/mp4"
    if header.startswith(b"\x1a\x45\xdf\xa3"):
        return "video/webm"
    return None


@app.post("/api/admin/media", dependencies=[Depends(require_admin)], status_code=201)
def upload_media(file: UploadFile = File(...), db=Depends(database), minio=Depends(storage)):
    handle = file.file
    handle.seek(0, 2)
    size = handle.tell()
    handle.seek(0)
    if size == 0 or size > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"File must be smaller than {MAX_UPLOAD_BYTES // 1024 // 1024} MB")
    mime = detected_type(handle.read(16))
    handle.seek(0)
    if not mime:
        raise HTTPException(status_code=415, detail="Only JPEG, PNG, GIF, WebP, MP4 or WebM files are accepted")
    object_name = f"uploads/{uuid.uuid4().hex}"
    minio.put_object(MINIO_BUCKET, object_name, handle, size, content_type=mime)
    record = {
        "filename": Path(file.filename or "media").name[:255], "mime_type": mime,
        "size": size, "object_name": object_name, "created_at": now(),
    }
    try:
        result = db.media_assets.insert_one(record)
    except Exception:
        minio.remove_object(MINIO_BUCKET, object_name)
        raise
    return public_record({"_id": result.inserted_id, **record})


def find_media(media_id: str, db) -> dict:
    if not ObjectId.is_valid(media_id):
        raise HTTPException(status_code=404, detail="Media not found")
    record = db.media_assets.find_one({"_id": ObjectId(media_id)})
    if not record:
        raise HTTPException(status_code=404, detail="Media not found")
    return record


@app.get("/api/media/{media_id}/file")
def get_media(media_id: str, range_header: str | None = Header(default=None, alias="Range"), db=Depends(database), minio=Depends(storage)):
    record = find_media(media_id, db)
    size = record["size"]
    start, end = 0, size - 1
    if range_header:
        match = re.fullmatch(r"bytes=(\d*)-(\d*)", range_header.strip())
        if not match or (not match[1] and not match[2]):
            raise HTTPException(status_code=416, detail="Invalid range", headers={"Content-Range": f"bytes */{size}"})
        if match[1]:
            start = int(match[1])
            end = min(int(match[2]), size - 1) if match[2] else size - 1
        else:
            start = max(0, size - int(match[2]))
        if start >= size or end < start:
            raise HTTPException(status_code=416, detail="Range not satisfiable", headers={"Content-Range": f"bytes */{size}"})
    length = end - start + 1
    response = minio.get_object(MINIO_BUCKET, record["object_name"], offset=start, length=length)

    def chunks():
        try:
            while data := response.read(1024 * 1024):
                yield data
        finally:
            response.close()
            response.release_conn()

    headers = {
        "Content-Length": str(length),
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
        "Accept-Ranges": "bytes",
    }
    if range_header:
        headers["Content-Range"] = f"bytes {start}-{end}/{size}"
    return StreamingResponse(chunks(), status_code=206 if range_header else 200, media_type=record["mime_type"], headers=headers)


def references_media(value: Any, media_id: str) -> bool:
    if isinstance(value, dict):
        return any(references_media(v, media_id) for v in value.values())
    if isinstance(value, list):
        return any(references_media(v, media_id) for v in value)
    return value == media_id


@app.delete("/api/admin/media/{media_id}", dependencies=[Depends(require_admin)])
def delete_media(media_id: str, db=Depends(database), minio=Depends(storage)):
    record = find_media(media_id, db)
    if references_media(ensure_site(db)["content"], media_id):
        raise HTTPException(status_code=409, detail="Media is in use on the homepage")
    minio.remove_object(MINIO_BUCKET, record["object_name"])
    db.media_assets.delete_one({"_id": record["_id"]})
    return {"message": "Media deleted"}
