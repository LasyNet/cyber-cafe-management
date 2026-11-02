"""Company-scoped authorization policy defaults."""

from typing import Final

# Employees receive safe operational access by default. Company administrators
# bypass these defaults and may define per-employee overrides.
DEFAULT_EMPLOYEE_PERMISSIONS: Final[dict[str, bool]] = {
    "computers.read": True,
    "computers.create": False,
    "computers.update": False,
    "computers.delete": False,
    "sessions.read": True,
    "sessions.create": True,
    "sessions.update": True,
    "clients.read": True,
    "clients.create": True,
    "clients.update": True,
    "clients.delete": False,
    "payments.read": True,
    "payments.create": True,
    "payments.update": False,
    "settings.read": True,
    "settings.update": False,
}

PERMISSION_GROUPS: Final[dict[str, tuple[str, ...]]] = {
    "computers": ("read", "create", "update", "delete"),
    "sessions": ("read", "create", "update"),
    "clients": ("read", "create", "update", "delete"),
    "payments": ("read", "create", "update"),
    "settings": ("read", "update"),
}

ALL_PERMISSIONS: Final[tuple[str, ...]] = tuple(
    f"{module}.{action}"
    for module, actions in PERMISSION_GROUPS.items()
    for action in actions
)
