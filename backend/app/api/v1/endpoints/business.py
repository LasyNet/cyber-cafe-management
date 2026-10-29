# ruff: noqa: B008
"""Database-backed CRUD endpoints for the cyber-café domain.

These endpoints intentionally centralize validation and transaction handling. Production
deployment must put them behind the application's authentication/authorization layer before
the frontend switches from demo mode to persisted data.
"""

from datetime import UTC, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import AppSetting, CafeSession, Client, Computer, Payment
from app.schemas.business import (
    ClientCreate,
    ClientRead,
    ClientUpdate,
    ComputerCreate,
    ComputerRead,
    ComputerUpdate,
    PaymentCreate,
    PaymentRead,
    PaymentUpdate,
    SessionCreate,
    SessionRead,
    SessionUpdate,
    SettingsRead,
    SettingsUpdate,
)

router = APIRouter(tags=["business"])


def _commit(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="La modification entre en conflit avec les données existantes.",
        ) from exc


def _get_or_404(db: Session, model: type, resource_id: str):
    instance = db.get(model, resource_id)
    if instance is None:
        raise HTTPException(status_code=404, detail="Ressource introuvable.")
    return instance


@router.get("/clients", response_model=list[ClientRead])
def list_clients(db: Session = Depends(get_db)):
    return db.scalars(select(Client).order_by(Client.created_at.desc())).all()


@router.post("/clients", response_model=ClientRead, status_code=status.HTTP_201_CREATED)
def create_client(payload: ClientCreate, db: Session = Depends(get_db)):
    client = Client(**payload.model_dump())
    db.add(client)
    _commit(db)
    db.refresh(client)
    return client


@router.get("/clients/{client_id}", response_model=ClientRead)
def get_client(client_id: str, db: Session = Depends(get_db)):
    return _get_or_404(db, Client, client_id)


