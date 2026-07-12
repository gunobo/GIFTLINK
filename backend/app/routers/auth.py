from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_current_admin, hash_password, verify_password
from app.database import get_db
from app.models.admin import Admin
from app.schemas.auth import LoginRequest, PasswordChangeRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.username == payload.username).first()
    if not admin or not verify_password(payload.password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="아이디 또는 비밀번호가 올바르지 않습니다.")

    token = create_access_token(subject=admin.username)
    return TokenResponse(access_token=token)


@router.patch("/password")
def change_password(
    payload: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_admin: str = Depends(get_current_admin),
):
    admin = db.query(Admin).filter(Admin.username == current_admin).first()
    if not admin or not verify_password(payload.current_password, admin.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="현재 비밀번호가 올바르지 않습니다.")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="새 비밀번호는 8자 이상이어야 합니다.")

    admin.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"detail": "비밀번호가 변경되었습니다."}
