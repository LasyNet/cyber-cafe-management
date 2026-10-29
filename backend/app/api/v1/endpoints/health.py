"""Health-check endpoint."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health", summary="Check API availability")
def health_check() -> dict[str, str]:
    """Report that the API process is responding."""
    return {"status": "ok"}