@router.patch("/clients/{client_id}", response_model=ClientRead)
def update_client(client_id: str, payload: ClientUpdate, db: Session = Depends(get_db)):
    client = _get_or_404(db, Client, client_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(client, key, value)
    _commit(db)
    db.refresh(client)
    return client


@router.delete("/clients/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(client_id: str, db: Session = Depends(get_db)):
    client = _get_or_404(db, Client, client_id)
    db.delete(client)
    _commit(db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/computers", response_model=list[ComputerRead])
def list_computers(db: Session = Depends(get_db)):
    return db.scalars(select(Computer).order_by(Computer.name)).all()


@router.post("/computers", response_model=ComputerRead, status_code=status.HTTP_201_CREATED)
def create_computer(payload: ComputerCreate, db: Session = Depends(get_db)):
    data = payload.model_dump()
    if data["computer_type"] == "Interne" and not data["mac_address"]:
        raise HTTPException(
            status_code=422,
            detail="Une adresse MAC est obligatoire pour un poste interne.",
        )
    if data["computer_type"] == "Externe":
        data["mac_address"] = None
    computer = Computer(**data)
    db.add(computer)
    _commit(db)
    db.refresh(computer)
    return computer


@router.get("/computers/{computer_id}", response_model=ComputerRead)
def get_computer(computer_id: str, db: Session = Depends(get_db)):
    return _get_or_404(db, Computer, computer_id)


@router.patch("/computers/{computer_id}", response_model=ComputerRead)
def update_computer(computer_id: str, payload: ComputerUpdate, db: Session = Depends(get_db)):
    computer = _get_or_404(db, Computer, computer_id)
    data = payload.model_dump(exclude_unset=True)
    new_type = data.get("computer_type", computer.computer_type)
    new_mac = data.get("mac_address", computer.mac_address)
    if new_type == "Interne" and not new_mac:
        raise HTTPException(
            status_code=422,
            detail="Une adresse MAC est obligatoire pour un poste interne.",
        )
    if new_type == "Externe":
        data["mac_address"] = None
    for key, value in data.items():
        setattr(computer, key, value)
    _commit(db)
    db.refresh(computer)
    return computer


@router.delete("/computers/{computer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_computer(computer_id: str, db: Session = Depends(get_db)):
    computer = _get_or_404(db, Computer, computer_id)
    if db.scalar(
        select(CafeSession.id).where(
            CafeSession.computer_id == computer_id,
            CafeSession.status == "En cours",
        )
    ):
        raise HTTPException(
            status_code=409,
            detail="Terminez la session active avant de supprimer ce poste.",
        )
    db.delete(computer)
    _commit(db)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/sessions", response_model=list[SessionRead])
def list_sessions(db: Session = Depends(get_db)):
    return db.scalars(select(CafeSession).order_by(CafeSession.started_at.desc())).all()


@router.post("/sessions", response_model=SessionRead, status_code=status.HTTP_201_CREATED)
def create_session(payload: SessionCreate, db: Session = Depends(get_db)):
    computer = _get_or_404(db, Computer, payload.computer_id)
    _get_or_404(db, Client, payload.client_id)
    if computer.status != "Disponible":
        raise HTTPException(
            status_code=409, detail="Cet ordinateur n'est pas disponible."
        )
    session = CafeSession(**payload.model_dump())
    computer.status = "En cours"
    db.add(session)
    _commit(db)
    db.refresh(session)
    return session


@router.get("/sessions/{session_id}", response_model=SessionRead)
def get_session(session_id: str, db: Session = Depends(get_db)):
    return _get_or_404(db, CafeSession, session_id)


@router.patch("/sessions/{session_id}", response_model=SessionRead)
def update_session(session_id: str, payload: SessionUpdate, db: Session = Depends(get_db)):
    session = _get_or_404(db, CafeSession, session_id)
    data = payload.model_dump(exclude_unset=True)
    if data.get("status") == "Terminée" and not data.get("ended_at"):
        data["ended_at"] = datetime.now(UTC)
    if data.get("status") == "En cours":
        raise HTTPException(
            status_code=422,
            detail="Une session terminée ne peut pas être réactivée.",
        )
    for key, value in data.items():
        setattr(session, key, value)
    if session.status == "Terminée":
        computer = _get_or_404(db, Computer, session.computer_id)
        if computer.status == "En cours":
            computer.status = "Disponible"
    _commit(db)
    db.refresh(session)
    return session


@router.get("/payments", response_model=list[PaymentRead])
def list_payments(db: Session = Depends(get_db)):
    return db.scalars(select(Payment).order_by(Payment.created_at.desc())).all()


@router.post("/payments", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
def create_payment(payload: PaymentCreate, db: Session = Depends(get_db)):
    session = _get_or_404(db, CafeSession, payload.session_id)
    _get_or_404(db, Client, payload.client_id)
    if session.client_id != payload.client_id:
        raise HTTPException(
            status_code=422,
            detail="Le client du paiement doit correspondre à celui de la session.",
        )
    data = payload.model_dump()
    if data["status"] == "Payé" and data["paid_at"] is None:
        data["paid_at"] = datetime.now(UTC)
    payment = Payment(**data)
    db.add(payment)
    _commit(db)
    db.refresh(payment)
    return payment


@router.patch("/payments/{payment_id}", response_model=PaymentRead)
def update_payment(payment_id: str, payload: PaymentUpdate, db: Session = Depends(get_db)):
    payment = _get_or_404(db, Payment, payment_id)
    data = payload.model_dump(exclude_unset=True)
    if data.get("status") == "Payé" and not data.get("paid_at"):
        data["paid_at"] = datetime.now(UTC)
    for key, value in data.items():
        setattr(payment, key, value)
    _commit(db)
    db.refresh(payment)
    return payment


@router.get("/settings", response_model=SettingsRead)
def get_settings(db: Session = Depends(get_db)):
    settings = db.get(AppSetting, 1)
    if settings is None:
        settings = AppSetting(
            id=1,
            cafe_name="Cyber Café Central",
            hourly_rate=Decimal("1200"),
            currency="Ar",
        )
        db.add(settings)
        _commit(db)
        db.refresh(settings)
    return settings


@router.patch("/settings", response_model=SettingsRead)
def update_settings(payload: SettingsUpdate, db: Session = Depends(get_db)):
    settings = db.get(AppSetting, 1)
    if settings is None:
        settings = AppSetting(
            id=1,
            cafe_name="Cyber Café Central",
            hourly_rate=Decimal("1200"),
            currency="Ar",
        )
        db.add(settings)
    for key, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(settings, key, value)
    _commit(db)
    db.refresh(settings)
    return settings
