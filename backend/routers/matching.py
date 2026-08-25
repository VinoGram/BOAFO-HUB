from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.auth import require_user, get_current_user
import backend.crud as crud
from typing import Optional

router = APIRouter(prefix="/api/matching", tags=["matching"])


@router.get("/smart-match")
def smart_match(jobId: int, request: Request, db: Session = Depends(get_db)):
    require_user(request)
    if not db:
        raise HTTPException(503, "Database unavailable")
    job = crud.get_job_by_id(db, jobId)
    if not job:
        raise HTTPException(404, "Job not found")
    providers = crud.search_providers_by_category(db, job["tradeCategoryId"], 100, 0)
    scored = []
    for p in providers:
        score = 0
        score += (float(p.get("averageRating") or 0) / 5) * 30
        if p.get("verificationStatus") not in ("unverified", "pending"):
            score += 20
        score += min((int(p.get("yearsOfExperience") or 0) / 10) * 20, 20)
        score += 15
        scored.append({**p, "matchScore": score})
    scored.sort(key=lambda x: x["matchScore"], reverse=True)
    return scored[:10]


@router.get("/search-jobs")
def search_jobs(
    tradeCategoryId: Optional[int] = None,
    limit: int = Query(20),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    if not db:
        return []
    if tradeCategoryId:
        return crud.get_jobs_by_category(db, tradeCategoryId, limit, offset)
    return []


@router.get("/search-providers")
def search_providers(
    tradeCategoryId: Optional[int] = None,
    minRating: Optional[float] = None,
    verified: Optional[bool] = None,
    sortBy: Optional[str] = None,
    limit: int = Query(20),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    if not db:
        return []
    if not tradeCategoryId:
        return []
    results = crud.search_providers_by_category(db, tradeCategoryId, limit, offset)
    if minRating is not None:
        results = [p for p in results if float(p.get("averageRating") or 0) >= minRating]
    if verified:
        results = [p for p in results if p.get("verificationStatus") not in ("unverified", "pending")]
    if sortBy == "rating":
        results.sort(key=lambda p: float(p.get("averageRating") or 0), reverse=True)
    elif sortBy == "experience":
        results.sort(key=lambda p: int(p.get("yearsOfExperience") or 0), reverse=True)
    return results


@router.get("/job-detail/{job_id}")
def get_job_detail(job_id: int, request: Request, db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(503, "Database unavailable")
    job = crud.get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(404, "Not found")
    user = get_current_user(request)
    suggested = []
    if user:
        suggested = crud.search_providers_by_category(db, job["tradeCategoryId"], 10, 0)
    return {**job, "suggestedProviders": suggested}
