"""Create a staff account for initial provisioning or administration.

Run from backend/: python scripts/create_user.py
The password is prompted without echo and is never written to source control.
"""

import getpass
import sys

from sqlalchemy import func, select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models import User


def main() -> int:
    """Prompt for staff details and insert a user account."""
    full_name = input("Nom complet : ").strip()
    email = input("E-mail : ").strip().lower()
    role = input("Rôle (admin/employee) [employee] : ").strip().lower() or "employee"
    if not full_name or "@" not in email or role not in {"admin", "employee"}:
        print("Nom, e-mail ou rôle invalide.", file=sys.stderr)
        return 2

    password = getpass.getpass("Mot de passe (12 caractères minimum) : ")
    confirmation = getpass.getpass("Confirmer le mot de passe : ")
    if password != confirmation:
        print("Les mots de passe ne correspondent pas.", file=sys.stderr)
        return 2
    try:
        password_hash = hash_password(password)
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    with SessionLocal() as db:
        if db.scalar(select(User.id).where(func.lower(User.email) == email)):
            print("Un compte avec cet e-mail existe déjà.", file=sys.stderr)
            return 2
        user = User(
            full_name=full_name,
            email=email,
            role=role,
            password_hash=password_hash,
            is_active=True,
        )
        db.add(user)
        db.commit()
        print(f"Compte créé : {user.email} ({user.role})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
