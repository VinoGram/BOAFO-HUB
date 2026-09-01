from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import os

load_dotenv()

from backend.routers import (
    auth, oauth, categories, providers, customers,
    jobs, bookings, reviews, chat, notifications, payments, matching,
    documents, availability, reports, profile, feed, direct_chat,
)

app = FastAPI(title="BOAFO Marketplace API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in [
    auth, oauth, categories, providers, customers,
    jobs, bookings, reviews, chat, notifications, payments, matching,
    documents, availability, reports, profile, feed, direct_chat,
]:
    app.include_router(module.router)

# Serve uploaded files
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/api/health")
def health():
    return {"status": "ok"}
