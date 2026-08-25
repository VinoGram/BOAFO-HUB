from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.auth import require_user, get_current_user
import backend.crud as crud
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("")
def list_categories(db: Session = Depends(get_db)):
    if not db:
        return []
    return crud.get_trade_categories(db)


@router.get("/{category_id}")
def get_category(category_id: int, db: Session = Depends(get_db)):
    if not db:
        raise HTTPException(404, "Not found")
    cat = crud.get_trade_category_by_id(db, category_id)
    if not cat:
        raise HTTPException(404, "Not found")
    return cat
