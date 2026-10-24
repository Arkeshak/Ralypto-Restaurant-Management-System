"""Ralypto API: tenant-scoped FastAPI service for the restaurant POS showcase."""
from __future__ import annotations

import hashlib
import secrets
import threading
from collections import defaultdict, deque
from datetime import date as calendar_date, datetime, time as wall_time, timedelta, timezone
from time import monotonic
from typing import Any
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from pydantic import BaseModel, ConfigDict, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from pwdlib import PasswordHash
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, JSON, create_engine, inspect, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, relationship, sessionmaker


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "sqlite:///./ralypto.db"
    jwt_secret: str = "dev-only-change-me-to-a-long-random-secret"
    jwt_refresh_secret: str = "dev-only-change-this-refresh-secret-too"
    access_token_minutes: int = 15
    refresh_token_days: int = 7
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    demo_mode: bool = True


settings = Settings()
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(engine, expire_on_commit=False)
password_hash = PasswordHash.recommended()


class Base(DeclarativeBase):
    pass


def uid() -> str:
    return str(uuid4())


class Restaurant(Base):
    __tablename__ = "restaurants"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    name: Mapped[str] = mapped_column(String(160))
    code: Mapped[str] = mapped_column(String(24), unique=True, index=True)
    currency: Mapped[str] = mapped_column(String(3), default="LKR")
    tax_rate: Mapped[int] = mapped_column(Integer, default=0)  # basis points
    service_charge_rate: Mapped[int] = mapped_column(Integer, default=1000)
    status: Mapped[str] = mapped_column(String(24), default="active")
    plan_code: Mapped[str] = mapped_column(String(16), default="standard")


class User(Base):
    __tablename__ = "users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    email: Mapped[str] = mapped_column(String(255), index=True)
    first_name: Mapped[str] = mapped_column(String(80))
    last_name: Mapped[str] = mapped_column(String(80))
    role: Mapped[str] = mapped_column(String(24), index=True)
    password_digest: Mapped[str] = mapped_column(String(255))
    pin_digest: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(40), default="")
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class ShowcaseRecord(Base):
    """Tenant-scoped persisted records for the operational showcase modules."""
    __tablename__ = "showcase_records"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    collection: Mapped[str] = mapped_column(String(32), index=True)
    data: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class RefreshSession(Base):
    __tablename__ = "refresh_sessions"
    jti: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)


class Category(Base):
    __tablename__ = "categories"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    icon: Mapped[str | None] = mapped_column(String(80), nullable=True)
    target_station: Mapped[str] = mapped_column(String(16), default="kitchen")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class MenuItem(Base):
    __tablename__ = "menu_items"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id"), index=True)
    name: Mapped[str] = mapped_column(String(140))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    aliases: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    price_cents: Mapped[int] = mapped_column(Integer)
    cost_cents: Mapped[int] = mapped_column(Integer, default=0)
    is_veg: Mapped[bool] = mapped_column(Boolean, default=False)
    is_spicy: Mapped[bool] = mapped_column(Boolean, default=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)


class DiningTable(Base):
    __tablename__ = "dining_tables"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    number: Mapped[str] = mapped_column(String(40))
    area_name: Mapped[str] = mapped_column(String(80), default="Main Hall")
    capacity: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), default="available")
    active_order_id: Mapped[str | None] = mapped_column(String(36), nullable=True)


class Order(Base):
    __tablename__ = "orders"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    order_number: Mapped[str] = mapped_column(String(32), index=True)
    table_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    order_type: Mapped[str] = mapped_column(String(24), default="dine_in")
    status: Mapped[str] = mapped_column(String(24), default="draft")
    source: Mapped[str] = mapped_column(String(24), default="pos")
    ai_assisted: Mapped[bool] = mapped_column(Boolean, default=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    subtotal_cents: Mapped[int] = mapped_column(Integer, default=0)
    discount_cents: Mapped[int] = mapped_column(Integer, default=0)
    tax_cents: Mapped[int] = mapped_column(Integer, default=0)
    service_charge_cents: Mapped[int] = mapped_column(Integer, default=0)
    total_cents: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    items: Mapped[list["OrderItem"]] = relationship(cascade="all, delete-orphan", lazy="selectin")


class OrderItem(Base):
    __tablename__ = "order_items"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"), index=True)
    menu_item_id: Mapped[str] = mapped_column(String(36))
    name: Mapped[str] = mapped_column(String(140))
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price_cents: Mapped[int] = mapped_column(Integer)
    subtotal_cents: Mapped[int] = mapped_column(Integer)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")


class KitchenTicket(Base):
    __tablename__ = "kitchen_tickets"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"), index=True)
    ticket_number: Mapped[str] = mapped_column(String(32))
    station: Mapped[str] = mapped_column(String(16), default="kitchen")
    status: Mapped[str] = mapped_column(String(20), default="new")
    fired_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Payment(Base):
    __tablename__ = "payments"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    order_id: Mapped[str] = mapped_column(ForeignKey("orders.id"), index=True)
    amount_cents: Mapped[int] = mapped_column(Integer)
    payment_method: Mapped[str] = mapped_column(String(24))
    status: Mapped[str] = mapped_column(String(20), default="completed")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Shift(Base):
    __tablename__ = "shifts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    opening_float_cents: Mapped[int] = mapped_column(Integer)
    closing_cash_cents: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="open")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(64))
    actor_type: Mapped[str] = mapped_column(String(16), default="user")
    resource_id: Mapped[str] = mapped_column(String(36))
    details: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Invoice(Base):
    __tablename__ = "invoices"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    invoice_number: Mapped[str] = mapped_column(String(40))
    amount_cents: Mapped[int] = mapped_column(Integer)
    total_cents: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(16), default="paid")
    due_date: Mapped[str] = mapped_column(String(10))


class Reservation(Base):
    __tablename__ = "reservations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    customer_name: Mapped[str] = mapped_column(String(120))
    customer_phone: Mapped[str] = mapped_column(String(32))
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    party_size: Mapped[int] = mapped_column(Integer)
    reservation_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=90)
    table_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(20), default="confirmed", index=True)
    source: Mapped[str] = mapped_column(String(24), default="staff")
    special_requests: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class WaitlistEntry(Base):
    __tablename__ = "waitlist"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    restaurant_id: Mapped[str] = mapped_column(ForeignKey("restaurants.id"), index=True)
    customer_name: Mapped[str] = mapped_column(String(120))
    customer_phone: Mapped[str] = mapped_column(String(32))
    party_size: Mapped[int] = mapped_column(Integer)
    estimated_wait_minutes: Mapped[int] = mapped_column(Integer, default=15)
    status: Mapped[str] = mapped_column(String(20), default="waiting", index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    notified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


Base.metadata.create_all(engine)

# `create_all` handles new tables but does not add columns to pre-existing demo
# databases. Keep the local showcase DB compatible as the model evolves.
def ensure_compatibility_columns() -> None:
    additions = {
        "menu_items": {"aliases": "JSON"},
        "orders": {"source": "VARCHAR(24) NOT NULL DEFAULT 'pos'", "ai_assisted": "BOOLEAN NOT NULL DEFAULT FALSE"},
        "audit_logs": {"actor_type": "VARCHAR(16) NOT NULL DEFAULT 'user'"},
        "users": {"phone": "VARCHAR(40) NOT NULL DEFAULT ''"},
    }
    with engine.begin() as connection:
        for table_name, columns in additions.items():
            present = {column["name"] for column in inspect(connection).get_columns(table_name)}
            for column_name, column_type in columns.items():
                if column_name not in present:
                    connection.exec_driver_sql(f'ALTER TABLE "{table_name}" ADD COLUMN "{column_name}" {column_type}')


ensure_compatibility_columns()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_demo(db: Session) -> None:
    restaurant = db.scalar(select(Restaurant).where(Restaurant.code == "CEY101"))
    if restaurant:
        # Keep demo accounts additive so existing local databases receive newly
        # documented roles without resetting restaurant data.
        accountant = db.scalar(select(User).where(
            User.restaurant_id == restaurant.id, User.email == "accountant@ralypto.com"
        ))
        if not accountant:
            db.add(User(restaurant_id=restaurant.id, email="accountant@ralypto.com", first_name="Nimali",
                        last_name="Jayasuriya", role="accountant", password_digest=password_hash.hash("pass123"),
                        pin_digest=password_hash.hash("5555")))
            db.commit()
        return
    restaurant = Restaurant(name="Ceylon Spice Bistro", code="CEY101", currency="LKR", plan_code="standard")
    db.add(restaurant); db.flush()
    users = []
    for email, first, role, pin in [
        ("owner@ralypto.com", "Nimal", "owner", "1234"),
        ("cashier@ralypto.com", "Kasun", "cashier", "2222"),
        ("waiter@ralypto.com", "Amaya", "waiter", "3333"),
        ("kitchen@ralypto.com", "Sahan", "kitchen", "4444"),
        ("accountant@ralypto.com", "Nimali", "accountant", "5555"),
    ]:
        user = User(restaurant_id=restaurant.id, email=email, first_name=first, last_name="Perera", role=role,
                    password_digest=password_hash.hash("pass123"), pin_digest=password_hash.hash(pin))
        users.append(user); db.add(user)
    category_rows = [("Rice & Kottu", "Utensils", "kitchen"), ("Short Eats & Starters", "Soup", "kitchen"),
                     ("Beverages", "Coffee", "bar"), ("Desserts", "Cake", "kitchen")]
    categories = {}
    for i, (name, icon, station) in enumerate(category_rows):
        cat = Category(restaurant_id=restaurant.id, name=name, icon=icon, target_station=station, sort_order=i)
        db.add(cat); categories[name] = cat
    db.flush()
    menu = [
        ("Rice & Kottu", "Chicken Kottu", 145000, False, True), ("Rice & Kottu", "Beef Kottu", 175000, False, True),
        ("Rice & Kottu", "Egg Kottu", 110000, True, True), ("Rice & Kottu", "Cheese Kottu", 185000, True, True),
        ("Rice & Kottu", "Seafood Fried Rice", 160000, False, False), ("Rice & Kottu", "Chicken Fried Rice", 135000, False, False),
        ("Rice & Kottu", "Vegetable Biryani", 120000, True, True), ("Short Eats & Starters", "Hot Butter Cuttlefish", 220000, False, True),
        ("Short Eats & Starters", "Devilled Chicken", 150000, False, True), ("Short Eats & Starters", "Vegetable Spring Rolls", 75000, True, False),
        ("Short Eats & Starters", "Fish Cutlets 4pcs", 65000, False, False), ("Short Eats & Starters", "Mutton Rolls 2pcs", 85000, False, True),
        ("Beverages", "Fresh Lime Juice", 45000, True, False), ("Beverages", "Falooda Special", 65000, True, False),
        ("Beverages", "King Coconut Water", 35000, True, False), ("Beverages", "Iced Milo Dinosaur", 55000, True, False),
        ("Beverages", "Ceylon Milk Tea", 25000, True, False), ("Desserts", "Watalappan with Cashews", 55000, True, False),
        ("Desserts", "Curd & Treacle", 45000, True, False), ("Desserts", "Caramel Pudding", 40000, True, False),
    ]
    for cat, name, price, veg, spicy in menu:
        db.add(MenuItem(restaurant_id=restaurant.id, category_id=categories[cat].id, name=name,
                        description=f"Freshly prepared {name.lower()}.", price_cents=price,
                        is_veg=veg, is_spicy=spicy, is_available=True))
    for number, capacity, status in [("Table 1", 2, "available"), ("Table 2", 4, "available"), ("Table 3", 4, "available"),
                                     ("Table 4", 6, "available"), ("Table 5", 4, "occupied")]:
        db.add(DiningTable(restaurant_id=restaurant.id, number=number, capacity=capacity, status=status))
    db.add(Invoice(restaurant_id=restaurant.id, invoice_number="INV-2026-001", amount_cents=2450000,
                   total_cents=2450000, status="paid", due_date="2026-10-01"))
    db.commit()


def tenant_db(db: Session = Depends(get_db)):
    if settings.demo_mode:
        seed_demo(db)
    return db


def token_for(user: User, kind: str, lifetime: timedelta, *, jti: str | None = None) -> str:
    secret = settings.jwt_secret if kind == "access" else settings.jwt_refresh_secret
    claims = {"sub": user.id, "restaurant_id": user.restaurant_id, "role": user.role,
              "type": kind, "jti": jti or secrets.token_urlsafe(12), "exp": datetime.now(timezone.utc) + lifetime}
    return jwt.encode(claims, secret, algorithm="HS256")


def issue_refresh_token(db: Session, user: User) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_days)
    jti = secrets.token_urlsafe(12)
    db.add(RefreshSession(jti=jti, user_id=user.id, restaurant_id=user.restaurant_id, expires_at=expires_at))
    db.commit()
    return token_for(user, "refresh", timedelta(days=settings.refresh_token_days), jti=jti)


def serialize_user(user: User):
    return {"id": user.id, "email": user.email, "firstName": user.first_name, "lastName": user.last_name,
            "role": user.role, "restaurantId": user.restaurant_id}


PLANS = {"basic": ("Basic Plan", 1250000), "standard": ("Standard Plan", 2450000), "premium": ("Premium Plan", 4800000)}
FLAGS = ["pos_billing", "kitchen_display", "qr_menu_view", "qr_self_order", "waiter_app", "inventory_management",
         "delivery_integration", "advanced_reports", "accounting_ledger", "hr_payroll", "multi_branch", "ai_assistant",
         "ai_stock_prediction", "ai_menu_builder"]
PLAN_FLAGS = {
    "basic": {"pos_billing", "kitchen_display", "qr_menu_view"},
    # The Standard showcase tenant exposes the complete operational demo so
    # reviewers can exercise its screens without a paid-plan upgrade flow.
    "standard": set(FLAGS),
    "premium": set(FLAGS),
}


def session_payload(db: Session, user: User):
    restaurant = db.scalar(select(Restaurant).where(Restaurant.id == user.restaurant_id))
    plan_code = restaurant.plan_code
    plan_name, price = PLANS[plan_code]
    return {"user": serialize_user(user), "restaurant": {"id": restaurant.id, "name": restaurant.name, "code": restaurant.code,
            "currency": restaurant.currency, "taxRate": restaurant.tax_rate / 10000, "serviceChargeRate": restaurant.service_charge_rate / 10000},
            "plan": {"id": f"plan-{plan_code}", "code": plan_code, "name": plan_name, "monthlyPriceCents": price},
            "featureFlags": {key: key in PLAN_FLAGS[plan_code] for key in FLAGS}}


def current_user(authorization: str | None = Header(default=None), db: Session = Depends(tenant_db)) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Bearer token required")
    try:
        claims = jwt.decode(authorization.split(" ", 1)[1], settings.jwt_secret, algorithms=["HS256"])
        if claims.get("type") != "access": raise ValueError("wrong token type")
        user = db.scalar(select(User).where(User.id == claims["sub"], User.restaurant_id == claims["restaurant_id"], User.active.is_(True)))
    except (JWTError, ValueError, KeyError):
        raise HTTPException(401, "Invalid or expired access token")
    if not user: raise HTTPException(401, "User no longer active")
    return user


def require_roles(*roles: str):
    def guard(user: User = Depends(current_user)):
        if user.role not in roles: raise HTTPException(403, "Insufficient role permissions")
        return user
    return guard


def floor_staff_user(user: User = Depends(current_user)) -> User:
    if user.role not in {"owner", "manager", "cashier", "waiter"}:
        raise HTTPException(403, "This role cannot manage reservations or the waitlist")
    return user

def shift_staff_user(user: User = Depends(current_user)) -> User:
    if user.role not in {"owner", "manager", "cashier"}:
        raise HTTPException(403, "This role cannot manage cash shifts")
    return user

def report_user(user: User = Depends(current_user)) -> User:
    if user.role not in {"owner", "manager", "cashier", "accountant"}:
        raise HTTPException(403, "This role cannot access reports")
    return user

def kitchen_operator(user: User = Depends(current_user)) -> User:
    if user.role not in {"owner", "manager", "kitchen", "waiter"}:
        raise HTTPException(403, "This role cannot update kitchen tickets")
    return user


TOOL_RATE_LIMIT = 60
TOOL_RATE_WINDOW_SECONDS = 60
_tool_calls: dict[tuple[str, str], deque[float]] = defaultdict(deque)
_tool_calls_lock = threading.Lock()


def ai_tool_user(user: User = Depends(current_user)) -> User:
    if user.role not in {"owner", "manager", "cashier", "waiter", "accountant"}:
        raise HTTPException(403, "This role cannot access AI tools")
    with SessionLocal() as db:
        restaurant = db.scalar(select(Restaurant).where(Restaurant.id == user.restaurant_id))
        if not restaurant or "ai_assistant" not in PLAN_FLAGS.get(restaurant.plan_code, set()):
            raise HTTPException(403, "AI assistant is not enabled for this subscription")
    now = monotonic()
    bucket_key = (user.restaurant_id, user.id)
    with _tool_calls_lock:
        bucket = _tool_calls[bucket_key]
        while bucket and now - bucket[0] >= TOOL_RATE_WINDOW_SECONDS:
            bucket.popleft()
        if len(bucket) >= TOOL_RATE_LIMIT:
            retry_after = max(1, int(TOOL_RATE_WINDOW_SECONDS - (now - bucket[0])))
            raise HTTPException(429, "AI tool rate limit exceeded", headers={"Retry-After": str(retry_after)})
        bucket.append(now)
    return user


def require_tool_roles(user: User, *roles: str) -> None:
    if user.role not in roles:
        raise HTTPException(403, "Insufficient role permissions for this AI tool")


def manager_authorize(db: Session, user: User, pin: str | None, resource: str, resource_id: str, reason: str):
    if not pin or len(pin) != 4 or not pin.isdigit(): raise HTTPException(403, "Manager PIN required")
    managers = db.scalars(select(User).where(User.restaurant_id == user.restaurant_id, User.role.in_(["owner", "manager"]), User.active.is_(True))).all()
    manager = next((candidate for candidate in managers if password_hash.verify(pin, candidate.pin_digest)), None)
    if not manager: raise HTTPException(403, "Invalid manager PIN authorization")
    db.add(AuditLog(restaurant_id=user.restaurant_id, user_id=user.id, action=resource, resource_id=resource_id,
                    details={"authorizedBy": manager.id, "reason": reason, "initiatedBy": user.id}))


class LoginInput(BaseModel):
    email: str
    password: str

class PinLoginInput(BaseModel):
    restaurantCode: str
    pin: str = Field(pattern=r"^[0-9]{4}$")

class RefreshInput(BaseModel):
    refreshToken: str

class CategoryInput(BaseModel):
    name: str
    icon: str | None = None
    targetStation: str = "kitchen"

class MenuInput(BaseModel):
    categoryId: str
    name: str
    description: str | None = None
    priceCents: int = Field(ge=0)
    costCents: int = Field(default=0, ge=0)
    isVeg: bool = False
    isSpicy: bool = False
    isAvailable: bool = True

class MenuPatchInput(BaseModel):
    categoryId: str | None = None
    name: str | None = Field(default=None, min_length=1, max_length=140)
    description: str | None = None
    priceCents: int | None = Field(default=None, ge=0)
    costCents: int | None = Field(default=None, ge=0)
    isVeg: bool | None = None
    isSpicy: bool | None = None
    isAvailable: bool | None = None

class TableInput(BaseModel):
    number: str
    areaName: str = "Main Hall"
    capacity: int = Field(ge=1, le=50)

class StatusInput(BaseModel):
    status: str

class TableTransferInput(BaseModel):
    sourceTableId: str
    targetTableId: str
    managerPin: str | None = None

class LineInput(BaseModel):
    menuItemId: str
    quantity: int = Field(ge=1, le=100)
    notes: str | None = None

class OrderInput(BaseModel):
    tableId: str | None = None
    orderType: str = "dine_in"
    items: list[LineInput] = Field(min_length=1)
    clientCreatedUuid: str | None = None
    discountCents: int = Field(default=0, ge=0)
    serviceChargeEnabled: bool = True

class PaymentAllocationInput(BaseModel):
    paymentMethod: str
    amountCents: int = Field(ge=0)

class PayInput(BaseModel):
    paymentMethod: str
    tenderedCents: int | None = None
    amountCents: int | None = Field(default=None, ge=1)
    allocations: list[PaymentAllocationInput] | None = None

class VoidInput(BaseModel):
    reason: str = Field(min_length=3)
    managerPin: str | None = None

class RefundInput(BaseModel):
    managerPin: str
    reason: str = Field(min_length=3)
    refundedBy: str | None = None

class OrderItemsInput(BaseModel):
    items: list[LineInput] = Field(min_length=1)

class ShiftOpenInput(BaseModel):
    openingFloatCents: int = Field(ge=0)

class ShiftCloseInput(BaseModel):
    closingCashCents: int = Field(ge=0)

class ReservationInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    customer_name: str = Field(alias="customerName", min_length=2, max_length=120)
    customer_phone: str = Field(alias="customerPhone", min_length=5, max_length=32)
    customer_email: str | None = Field(default=None, alias="customerEmail", max_length=255)
    party_size: int = Field(alias="partySize", ge=1, le=30)
    reservation_time: datetime = Field(alias="reservationTime")
    duration_minutes: int = Field(default=90, alias="durationMinutes", ge=15, le=360)
    table_id: str | None = Field(default=None, alias="tableId")
    table_number: str | None = Field(default=None, alias="tableNumber")
    source: str = "staff"
    special_requests: str | None = Field(default=None, alias="specialRequests", max_length=1000)

class ReservationStatusInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    status: str
    table_id: str | None = Field(default=None, alias="tableId")

class WaitlistInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    customer_name: str = Field(alias="customerName", min_length=2, max_length=120)
    customer_phone: str = Field(alias="customerPhone", min_length=5, max_length=32)
    party_size: int = Field(alias="partySize", ge=1, le=30)
    estimated_wait_minutes: int = Field(default=15, alias="estimatedWaitMinutes", ge=1, le=360)
    notes: str | None = Field(default=None, max_length=1000)

class WaitlistStatusInput(BaseModel):
    status: str

class ToolOrderLine(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    menu_item_id: str = Field(alias="menuItemId")
    quantity: int = Field(ge=1, le=100)
    notes: str | None = None

class ToolDraftOrderInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    items: list[ToolOrderLine] = Field(min_length=1, max_length=50)
    table_id: str | None = Field(default=None, alias="tableId")
    table_number: str | None = Field(default=None, alias="tableNumber")
    order_type: str = Field(default="dine_in", alias="orderType")
    source: str = "voice_waiter"

class ToolDraftBookingInput(ReservationInput):
    pass

class ToolAvailabilityInput(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    party_size: int = Field(alias="partySize", ge=1, le=30)
    time_iso: datetime | None = Field(default=None, alias="timeIso")
    date: calendar_date | None = None
    time: wall_time | None = None
    duration_minutes: int = Field(default=90, alias="durationMinutes", ge=15, le=360)

class ToolMenuInput(BaseModel):
    category_id: str | None = Field(default=None, alias="categoryId")

class ToolAvailabilityLegacyInput(BaseModel):
    party_size: int = Field(ge=1, le=30)
    time_iso: datetime
    duration_minutes: int = Field(default=90, ge=15, le=360)


def category_json(c: Category):
    return {"id": c.id, "name": c.name, "icon": c.icon, "sortOrder": c.sort_order, "targetStation": c.target_station}

def item_json(db: Session, item: MenuItem):
    return {"id": item.id, "categoryId": item.category_id, "name": item.name, "description": item.description,
            "priceCents": item.price_cents, "costCents": item.cost_cents, "isVeg": item.is_veg, "isSpicy": item.is_spicy,
            "isAvailable": item.is_available, "modifiers": []}

def table_json(t: DiningTable):
    return {"id": t.id, "number": t.number, "areaName": t.area_name, "capacity": t.capacity, "status": t.status,
            "activeOrderId": t.active_order_id, "activeOrderTotalCents": None}

def order_json(db: Session, order: Order):
    table = db.scalar(select(DiningTable).where(DiningTable.id == order.table_id, DiningTable.restaurant_id == order.restaurant_id)) if order.table_id else None
    return {"id": order.id, "orderNumber": order.order_number, "tableId": order.table_id, "tableNumber": table.number if table else None,
            "orderType": order.order_type, "status": order.status,
            "items": [{"id": x.id, "menuItemId": x.menu_item_id, "name": x.name, "quantity": x.quantity,
                       "unitPriceCents": x.unit_price_cents, "subtotalCents": x.subtotal_cents, "notes": x.notes, "status": x.status} for x in order.items],
            "subtotalCents": order.subtotal_cents, "discountCents": order.discount_cents, "taxCents": order.tax_cents,
            "serviceChargeCents": order.service_charge_cents, "totalCents": order.total_cents, "clientCreatedUuid": None,
            "createdAt": order.created_at.isoformat()}


RESERVATION_STATUSES = {"pending", "confirmed", "seated", "completed", "cancelled", "no_show"}
RESERVATION_SOURCES = {"web", "web_voice", "whatsapp", "phone", "staff", "voice_agent"}
WAITLIST_STATUSES = {"waiting", "notified", "seated", "cancelled", "left"}


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def scoped_table(db: Session, restaurant_id: str, table_id: str | None = None,
                 table_number: str | None = None) -> DiningTable | None:
    if table_id:
        return db.scalar(select(DiningTable).where(
            DiningTable.id == table_id, DiningTable.restaurant_id == restaurant_id
        ))
    if table_number:
        return db.scalar(select(DiningTable).where(
            DiningTable.number == table_number, DiningTable.restaurant_id == restaurant_id
        ))
    return None


def has_reservation_conflict(db: Session, restaurant_id: str, table_id: str,
                             start: datetime, duration_minutes: int,
                             exclude_id: str | None = None) -> bool:
    query = select(Reservation).where(
        Reservation.restaurant_id == restaurant_id,
        Reservation.table_id == table_id,
        Reservation.status.in_(["pending", "confirmed", "seated"]),
    )
    if exclude_id:
        query = query.where(Reservation.id != exclude_id)
    requested_start = as_utc(start)
    requested_end = requested_start + timedelta(minutes=duration_minutes)
    for existing in db.scalars(query).all():
        existing_start = as_utc(existing.reservation_time)
        existing_end = existing_start + timedelta(minutes=existing.duration_minutes)
        if requested_start < existing_end and existing_start < requested_end:
            return True
    return False


def available_tables(db: Session, restaurant_id: str, party_size: int,
                     requested_at: datetime, duration_minutes: int) -> list[DiningTable]:
    candidates = db.scalars(select(DiningTable).where(
        DiningTable.restaurant_id == restaurant_id,
        DiningTable.capacity >= party_size,
        DiningTable.status == "available",
    ).order_by(DiningTable.capacity, DiningTable.number)).all()
    return [table for table in candidates if not has_reservation_conflict(
        db, restaurant_id, table.id, requested_at, duration_minutes
    )]


def reservation_json(db: Session, reservation: Reservation) -> dict[str, Any]:
    table = scoped_table(db, reservation.restaurant_id, table_id=reservation.table_id)
    return {"id": reservation.id, "restaurantId": reservation.restaurant_id,
            "customerName": reservation.customer_name, "customerPhone": reservation.customer_phone,
            "customerEmail": reservation.customer_email, "partySize": reservation.party_size,
            "reservationTime": as_utc(reservation.reservation_time).isoformat(),
            "durationMinutes": reservation.duration_minutes, "tableId": reservation.table_id,
            "tableNumber": table.number if table else None, "status": reservation.status,
            "source": reservation.source, "specialRequests": reservation.special_requests,
            "createdAt": as_utc(reservation.created_at).isoformat()}


def waitlist_json(entry: WaitlistEntry) -> dict[str, Any]:
    return {"id": entry.id, "restaurantId": entry.restaurant_id, "customerName": entry.customer_name,
            "customerPhone": entry.customer_phone, "partySize": entry.party_size,
            "estimatedWaitMinutes": entry.estimated_wait_minutes, "status": entry.status,
            "notes": entry.notes, "joinedAt": as_utc(entry.created_at).isoformat(),
            "notifiedAt": as_utc(entry.notified_at).isoformat() if entry.notified_at else None}


def reservation_for_input(db: Session, user: User, body: ReservationInput,
                          status: str, source_override: str | None = None,
                          ai_details: dict[str, Any] | None = None) -> Reservation:
    if body.source not in RESERVATION_SOURCES:
        raise HTTPException(422, "Unsupported reservation source")
    if body.table_id and body.table_number:
        table = scoped_table(db, user.restaurant_id, table_id=body.table_id)
        if table and table.number != body.table_number:
            raise HTTPException(422, "tableId and tableNumber refer to different tables")
    else:
        table = scoped_table(db, user.restaurant_id, body.table_id, body.table_number)
    if (body.table_id or body.table_number) and not table:
        raise HTTPException(404, "Table not found")
    requested_at = as_utc(body.reservation_time)
    if requested_at <= datetime.now(timezone.utc):
        raise HTTPException(422, "Reservation time must be in the future")
    if table and table.capacity < body.party_size:
        raise HTTPException(409, "Table capacity is too small for this party")
    if table and has_reservation_conflict(db, user.restaurant_id, table.id, requested_at, body.duration_minutes):
        raise HTTPException(409, "The selected table already has a reservation at that time")
    if not table:
        candidates = available_tables(db, user.restaurant_id, body.party_size, requested_at, body.duration_minutes)
        if not candidates:
            raise HTTPException(409, "No tables are available for this party at that time")
        # Claim a suitable table for the reservation so subsequent bookings
        # participate in conflict detection even when the caller omitted one.
        table = candidates[0]
    reservation = Reservation(
        restaurant_id=user.restaurant_id, customer_name=body.customer_name.strip(),
        customer_phone=body.customer_phone.strip(), customer_email=body.customer_email,
        party_size=body.party_size, reservation_time=requested_at,
        duration_minutes=body.duration_minutes, table_id=table.id if table else None,
        status=status, source=source_override or body.source,
        special_requests=body.special_requests,
    )
    db.add(reservation)
    db.flush()
    if ai_details is not None:
        db.add(AuditLog(restaurant_id=user.restaurant_id, user_id=user.id, actor_type="ai",
                        action="AI_DRAFT_BOOKING", resource_id=reservation.id,
                        details=ai_details))
    return reservation


class TenantSockets:
    def __init__(self): self.rooms: dict[str, set[WebSocket]] = {}
    async def connect(self, restaurant_id: str, socket: WebSocket):
        await socket.accept(); self.rooms.setdefault(restaurant_id, set()).add(socket)
    def disconnect(self, restaurant_id: str, socket: WebSocket):
        self.rooms.get(restaurant_id, set()).discard(socket)
    async def emit(self, restaurant_id: str, event: str, data: dict[str, Any]):
        message = {"event": event, "timestamp": datetime.now(timezone.utc).isoformat(), "data": data}
        for socket in list(self.rooms.get(restaurant_id, set())):
            try: await socket.send_json(message)
            except Exception: self.disconnect(restaurant_id, socket)


sockets = TenantSockets()
app = FastAPI(title="Ralypto Restaurant Management API", version="1.0.0", description="Tenant-scoped POS, menu, order, kitchen, and subscription API.")
app.add_middleware(CORSMiddleware, allow_origins=[x.strip() for x in settings.cors_origins.split(",")], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
api = "/api/v1"


@app.get("/health")
def health(): return {"status": "ok", "service": "ralypto-backend"}

@app.post(api + "/auth/login")
def login(body: LoginInput, db: Session = Depends(tenant_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower(), User.active.is_(True)))
    if not user or not password_hash.verify(body.password, user.password_digest): raise HTTPException(401, "Invalid email or password")
    return {"accessToken": token_for(user, "access", timedelta(minutes=settings.access_token_minutes)),
            "refreshToken": issue_refresh_token(db, user), **session_payload(db, user)}

@app.post(api + "/auth/pin-login")
def pin_login(body: PinLoginInput, db: Session = Depends(tenant_db)):
    restaurant = db.scalar(select(Restaurant).where(Restaurant.code == body.restaurantCode.upper()))
    if not restaurant: raise HTTPException(401, "Invalid restaurant code or PIN")
    users = db.scalars(select(User).where(User.restaurant_id == restaurant.id, User.active.is_(True))).all()
    user = next((candidate for candidate in users if password_hash.verify(body.pin, candidate.pin_digest)), None)
    if not user: raise HTTPException(401, "Invalid restaurant code or PIN")
    return {"accessToken": token_for(user, "access", timedelta(minutes=settings.access_token_minutes)),
            "refreshToken": issue_refresh_token(db, user), **session_payload(db, user)}

@app.post(api + "/auth/refresh")
def refresh(body: RefreshInput, db: Session = Depends(tenant_db)):
    try:
        claims = jwt.decode(body.refreshToken, settings.jwt_refresh_secret, algorithms=["HS256"])
        if claims.get("type") != "refresh" or not claims.get("jti"): raise ValueError()
        user = db.scalar(select(User).where(User.id == claims["sub"], User.restaurant_id == claims["restaurant_id"], User.active.is_(True)))
    except (JWTError, ValueError, KeyError): raise HTTPException(401, "Invalid or expired refresh token")
    if not user: raise HTTPException(401, "User no longer active")
    session = db.get(RefreshSession, claims["jti"])
    # Accept a still-signed legacy token once during rollout, then persist its
    # revocation so any subsequent replay is rejected.
    if session and (session.revoked or session.user_id != user.id or session.restaurant_id != user.restaurant_id):
        raise HTTPException(401, "Refresh token has already been used")
    if not session:
        session = RefreshSession(jti=claims["jti"], user_id=user.id, restaurant_id=user.restaurant_id,
                                 expires_at=datetime.fromtimestamp(claims["exp"], timezone.utc))
        db.add(session)
    session.revoked = True
    db.add(session)
    next_jti = secrets.token_urlsafe(12)
    next_expiry = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_days)
    db.add(RefreshSession(jti=next_jti, user_id=user.id, restaurant_id=user.restaurant_id, expires_at=next_expiry))
    db.commit()
    return {"accessToken": token_for(user, "access", timedelta(minutes=settings.access_token_minutes)),
            "refreshToken": token_for(user, "refresh", timedelta(days=settings.refresh_token_days), jti=next_jti)}

@app.get(api + "/auth/me")
def me(user: User = Depends(current_user), db: Session = Depends(tenant_db)): return session_payload(db, user)

@app.get(api + "/menu/categories")
def categories(user: User = Depends(current_user), db: Session = Depends(tenant_db)):
    return [category_json(x) for x in db.scalars(select(Category).where(Category.restaurant_id == user.restaurant_id).order_by(Category.sort_order)).all()]

@app.post(api + "/menu/categories", status_code=201)
def create_category(body: CategoryInput, user: User = Depends(require_roles("owner", "manager")), db: Session = Depends(tenant_db)):
    if body.targetStation not in ("kitchen", "bar"): raise HTTPException(400, "targetStation must be kitchen or bar")
    row = Category(restaurant_id=user.restaurant_id, name=body.name, icon=body.icon, target_station=body.targetStation)
    db.add(row); db.commit(); db.refresh(row); return category_json(row)

@app.get(api + "/menu/items")
def menu_items(categoryId: str | None = None, search: str | None = None, user: User = Depends(current_user), db: Session = Depends(tenant_db)):
    q = select(MenuItem).where(MenuItem.restaurant_id == user.restaurant_id)
    if categoryId: q = q.where(MenuItem.category_id == categoryId)
    if search: q = q.where(MenuItem.name.ilike(f"%{search}%"))
    return [item_json(db, x) for x in db.scalars(q.order_by(MenuItem.name)).all()]

@app.post(api + "/menu/items", status_code=201)
def create_menu_item(body: MenuInput, user: User = Depends(require_roles("owner", "manager")), db: Session = Depends(tenant_db)):
    category = db.scalar(select(Category).where(Category.id == body.categoryId, Category.restaurant_id == user.restaurant_id))
    if not category: raise HTTPException(400, "Category not found")
    row = MenuItem(restaurant_id=user.restaurant_id, category_id=category.id, name=body.name, description=body.description,
                   price_cents=body.priceCents, cost_cents=body.costCents, is_veg=body.isVeg, is_spicy=body.isSpicy, is_available=body.isAvailable)
    db.add(row); db.commit(); db.refresh(row); return item_json(db, row)

@app.patch(api + "/menu/items/{item_id}")
def update_menu_item(item_id: str, body: MenuPatchInput, user: User = Depends(require_roles("owner", "manager")), db: Session = Depends(tenant_db)):
    row = db.scalar(select(MenuItem).where(MenuItem.id == item_id, MenuItem.restaurant_id == user.restaurant_id))
    if not row: raise HTTPException(404, "Menu item not found")
    changes = body.model_dump(exclude_unset=True)
    if "categoryId" in changes:
        category = db.scalar(select(Category).where(Category.id == changes["categoryId"], Category.restaurant_id == user.restaurant_id))
        if not category: raise HTTPException(400, "Category not found")
        row.category_id = category.id
    for field, attribute in (("name", "name"), ("description", "description"), ("priceCents", "price_cents"),
                             ("costCents", "cost_cents"), ("isVeg", "is_veg"), ("isSpicy", "is_spicy"), ("isAvailable", "is_available")):
        if field in changes: setattr(row, attribute, changes[field])
    db.commit(); db.refresh(row)
    return item_json(db, row)

@app.get(api + "/tables")
def tables(user: User = Depends(floor_staff_user), db: Session = Depends(tenant_db)):
    return [table_json(x) for x in db.scalars(select(DiningTable).where(DiningTable.restaurant_id == user.restaurant_id).order_by(DiningTable.number)).all()]

@app.post(api + "/tables", status_code=201)
def create_table(body: TableInput, user: User = Depends(require_roles("owner", "manager")), db: Session = Depends(tenant_db)):
    if db.scalar(select(DiningTable).where(DiningTable.restaurant_id == user.restaurant_id, DiningTable.number == body.number)): raise HTTPException(400, "Table number already exists")
    row = DiningTable(restaurant_id=user.restaurant_id, number=body.number, area_name=body.areaName, capacity=body.capacity)
    db.add(row); db.commit(); db.refresh(row); return table_json(row)

@app.delete(api + "/tables/{table_id}", status_code=204)
def delete_table(table_id: str, user: User = Depends(require_roles("owner", "manager")), db: Session = Depends(tenant_db)):
    row = db.scalar(select(DiningTable).where(DiningTable.id == table_id, DiningTable.restaurant_id == user.restaurant_id))
    if not row: raise HTTPException(404, "Table not found")
    if row.active_order_id or row.status in {"occupied", "billed"}: raise HTTPException(409, "Cannot remove a table with an active order")
    db.delete(row); db.commit()

def transfer_tables(db: Session, restaurant_id: str, source_id: str, target_id: str, *, merge: bool) -> tuple[DiningTable, DiningTable, int]:
    if source_id == target_id: raise HTTPException(400, "Source and target tables must be different")
    source = scoped_table(db, restaurant_id, table_id=source_id)
    target = scoped_table(db, restaurant_id, table_id=target_id)
    if not source or not target: raise HTTPException(404, "Table not found")
    source_order = db.scalar(select(Order).where(Order.id == source.active_order_id, Order.restaurant_id == restaurant_id)) if source.active_order_id else None
    target_order = db.scalar(select(Order).where(Order.id == target.active_order_id, Order.restaurant_id == restaurant_id)) if target.active_order_id else None
    active_statuses = {"draft", "confirmed", "preparing", "ready", "billed"}
    if source_order and source_order.status not in active_statuses: source_order = None
    if target_order and target_order.status not in active_statuses: target_order = None
    if not source_order: raise HTTPException(409, "Source table has no active order")
    if not merge and target_order: raise HTTPException(409, "Target table already has an active order")
    merged_total = source_order.total_cents + (target_order.total_cents if target_order else 0)
    if merge and target_order:
        for item in list(source_order.items):
            item.order_id = target_order.id
            target_order.items.append(item)
        target_order.subtotal_cents += source_order.subtotal_cents
        target_order.discount_cents += source_order.discount_cents
        target_order.tax_cents += source_order.tax_cents
        target_order.service_charge_cents += source_order.service_charge_cents
        target_order.total_cents = target_order.subtotal_cents + target_order.tax_cents + target_order.service_charge_cents - target_order.discount_cents
        tickets = db.scalars(select(KitchenTicket).where(KitchenTicket.order_id == source_order.id, KitchenTicket.restaurant_id == restaurant_id)).all()
        for ticket in tickets: ticket.order_id = target_order.id
        source_order.status = "merged"
        source.active_order_id = None; source.status = "available"
        target.active_order_id = target_order.id; target.status = "occupied"
    else:
        source_order.table_id = target.id
        source.active_order_id = None; source.status = "available"
        target.active_order_id = source_order.id; target.status = "billed" if source_order.status == "billed" else "occupied"
    db.commit(); db.refresh(source); db.refresh(target)
    return source, target, merged_total

@app.post(api + "/tables/move")
async def move_table(body: TableTransferInput, user: User = Depends(floor_staff_user), db: Session = Depends(tenant_db)):
    source, target, _ = transfer_tables(db, user.restaurant_id, body.sourceTableId, body.targetTableId, merge=False)
    await sockets.emit(user.restaurant_id, "table.status_changed", {"tableId": target.id, "tableNumber": target.number, "newStatus": target.status, "activeOrderId": target.active_order_id})
    return {"success": True, "sourceTable": table_json(source), "targetTable": table_json(target)}

@app.post(api + "/tables/merge")
async def merge_table(body: TableTransferInput, user: User = Depends(floor_staff_user), db: Session = Depends(tenant_db)):
    source = scoped_table(db, user.restaurant_id, table_id=body.sourceTableId)
    if not source: raise HTTPException(404, "Table not found")
    manager_authorize(db, user, body.managerPin, "TABLE_MERGE", source.id, "Merge tables")
    source, target, total = transfer_tables(db, user.restaurant_id, body.sourceTableId, body.targetTableId, merge=True)
    db.commit()
    await sockets.emit(user.restaurant_id, "table.status_changed", {"tableId": source.id, "tableNumber": source.number, "newStatus": source.status, "activeOrderId": None})
    await sockets.emit(user.restaurant_id, "table.status_changed", {"tableId": target.id, "tableNumber": target.number, "newStatus": target.status, "activeOrderId": target.active_order_id})
    return {"success": True, "sourceTable": table_json(source), "targetTable": table_json(target), "mergedTotalCents": total}

@app.patch(api + "/tables/{table_id}/status")
async def update_table_status(table_id: str, body: StatusInput, user: User = Depends(floor_staff_user), db: Session = Depends(tenant_db)):
    if body.status not in {"available", "occupied", "billed", "reserved", "cleaning"}: raise HTTPException(400, "Invalid table status")
    table = db.scalar(select(DiningTable).where(DiningTable.id == table_id, DiningTable.restaurant_id == user.restaurant_id))
    if not table: raise HTTPException(404, "Table not found")
    previous = table.status; table.status = body.status; db.commit()
    await sockets.emit(user.restaurant_id, "table.status_changed", {"tableId": table.id, "tableNumber": table.number, "previousStatus": previous, "newStatus": table.status, "activeOrderId": table.active_order_id})
    return table_json(table)

def scoped_order(db: Session, user: User, order_id: str):
    order = db.scalar(select(Order).where(Order.id == order_id, Order.restaurant_id == user.restaurant_id))
    if not order: raise HTTPException(404, "Order not found")
    return order

def add_order_items(db: Session, user: User, order: Order, lines: list[LineInput]):
    # SQLAlchemy column defaults are applied at INSERT time; a newly-created
    # in-memory Order therefore has None here until it is flushed.
    order.discount_cents = order.discount_cents or 0
    for line in lines:
        item = db.scalar(select(MenuItem).where(MenuItem.id == line.menuItemId, MenuItem.restaurant_id == user.restaurant_id, MenuItem.is_available.is_(True)))
        if not item: raise HTTPException(400, f"Unavailable or unknown menu item: {line.menuItemId}")
        order.items.append(OrderItem(restaurant_id=user.restaurant_id, menu_item_id=item.id, name=item.name, quantity=line.quantity,
                                     unit_price_cents=item.price_cents, subtotal_cents=item.price_cents * line.quantity, notes=line.notes))
    order.subtotal_cents = sum(x.subtotal_cents for x in order.items)
    restaurant = db.scalar(select(Restaurant).where(Restaurant.id == user.restaurant_id))
    order.tax_cents = order.subtotal_cents * restaurant.tax_rate // 10000
    order.service_charge_cents = order.subtotal_cents * restaurant.service_charge_rate // 10000
    order.total_cents = order.subtotal_cents + order.tax_cents + order.service_charge_cents - order.discount_cents

@app.get(api + "/orders")
def list_orders(status: str | None = None, user: User = Depends(floor_staff_user), db: Session = Depends(tenant_db)):
    q = select(Order).where(Order.restaurant_id == user.restaurant_id)
    if status: q = q.where(Order.status == status)
    return [order_json(db, o) for o in db.scalars(q.order_by(Order.created_at.desc())).all()]

@app.post(api + "/orders", status_code=201)
async def create_order(body: OrderInput, user: User = Depends(floor_staff_user), db: Session = Depends(tenant_db)):
    table = None
    if body.tableId:
        table = db.scalar(select(DiningTable).where(DiningTable.id == body.tableId, DiningTable.restaurant_id == user.restaurant_id))
        if not table: raise HTTPException(400, "Table not found")
        if table.active_order_id:
            active_order = db.scalar(select(Order).where(Order.id == table.active_order_id, Order.restaurant_id == user.restaurant_id))
            if active_order and active_order.status in {"draft", "confirmed", "preparing", "ready", "billed"}:
                raise HTTPException(409, "Table already has an active order")
    order = Order(restaurant_id=user.restaurant_id, order_number="ORD-" + datetime.now(timezone.utc).strftime("%y%m%d%H%M%S") + secrets.token_hex(2).upper(),
                  table_id=table.id if table else None, order_type=body.orderType, user_id=user.id,
                  discount_cents=body.discountCents)
    add_order_items(db, user, order, body.items)
    if not body.serviceChargeEnabled:
        order.service_charge_cents = 0
        order.total_cents = order.subtotal_cents + order.tax_cents - order.discount_cents
    if order.discount_cents > order.subtotal_cents + order.tax_cents + order.service_charge_cents:
        raise HTTPException(400, "Discount cannot exceed the order total")
    db.add(order); db.flush()
    if table: table.status = "occupied"; table.active_order_id = order.id
    db.commit(); db.refresh(order)
    await sockets.emit(user.restaurant_id, "order.created", {"orderId": order.id, "orderNumber": order.order_number,
        "tableNumber": table.number if table else None, "orderType": order.order_type, "itemCount": len(order.items), "totalCents": order.total_cents})
    if table: await sockets.emit(user.restaurant_id, "table.status_changed", {"tableId": table.id, "tableNumber": table.number, "previousStatus": "available", "newStatus": "occupied", "activeOrderId": order.id})
    return order_json(db, order)

@app.get(api + "/orders/{order_id}")
def get_order(order_id: str, user: User = Depends(floor_staff_user), db: Session = Depends(tenant_db)): return order_json(db, scoped_order(db, user, order_id))

@app.post(api + "/orders/{order_id}/items", status_code=201)
async def append_items(order_id: str, body: OrderItemsInput | list[LineInput], user: User = Depends(floor_staff_user), db: Session = Depends(tenant_db)):
    order = scoped_order(db, user, order_id)
    if order.status not in ("draft", "confirmed"): raise HTTPException(400, "Items cannot be added after kitchen dispatch")
    add_order_items(db, user, order, body.items if isinstance(body, OrderItemsInput) else body); db.commit(); db.refresh(order)
    await sockets.emit(user.restaurant_id, "order.updated", {"orderId": order.id, "status": order.status, "subtotalCents": order.subtotal_cents, "totalCents": order.total_cents})
    return order_json(db, order)

@app.post(api + "/orders/{order_id}/send-to-kitchen")
async def send_to_kitchen(order_id: str, user: User = Depends(floor_staff_user), db: Session = Depends(tenant_db)):
    order = scoped_order(db, user, order_id)
    if order.status not in ("draft", "confirmed"): raise HTTPException(400, "Order has already been sent")
    order.status = "preparing"
    station_items: dict[str, list[OrderItem]] = defaultdict(list)
    for item in order.items:
        menu_item = db.scalar(select(MenuItem).where(MenuItem.id == item.menu_item_id, MenuItem.restaurant_id == user.restaurant_id))
        category = db.scalar(select(Category).where(Category.id == menu_item.category_id, Category.restaurant_id == user.restaurant_id)) if menu_item else None
        station = category.target_station if category and category.target_station in {"kitchen", "bar"} else "kitchen"
        station_items[station].append(item)
        if item.status == "pending": item.status = "fired"
    tickets = []
    for station in sorted(station_items):
        ticket = KitchenTicket(restaurant_id=user.restaurant_id, order_id=order.id,
                               ticket_number="KOT-" + secrets.token_hex(3).upper(), station=station)
        db.add(ticket); tickets.append(ticket)
    db.commit(); db.refresh(order)
    for ticket in tickets: db.refresh(ticket)
    await sockets.emit(user.restaurant_id, "order.updated", {"orderId": order.id, "status": order.status, "subtotalCents": order.subtotal_cents, "totalCents": order.total_cents})
    return {"order": order_json(db, order),
            "ticket": {"id": tickets[0].id, "ticketNumber": tickets[0].ticket_number},
            "tickets": [{"id": ticket.id, "ticketNumber": ticket.ticket_number, "station": ticket.station} for ticket in tickets]}

@app.post(api + "/orders/{order_id}/request-bill")
async def request_bill(order_id: str, user: User = Depends(floor_staff_user), db: Session = Depends(tenant_db)):
    order = scoped_order(db, user, order_id)
    if order.status in {"completed", "refunded", "voided", "merged"}:
        raise HTTPException(409, "Order cannot be billed in its current status")
    order.status = "billed"
    table = db.scalar(select(DiningTable).where(DiningTable.id == order.table_id, DiningTable.restaurant_id == user.restaurant_id)) if order.table_id else None
    if table: table.status = "billed"
    db.commit(); await sockets.emit(user.restaurant_id, "order.updated", {"orderId": order.id, "status": order.status, "subtotalCents": order.subtotal_cents, "totalCents": order.total_cents})
    return order_json(db, order)

@app.post(api + "/orders/{order_id}/pay")
async def pay_order(order_id: str, body: PayInput, user: User = Depends(floor_staff_user), db: Session = Depends(tenant_db)):
    order = scoped_order(db, user, order_id)
    if order.status in {"completed", "refunded", "voided", "merged"}:
        raise HTTPException(409, "Order cannot be paid in its current status")
    methods = {"cash", "card", "qr_code", "online_transfer"}
    prior_paid = sum(db.scalars(select(Payment.amount_cents).where(
        Payment.order_id == order.id, Payment.restaurant_id == user.restaurant_id, Payment.status == "completed"
    )).all())
    outstanding = max(0, order.total_cents - prior_paid)
    if body.allocations is not None:
        if body.paymentMethod != "mixed" or not body.allocations:
            raise HTTPException(400, "Payment allocations require mixed payment mode")
        allocations = [row.model_dump() for row in body.allocations]
        if any(row["paymentMethod"] not in methods for row in allocations):
            raise HTTPException(400, "Invalid payment allocation")
        allocations = [row for row in allocations if row["amountCents"] > 0]
        if not allocations: raise HTTPException(400, "At least one payment allocation is required")
        if sum(row["amountCents"] for row in allocations) != outstanding:
            raise HTTPException(400, "Payment allocations must equal the outstanding balance")
    else:
        if body.paymentMethod not in methods: raise HTTPException(400, "Unsupported payment method")
        amount = body.amountCents if body.amountCents is not None else outstanding
        if amount > outstanding: raise HTTPException(400, "Payment exceeds the outstanding balance")
        if body.paymentMethod == "cash" and body.tenderedCents is not None and body.tenderedCents < amount:
            raise HTTPException(400, "Tendered cash is less than payment amount")
        allocations = [{"paymentMethod": body.paymentMethod, "amountCents": amount}]
    payments = [Payment(restaurant_id=user.restaurant_id, order_id=order.id,
                        amount_cents=row["amountCents"], payment_method=row["paymentMethod"])
                for row in allocations]
    db.add_all(payments)
    paid_after = prior_paid + sum(payment.amount_cents for payment in payments)
    order.status = "completed" if paid_after >= order.total_cents else "billed"
    table = db.scalar(select(DiningTable).where(DiningTable.id == order.table_id, DiningTable.restaurant_id == user.restaurant_id)) if order.table_id else None
    if table and order.status == "completed": table.status = "cleaning"; table.active_order_id = None
    db.commit()
    await sockets.emit(user.restaurant_id, "order.updated", {"orderId": order.id, "status": order.status, "subtotalCents": order.subtotal_cents, "totalCents": order.total_cents})
    payment_json = lambda payment: {"id": payment.id, "orderId": order.id, "amountCents": payment.amount_cents,
        "paymentMethod": payment.payment_method, "status": payment.status,
        "tenderedCents": body.tenderedCents if payment.payment_method == "cash" else None,
        "changeCents": max(0, body.tenderedCents - payment.amount_cents) if payment.payment_method == "cash" and body.tenderedCents is not None else None,
        "createdAt": payment.created_at.isoformat()}
    return {"order": order_json(db, order), "payment": payment_json(payments[-1]),
            "payments": [payment_json(payment) for payment in payments], "amountPaidCents": sum(payment.amount_cents for payment in payments),
            "outstandingCents": max(0, order.total_cents - paid_after)}

@app.post(api + "/orders/{order_id}/void")
async def void_order(order_id: str, body: VoidInput, x_manager_pin: str | None = Header(default=None), user: User = Depends(floor_staff_user), db: Session = Depends(tenant_db)):
    order = scoped_order(db, user, order_id)
    if order.status in {"completed", "refunded", "voided", "merged"}:
        raise HTTPException(409, "Order cannot be voided in its current status")
    manager_authorize(db, user, body.managerPin or x_manager_pin, "ORDER_VOID", order.id, body.reason)
    order.status = "voided"
    if order.table_id:
        table = db.scalar(select(DiningTable).where(DiningTable.id == order.table_id, DiningTable.restaurant_id == user.restaurant_id))
        if table: table.status = "cleaning"; table.active_order_id = None
    db.commit(); await sockets.emit(user.restaurant_id, "order.updated", {"orderId": order.id, "status": order.status, "subtotalCents": order.subtotal_cents, "totalCents": order.total_cents})
    return order_json(db, order)

@app.post(api + "/orders/{order_id}/refund")
async def refund_order(order_id: str, body: RefundInput, user: User = Depends(floor_staff_user), db: Session = Depends(tenant_db)):
    order = scoped_order(db, user, order_id)
    if order.status != "completed":
        raise HTTPException(409, "Only completed orders can be refunded")
    payments = db.scalars(select(Payment).where(Payment.order_id == order.id, Payment.restaurant_id == user.restaurant_id,
                                               Payment.status == "completed")).all()
    if not payments:
        raise HTTPException(409, "No completed payment exists for this order")
    manager_authorize(db, user, body.managerPin, "ORDER_REFUND", order.id, body.reason)
    for payment in payments:
        payment.status = "refunded"
    order.status = "refunded"
    db.commit(); db.refresh(order)
    await sockets.emit(user.restaurant_id, "order.updated", {"orderId": order.id, "status": order.status,
        "subtotalCents": order.subtotal_cents, "totalCents": order.total_cents})
    return order_json(db, order)

@app.post(api + "/orders/{order_id}/split")
def split_order(order_id: str, user: User = Depends(floor_staff_user), db: Session = Depends(tenant_db)):
    order = scoped_order(db, user, order_id)
    return {"orderId": order.id, "totalCents": order.total_cents, "suggestedSplits": [{"amountCents": order.total_cents // 2}, {"amountCents": order.total_cents - order.total_cents // 2}]}

@app.get(api + "/kitchen/orders")
def kitchen_orders(station: str | None = Query(default=None, pattern="^(kitchen|bar)$"),
                   user: User = Depends(require_roles("owner", "manager", "cashier", "waiter", "kitchen")),
                   db: Session = Depends(tenant_db)):
    statement = select(KitchenTicket).where(KitchenTicket.restaurant_id == user.restaurant_id, KitchenTicket.status != "collected")
    if station: statement = statement.where(KitchenTicket.station == station)
    tickets = db.scalars(statement.order_by(KitchenTicket.fired_at)).all()
    result = []
    for ticket in tickets:
        order = db.scalar(select(Order).where(Order.id == ticket.order_id, Order.restaurant_id == user.restaurant_id))
        table = db.scalar(select(DiningTable).where(DiningTable.id == order.table_id, DiningTable.restaurant_id == user.restaurant_id)) if order and order.table_id else None
        result.append({"id": ticket.id, "orderId": order.id, "orderNumber": order.order_number, "ticketNumber": ticket.ticket_number,
                       "tableNumber": table.number if table else None, "station": ticket.station, "status": ticket.status,
                       "items": [{"name": i.name, "quantity": i.quantity, "notes": i.notes} for i in order.items], "firedAt": ticket.fired_at.isoformat(), "elapsedMinutes": 0})
    return result

@app.patch(api + "/kitchen/tickets/{ticket_id}/status")
async def ticket_status(ticket_id: str, body: StatusInput, user: User = Depends(kitchen_operator), db: Session = Depends(tenant_db)):
    if body.status not in {"preparing", "ready", "collected"}: raise HTTPException(400, "Invalid ticket status")
    if user.role == "waiter" and body.status != "collected":
        raise HTTPException(403, "Waiters can only collect ready kitchen tickets")
    ticket = db.scalar(select(KitchenTicket).where(KitchenTicket.id == ticket_id, KitchenTicket.restaurant_id == user.restaurant_id))
    if not ticket: raise HTTPException(404, "Kitchen ticket not found")
    if user.role == "waiter" and ticket.status != "ready":
        raise HTTPException(409, "Only ready kitchen tickets can be collected")
    allowed_transitions = {"new": {"preparing"}, "preparing": {"ready"}, "ready": {"preparing", "collected"}}
    if body.status not in allowed_transitions.get(ticket.status, set()):
        raise HTTPException(409, f"Kitchen ticket cannot move from {ticket.status} to {body.status}")
    ticket.status = body.status
    order = db.scalar(select(Order).where(Order.id == ticket.order_id, Order.restaurant_id == user.restaurant_id))
    if body.status == "ready": order.status = "ready"
    if body.status == "preparing": order.status = "preparing"
    for item in order.items:
        menu_item = db.scalar(select(MenuItem).where(MenuItem.id == item.menu_item_id, MenuItem.restaurant_id == user.restaurant_id))
        category = db.scalar(select(Category).where(Category.id == menu_item.category_id, Category.restaurant_id == user.restaurant_id)) if menu_item else None
        item_station = category.target_station if category and category.target_station in {"kitchen", "bar"} else "kitchen"
        if item.status != "canceled" and item_station == ticket.station:
            item.status = "served" if body.status == "collected" else "ready" if body.status == "ready" else "preparing"
    related_tickets = db.scalars(select(KitchenTicket).where(KitchenTicket.order_id == order.id,
                                                               KitchenTicket.restaurant_id == user.restaurant_id)).all()
    if any(x.status == "preparing" for x in related_tickets):
        order.status = "preparing"
    elif related_tickets and all(x.status in {"ready", "collected"} for x in related_tickets):
        order.status = "ready"
    db.commit(); table = db.scalar(select(DiningTable).where(DiningTable.id == order.table_id, DiningTable.restaurant_id == user.restaurant_id)) if order.table_id else None
    await sockets.emit(user.restaurant_id, "kitchen.ticket.status_changed", {"ticketId": ticket.id, "orderId": order.id, "orderNumber": order.order_number,
        "tableNumber": table.number if table else None, "station": ticket.station, "status": ticket.status})
    return {"id": ticket.id, "orderId": ticket.order_id, "ticketNumber": ticket.ticket_number, "station": ticket.station, "status": ticket.status}

@app.get(api + "/shifts/current")
def current_shift(user: User = Depends(shift_staff_user), db: Session = Depends(tenant_db)):
    shift = db.scalar(select(Shift).where(Shift.restaurant_id == user.restaurant_id, Shift.user_id == user.id, Shift.status == "open"))
    return shift_json(db, user, shift) if shift else None

def shift_json(db, user, shift):
    payments = db.scalars(select(Payment).where(Payment.restaurant_id == user.restaurant_id, Payment.status == "completed")).all()
    cash = sum(p.amount_cents for p in payments if p.payment_method == "cash")
    card = sum(p.amount_cents for p in payments if p.payment_method != "cash")
    return {"id": shift.id, "openedAt": shift.opened_at.isoformat(), "closedAt": shift.closed_at.isoformat() if shift.closed_at else None,
            "openingFloatCents": shift.opening_float_cents, "cashSalesCents": cash, "cardSalesCents": card,
            "expectedCashCents": shift.opening_float_cents + cash, "closingCashCents": shift.closing_cash_cents,
            "cashDifferenceCents": shift.closing_cash_cents - shift.opening_float_cents - cash if shift.closing_cash_cents is not None else None,
            "status": shift.status}

@app.post(api + "/shifts/open", status_code=201)
def open_shift(body: ShiftOpenInput, user: User = Depends(shift_staff_user), db: Session = Depends(tenant_db)):
    if db.scalar(select(Shift).where(Shift.restaurant_id == user.restaurant_id, Shift.user_id == user.id, Shift.status == "open")): raise HTTPException(400, "You already have an open shift")
    shift = Shift(restaurant_id=user.restaurant_id, user_id=user.id, opening_float_cents=body.openingFloatCents)
    db.add(shift); db.commit(); db.refresh(shift); return shift_json(db, user, shift)

@app.post(api + "/shifts/close")
def close_shift(body: ShiftCloseInput, user: User = Depends(shift_staff_user), db: Session = Depends(tenant_db)):
    shift = db.scalar(select(Shift).where(Shift.restaurant_id == user.restaurant_id, Shift.user_id == user.id, Shift.status == "open"))
    if not shift: raise HTTPException(400, "No open shift")
    shift.status = "closed"; shift.closed_at = datetime.now(timezone.utc); shift.closing_cash_cents = body.closingCashCents
    db.commit(); return shift_json(db, user, shift)

@app.get(api + "/public/menu/{restaurantCode}/{tableNumber}")
def public_menu(restaurantCode: str, tableNumber: str, db: Session = Depends(tenant_db)):
    restaurant = db.scalar(select(Restaurant).where(Restaurant.code == restaurantCode.upper()))
    if not restaurant: raise HTTPException(404, "Restaurant not found")
    table = db.scalar(select(DiningTable).where(DiningTable.restaurant_id == restaurant.id, DiningTable.number == tableNumber))
    if not table: raise HTTPException(404, "Table not found")
    return {"restaurant": {"name": restaurant.name, "code": restaurant.code, "currency": restaurant.currency}, "table": table_json(table),
            "categories": [category_json(c) for c in db.scalars(select(Category).where(Category.restaurant_id == restaurant.id).order_by(Category.sort_order)).all()],
            "items": [item_json(db, x) for x in db.scalars(select(MenuItem).where(MenuItem.restaurant_id == restaurant.id, MenuItem.is_available.is_(True))).all()]}

@app.post(api + "/public/orders", status_code=201)
async def public_order(body: OrderInput, restaurantCode: str = Query(...), db: Session = Depends(tenant_db)):
    restaurant = db.scalar(select(Restaurant).where(Restaurant.code == restaurantCode.upper()))
    if not restaurant: raise HTTPException(404, "Restaurant not found")
    preferences = db.scalar(select(ShowcaseRecord).where(ShowcaseRecord.restaurant_id == restaurant.id,
        ShowcaseRecord.collection == "settings", ShowcaseRecord.data["key"].as_string() == "restaurant"))
    if preferences and preferences.data.get("allowSelfOrder") is False:
        raise HTTPException(403, "Customer self-ordering is disabled")
    user = db.scalar(select(User).where(User.restaurant_id == restaurant.id, User.role == "waiter"))
    if not user: raise HTTPException(400, "Ordering is unavailable")
    created = await create_order(body, user, db)
    kitchen_result = await send_to_kitchen(created["id"], user, db)
    return {"order": kitchen_result["order"], "tickets": kitchen_result["tickets"]}

@app.post(api + "/public/call-waiter")
async def call_waiter(payload: dict[str, Any], restaurantCode: str = Query(...), db: Session = Depends(tenant_db)):
    restaurant = db.scalar(select(Restaurant).where(Restaurant.code == restaurantCode.upper()))
    table_id = payload.get("tableId"); number = payload.get("tableNumber")
    if not restaurant: raise HTTPException(404, "Restaurant not found")
    table = db.scalar(select(DiningTable).where(DiningTable.restaurant_id == restaurant.id, (DiningTable.id == table_id) if table_id else (DiningTable.number == number)))
    if not table: raise HTTPException(404, "Table not found")
    await sockets.emit(restaurant.id, "waiter.called", {"tableId": table.id, "tableNumber": table.number,
        "requestType": payload.get("requestType", "waiter"), "customerName": payload.get("customerName")})
    return {"success": True}

@app.post(api + "/public/request-bill")
async def public_request_bill(payload: dict[str, Any], restaurantCode: str = Query(...), db: Session = Depends(tenant_db)):
    restaurant = db.scalar(select(Restaurant).where(Restaurant.code == restaurantCode.upper()))
    table_id = payload.get("tableId"); number = payload.get("tableNumber")
    if not restaurant: raise HTTPException(404, "Restaurant not found")
    table = db.scalar(select(DiningTable).where(DiningTable.restaurant_id == restaurant.id,
        (DiningTable.id == table_id) if table_id else (DiningTable.number == number)))
    if not table: raise HTTPException(404, "Table not found")
    if not table.active_order_id: raise HTTPException(409, "There is no active order for this table")
    order = db.scalar(select(Order).where(Order.id == table.active_order_id, Order.restaurant_id == restaurant.id))
    if not order or order.status in {"completed", "refunded", "voided", "merged"}:
        raise HTTPException(409, "There is no billable active order for this table")
    order.status = "billed"; table.status = "billed"; db.commit(); db.refresh(order)
    await sockets.emit(restaurant.id, "order.updated", {"orderId": order.id, "status": order.status,
        "subtotalCents": order.subtotal_cents, "totalCents": order.total_cents})
    return {"success": True, "order": order_json(db, order)}

@app.get(api + "/reservations")
def list_reservations(date: calendar_date | None = None, status: str | None = None,
                      user: User = Depends(floor_staff_user), db: Session = Depends(tenant_db)):
    rows = db.scalars(select(Reservation).where(
        Reservation.restaurant_id == user.restaurant_id
    ).order_by(Reservation.reservation_time)).all()
    if date:
        rows = [row for row in rows if as_utc(row.reservation_time).date() == date]
    if status and status != "all":
        if status not in RESERVATION_STATUSES:
            raise HTTPException(422, "Unsupported reservation status")
        rows = [row for row in rows if row.status == status]
    return [reservation_json(db, row) for row in rows]


@app.post(api + "/reservations", status_code=201)
def create_reservation(body: ReservationInput, user: User = Depends(floor_staff_user),
                       db: Session = Depends(tenant_db)):
    reservation = reservation_for_input(db, user, body, status="confirmed")
    db.commit(); db.refresh(reservation)
    return reservation_json(db, reservation)


def scoped_reservation(db: Session, restaurant_id: str, reservation_id: str) -> Reservation:
    reservation = db.scalar(select(Reservation).where(
        Reservation.id == reservation_id, Reservation.restaurant_id == restaurant_id
    ))
    if not reservation:
        raise HTTPException(404, "Reservation not found")
    return reservation


@app.patch(api + "/reservations/{reservation_id}/status")
def update_reservation_status(reservation_id: str, body: ReservationStatusInput,
                              user: User = Depends(floor_staff_user), db: Session = Depends(tenant_db)):
    if body.status not in RESERVATION_STATUSES:
        raise HTTPException(422, "Unsupported reservation status")
    reservation = scoped_reservation(db, user.restaurant_id, reservation_id)
    if body.table_id:
        table = scoped_table(db, user.restaurant_id, table_id=body.table_id)
        if not table:
            raise HTTPException(404, "Table not found")
        if table.capacity < reservation.party_size:
            raise HTTPException(409, "Table capacity is too small for this party")
        if body.status in {"pending", "confirmed", "seated"} and has_reservation_conflict(
            db, user.restaurant_id, table.id, reservation.reservation_time,
            reservation.duration_minutes, exclude_id=reservation.id,
        ):
            raise HTTPException(409, "The selected table already has a reservation at that time")
        reservation.table_id = table.id
    reservation.status = body.status
    db.commit(); db.refresh(reservation)
    return reservation_json(db, reservation)


@app.delete(api + "/reservations/{reservation_id}")
def delete_reservation(reservation_id: str, user: User = Depends(floor_staff_user),
                       db: Session = Depends(tenant_db)):
    reservation = scoped_reservation(db, user.restaurant_id, reservation_id)
    db.delete(reservation); db.commit()
    return {"success": True}


@app.get(api + "/waitlist")
def list_waitlist(status: str | None = None, user: User = Depends(floor_staff_user),
                  db: Session = Depends(tenant_db)):
    query = select(WaitlistEntry).where(WaitlistEntry.restaurant_id == user.restaurant_id)
    if status and status != "all":
        if status not in WAITLIST_STATUSES:
            raise HTTPException(422, "Unsupported waitlist status")
        query = query.where(WaitlistEntry.status == status)
    entries = db.scalars(query.order_by(WaitlistEntry.created_at)).all()
    return [waitlist_json(entry) for entry in entries]


@app.post(api + "/waitlist", status_code=201)
def create_waitlist_entry(body: WaitlistInput, user: User = Depends(floor_staff_user),
                          db: Session = Depends(tenant_db)):
    entry = WaitlistEntry(restaurant_id=user.restaurant_id, customer_name=body.customer_name.strip(),
                          customer_phone=body.customer_phone.strip(), party_size=body.party_size,
                          estimated_wait_minutes=body.estimated_wait_minutes, notes=body.notes)
    db.add(entry); db.commit(); db.refresh(entry)
    return waitlist_json(entry)


def scoped_waitlist_entry(db: Session, restaurant_id: str, entry_id: str) -> WaitlistEntry:
    entry = db.scalar(select(WaitlistEntry).where(
        WaitlistEntry.id == entry_id, WaitlistEntry.restaurant_id == restaurant_id
    ))
    if not entry:
        raise HTTPException(404, "Waitlist entry not found")
    return entry


@app.patch(api + "/waitlist/{entry_id}/status")
def update_waitlist_status(entry_id: str, body: WaitlistStatusInput,
                           user: User = Depends(floor_staff_user), db: Session = Depends(tenant_db)):
    if body.status not in WAITLIST_STATUSES:
        raise HTTPException(422, "Unsupported waitlist status")
    entry = scoped_waitlist_entry(db, user.restaurant_id, entry_id)
    entry.status = body.status
    if body.status == "notified" and not entry.notified_at:
        entry.notified_at = datetime.now(timezone.utc)
    db.commit(); db.refresh(entry)
    return waitlist_json(entry)


@app.delete(api + "/waitlist/{entry_id}")
def delete_waitlist_entry(entry_id: str, user: User = Depends(floor_staff_user),
                          db: Session = Depends(tenant_db)):
    entry = scoped_waitlist_entry(db, user.restaurant_id, entry_id)
    db.delete(entry); db.commit()
    return {"success": True}


def menu_search_results(db: Session, restaurant_id: str, query: str,
                        category_id: str | None = None, available_only: bool = True) -> list[dict[str, Any]]:
    statement = select(MenuItem).where(MenuItem.restaurant_id == restaurant_id)
    if category_id:
        statement = statement.where(MenuItem.category_id == category_id)
    if available_only:
        statement = statement.where(MenuItem.is_available.is_(True))
    items = db.scalars(statement.order_by(MenuItem.name)).all()
    normalized_query = query.casefold().strip()
    categories_by_id = {category.id: category.name for category in db.scalars(
        select(Category).where(Category.restaurant_id == restaurant_id)
    ).all()}
    results = []
    for item in items:
        searchable = " ".join([item.name, item.description or "", *(item.aliases or [])]).casefold()
        if normalized_query and normalized_query not in searchable:
            continue
        result = item_json(db, item)
        result["categoryName"] = categories_by_id.get(item.category_id)
        result["aliases"] = item.aliases or []
        results.append(result)
    return results


@app.get(api + "/tools/menu-search")
def ai_menu_search(query: str = Query(min_length=1, max_length=120),
                   user: User = Depends(ai_tool_user), db: Session = Depends(tenant_db)):
    return menu_search_results(db, user.restaurant_id, query)


@app.post(api + "/tools/get_menu")
def ai_get_menu(body: ToolMenuInput, user: User = Depends(ai_tool_user), db: Session = Depends(tenant_db)):
    return menu_search_results(db, user.restaurant_id, "", category_id=body.category_id)


def availability_payload(db: Session, user: User, party_size: int, requested_at: datetime,
                         duration_minutes: int) -> dict[str, Any]:
    requested_at = as_utc(requested_at)
    if requested_at <= datetime.now(timezone.utc):
        raise HTTPException(422, "Availability time must be in the future")
    tables = available_tables(db, user.restaurant_id, party_size, requested_at, duration_minutes)
    return {"available": bool(tables), "partySize": party_size, "requestedAt": requested_at.isoformat(),
            "suggestedTable": table_json(tables[0]) if tables else None,
            "tables": [table_json(table) for table in tables]}


@app.get(api + "/tools/table-availability")
def ai_table_availability(date: calendar_date, time: wall_time,
                          partySize: int = Query(ge=1, le=30), durationMinutes: int = Query(default=90, ge=15, le=360),
                          user: User = Depends(ai_tool_user), db: Session = Depends(tenant_db)):
    requested_at = datetime.combine(date, time, tzinfo=timezone.utc)
    return availability_payload(db, user, partySize, requested_at, durationMinutes)


@app.post(api + "/tools/check_table_availability")
def ai_check_table_availability(body: ToolAvailabilityLegacyInput,
                                user: User = Depends(ai_tool_user), db: Session = Depends(tenant_db)):
    return availability_payload(db, user, body.party_size, body.time_iso, body.duration_minutes)


def create_ai_draft_order(db: Session, user: User, body: ToolDraftOrderInput) -> dict[str, Any]:
    require_tool_roles(user, "owner", "manager", "cashier", "waiter")
    if body.order_type not in {"dine_in", "takeaway", "delivery", "qr_self_order"}:
        raise HTTPException(422, "Unsupported order type")
    if body.source not in {"voice_waiter", "voice_qr"}:
        raise HTTPException(422, "AI draft orders must use voice_waiter or voice_qr source")
    table = scoped_table(db, user.restaurant_id, body.table_id, body.table_number)
    if (body.table_id or body.table_number) and not table:
        raise HTTPException(404, "Table not found")
    order = Order(restaurant_id=user.restaurant_id,
                  order_number="ORD-" + datetime.now(timezone.utc).strftime("%y%m%d%H%M%S") + secrets.token_hex(2).upper(),
                  table_id=table.id if table else None, order_type=body.order_type,
                  status="draft", source=body.source, ai_assisted=True, user_id=user.id,
                  subtotal_cents=0, discount_cents=0, tax_cents=0, service_charge_cents=0, total_cents=0)
    lines = [LineInput(menuItemId=line.menu_item_id, quantity=line.quantity, notes=line.notes) for line in body.items]
    add_order_items(db, user, order, lines)
    db.add(order); db.flush()
    db.add(AuditLog(restaurant_id=user.restaurant_id, user_id=user.id, actor_type="ai",
                    action="AI_DRAFT_ORDER", resource_id=order.id,
                    details={"source": body.source, "menuItemIds": [line.menu_item_id for line in body.items],
                             "requiresHumanConfirmation": True}))
    db.commit(); db.refresh(order)
    return {**order_json(db, order), "source": order.source, "aiAssisted": order.ai_assisted,
            "requiresHumanConfirmation": True}


@app.post(api + "/tools/draft-order", status_code=201)
def ai_draft_order(body: ToolDraftOrderInput, user: User = Depends(ai_tool_user),
                   db: Session = Depends(tenant_db)):
    return create_ai_draft_order(db, user, body)


@app.post(api + "/tools/create_draft_order", status_code=201)
def ai_create_draft_order_alias(body: ToolDraftOrderInput, user: User = Depends(ai_tool_user),
                                db: Session = Depends(tenant_db)):
    return create_ai_draft_order(db, user, body)


def create_ai_draft_booking(db: Session, user: User, body: ToolDraftBookingInput) -> dict[str, Any]:
    require_tool_roles(user, "owner", "manager", "waiter", "cashier")
    reservation = reservation_for_input(db, user, body, status="pending", source_override="voice_agent",
                                        ai_details={"source": "voice_agent", "requiresHumanConfirmation": True})
    db.commit(); db.refresh(reservation)
    return {**reservation_json(db, reservation), "requiresHumanConfirmation": True}


@app.post(api + "/tools/draft-booking", status_code=201)
def ai_draft_booking(body: ToolDraftBookingInput, user: User = Depends(ai_tool_user),
                     db: Session = Depends(tenant_db)):
    return create_ai_draft_booking(db, user, body)


@app.post(api + "/tools/create_booking_draft", status_code=201)
def ai_create_booking_draft_alias(body: ToolDraftBookingInput, user: User = Depends(ai_tool_user),
                                 db: Session = Depends(tenant_db)):
    return create_ai_draft_booking(db, user, body)


@app.get(api + "/subscription")
def subscription(user: User = Depends(current_user), db: Session = Depends(tenant_db)): return session_payload(db, user)

@app.get(api + "/subscription/invoices")
def invoices(user: User = Depends(current_user), db: Session = Depends(tenant_db)):
    return [{"id": x.id, "invoiceNumber": x.invoice_number, "amountCents": x.amount_cents, "totalCents": x.total_cents,
             "status": x.status, "dueDate": x.due_date} for x in db.scalars(select(Invoice).where(Invoice.restaurant_id == user.restaurant_id)).all()]

@app.get(api + "/reports/dashboard")
def dashboard(user: User = Depends(report_user), db: Session = Depends(tenant_db)):
    today = datetime.now(timezone.utc).date()
    completed = db.scalars(select(Order).where(Order.restaurant_id == user.restaurant_id, Order.status == "completed")).all()
    todays_orders = [o for o in completed if o.created_at.date() == today]
    active_tables = len(db.scalars(select(DiningTable.id).where(
        DiningTable.restaurant_id == user.restaurant_id, DiningTable.status.in_(["occupied", "billed"])
    )).all())
    total = sum(o.total_cents for o in todays_orders)
    recent_orders = db.scalars(select(Order).where(Order.restaurant_id == user.restaurant_id)
                               .order_by(Order.created_at.desc()).limit(5)).all()
    return {"todaySalesCents": total, "ordersCount": len(todays_orders), "activeTables": active_tables,
            "averageTicketCents": total // len(todays_orders) if todays_orders else 0,
            "recentOrders": [order_json(db, o) for o in recent_orders]}

@app.get(api + "/reports/sales")
def sales_report(startDate: str | None = None, endDate: str | None = None,
                 user: User = Depends(report_user), db: Session = Depends(tenant_db)):
    orders = db.scalars(select(Order).where(Order.restaurant_id == user.restaurant_id, Order.status == "completed")).all()
    payments = db.scalars(select(Payment).where(Payment.restaurant_id == user.restaurant_id, Payment.status == "completed")).all()
    def in_range(value: datetime) -> bool:
        day = value.date()
        return (not startDate or day >= datetime.fromisoformat(startDate).date()) and (not endDate or day <= datetime.fromisoformat(endDate).date())
    order_ids = {o.id for o in orders if in_range(o.created_at)}
    filtered_payments = [p for p in payments if p.order_id in order_ids]
    return {"totalSalesCents": sum(o.total_cents for o in orders if o.id in order_ids), "totalOrders": len(order_ids),
            "paymentBreakdown": {"cashCents": sum(p.amount_cents for p in filtered_payments if p.payment_method == "cash"),
                                 "cardCents": sum(p.amount_cents for p in filtered_payments if p.payment_method == "card")}}

@app.get(api + "/reports/analytics")
def report_analytics(startDate: str | None = None, endDate: str | None = None,
                     user: User = Depends(report_user), db: Session = Depends(tenant_db)):
    start_day = datetime.fromisoformat(startDate).date() if startDate else None
    end_day = datetime.fromisoformat(endDate).date() if endDate else None
    def in_range(value: datetime) -> bool:
        day = as_utc(value).date()
        return (start_day is None or day >= start_day) and (end_day is None or day <= end_day)

    orders = db.scalars(select(Order).where(Order.restaurant_id == user.restaurant_id)).all()
    completed = [order for order in orders if order.status == "completed" and in_range(order.created_at)]
    staff = {row.id: row for row in db.scalars(select(User).where(User.restaurant_id == user.restaurant_id)).all()}
    tables_by_id = {row.id: row for row in db.scalars(select(DiningTable).where(DiningTable.restaurant_id == user.restaurant_id)).all()}
    categories = {row.id: row for row in db.scalars(select(Category).where(Category.restaurant_id == user.restaurant_id)).all()}
    menu = {row.id: row for row in db.scalars(select(MenuItem).where(MenuItem.restaurant_id == user.restaurant_id)).all()}

    daily: dict[str, dict[str, Any]] = {}
    hourly: dict[str, dict[str, Any]] = {}
    by_item: dict[str, dict[str, Any]] = {}
    by_category: dict[str, dict[str, Any]] = {}
    by_staff: dict[str, dict[str, Any]] = {}
    by_table: dict[str, dict[str, Any]] = {}
    for order in completed:
        stamp = as_utc(order.created_at)
        day = stamp.date().isoformat()
        day_row = daily.setdefault(day, {"date": day, "orders": 0, "grossCents": 0, "discountCents": 0,
                                         "serviceCents": 0, "taxCents": 0, "netCents": 0})
        day_row["orders"] += 1; day_row["grossCents"] += order.subtotal_cents
        day_row["discountCents"] += order.discount_cents; day_row["serviceCents"] += order.service_charge_cents
        day_row["taxCents"] += order.tax_cents; day_row["netCents"] += order.total_cents
        hour = stamp.strftime("%I:00 %p")
        hour_row = hourly.setdefault(hour, {"hour": hour, "orders": 0, "totalCents": 0, "avgCents": 0})
        hour_row["orders"] += 1; hour_row["totalCents"] += order.total_cents
        worker = staff.get(order.user_id)
        worker_key = order.user_id
        worker_row = by_staff.setdefault(worker_key, {"staff": f"{worker.first_name} {worker.last_name}".strip() if worker else "Staff",
            "role": worker.role.title() if worker else "Staff", "orders": 0, "totalCents": 0, "avgTicketCents": 0})
        worker_row["orders"] += 1; worker_row["totalCents"] += order.total_cents
        table = tables_by_id.get(order.table_id) if order.table_id else None
        if table:
            table_row = by_table.setdefault(table.id, {"table": table.number, "area": table.area_name, "orders": 0,
                "guests": 0, "totalCents": 0, "avgTurnMinutes": 0})
            table_row["orders"] += 1; table_row["totalCents"] += order.total_cents
        for line in order.items:
            dish = menu.get(line.menu_item_id)
            category = categories.get(dish.category_id) if dish else None
            category_name = category.name if category else "Uncategorized"
            item_row = by_item.setdefault(line.menu_item_id, {"name": line.name, "category": category_name,
                "units": 0, "priceCents": line.unit_price_cents, "totalCents": 0})
            item_row["units"] += line.quantity; item_row["totalCents"] += line.subtotal_cents
            cat_row = by_category.setdefault(category_name, {"category": category_name, "itemsCount": 0,
                "unitsSold": 0, "totalCents": 0})
            cat_row["unitsSold"] += line.quantity; cat_row["totalCents"] += line.subtotal_cents

    for row in hourly.values(): row["avgCents"] = row["totalCents"] // row["orders"] if row["orders"] else 0
    for row in by_staff.values(): row["avgTicketCents"] = row["totalCents"] // row["orders"] if row["orders"] else 0
    for row in by_category.values():
        row["itemsCount"] = sum(1 for item in by_item.values() if item["category"] == row["category"])
        grand_total = sum(item["totalCents"] for item in by_category.values())
        row["sharePercent"] = f"{(row['totalCents'] * 100 / grand_total):.1f}%" if grand_total else "0.0%"

    completed_ids = {order.id for order in completed}
    payments = db.scalars(select(Payment).where(Payment.restaurant_id == user.restaurant_id,
                                                Payment.status == "completed")).all()
    payment_totals: dict[str, dict[str, Any]] = {}
    for payment in payments:
        if payment.order_id not in completed_ids: continue
        payment_row = payment_totals.setdefault(payment.payment_method, {"method": payment.payment_method.replace("_", " ").title(), "count": 0, "totalCents": 0})
        payment_row["count"] += 1; payment_row["totalCents"] += payment.amount_cents
    paid_total = sum(row["totalCents"] for row in payment_totals.values())
    for row in payment_totals.values():
        row["sharePercent"] = f"{(row['totalCents'] * 100 / paid_total):.1f}%" if paid_total else "0.0%"

    audit_rows = db.scalars(select(AuditLog).where(AuditLog.restaurant_id == user.restaurant_id,
                                                   AuditLog.action.in_(["ORDER_VOID", "ORDER_REFUND"]))).all()
    audits = {row.resource_id: row for row in audit_rows}
    discounts = []
    voids = []
    for order in orders:
        if not in_range(order.created_at): continue
        stamp = as_utc(order.created_at)
        actor = staff.get(order.user_id)
        if order.discount_cents:
            discounts.append({"orderId": order.order_number, "time": stamp.strftime("%H:%M"), "type": "Order discount",
                "reason": "Recorded on order", "authorizedBy": f"{actor.first_name} {actor.last_name}" if actor else "Staff",
                "amountCents": order.discount_cents})
        if order.status in {"voided", "refunded"}:
            audit = audits.get(order.id)
            details = audit.details if audit and isinstance(audit.details, dict) else {}
            voids.append({"orderId": order.order_number, "time": stamp.strftime("%H:%M"),
                "items": ", ".join(f"{line.quantity}x {line.name}" for line in order.items),
                "reason": details.get("reason", order.status.title()), "authorizedBy": "Manager approved",
                "cashier": f"{actor.first_name} {actor.last_name}" if actor else "Staff", "amountCents": order.total_cents})

    shifts = db.scalars(select(Shift).where(Shift.restaurant_id == user.restaurant_id).order_by(Shift.opened_at.desc())).all()
    shift_summary = []
    for shift in shifts:
        if not in_range(shift.opened_at): continue
        actor = staff.get(shift.user_id)
        shift_summary.append({"shiftId": shift.id, "cashier": f"{actor.first_name} {actor.last_name}" if actor else "Staff",
            "opened": as_utc(shift.opened_at).strftime("%Y-%m-%d %I:%M %p"),
            "closed": as_utc(shift.closed_at).strftime("%Y-%m-%d %I:%M %p") if shift.closed_at else "Active",
            "floatCents": shift.opening_float_cents, "expectedCashCents": shift.closing_cash_cents or shift.opening_float_cents,
            "countedCashCents": shift.closing_cash_cents or 0,
            "varianceCents": (shift.closing_cash_cents - shift.opening_float_cents) if shift.closing_cash_cents is not None else 0})

    item_rows = sorted(by_item.values(), key=lambda row: row["totalCents"], reverse=True)
    top_bottom = []
    for index, row in enumerate(item_rows):
        dish = next((dish for dish in menu.values() if dish.name == row["name"]), None)
        margin = ((row["priceCents"] - dish.cost_cents) * 100 / row["priceCents"]) if dish and row["priceCents"] else 0
        top_bottom.append({"rank": f"#{index + 1}", "name": row["name"], "category": row["category"],
            "unitsSold": row["units"], "totalRevenueCents": row["totalCents"], "margin": f"{margin:.1f}%"})
    return {"daily_sales": sorted(daily.values(), key=lambda row: row["date"], reverse=True),
        "sales_by_hour": list(hourly.values()), "sales_by_item": item_rows,
        "sales_by_category": list(by_category.values()), "sales_by_staff": list(by_staff.values()),
        "sales_by_table": list(by_table.values()), "payment_methods": list(payment_totals.values()),
        "tax_service_summary": [{"date": row["date"], "netSalesCents": row["grossCents"] - row["discountCents"],
            "serviceCents": row["serviceCents"], "taxCents": row["taxCents"], "totalCents": row["netCents"]} for row in daily.values()],
        "discounts_given": discounts, "voids_refunds": voids, "shift_summary": shift_summary,
        "top_bottom_items": top_bottom}


# Persistent showcase modules. All records are strictly tenant-scoped; these
# endpoints provide working operational workflows without pretending to be
# third-party delivery or a full double-entry accounting integration.
@app.get(api + "/staff")
def list_staff(user: User = Depends(require_roles("owner", "manager")), db: Session = Depends(tenant_db)):
    rows = db.scalars(select(User).where(User.restaurant_id == user.restaurant_id).order_by(User.first_name)).all()
    return [{"id": row.id, "name": f"{row.first_name} {row.last_name}".strip(), "role": row.role,
             "phone": row.phone or "", "isActive": row.active, "isOwner": row.role == "owner"} for row in rows]


@app.post(api + "/staff", status_code=201)
def create_staff(body: dict[str, Any], user: User = Depends(require_roles("owner", "manager")), db: Session = Depends(tenant_db)):
    name = str(body.get("name", "")).strip(); pin = str(body.get("pin", "")); role = str(body.get("role", "waiter"))
    if not name or len(name) > 160: raise HTTPException(422, "Staff name is required")
    if len(pin) != 4 or not pin.isdigit(): raise HTTPException(422, "PIN must contain exactly four digits")
    if role not in {"manager", "cashier", "waiter", "kitchen", "accountant"}: raise HTTPException(422, "Unsupported staff role")
    restaurant = db.get(Restaurant, user.restaurant_id)
    # Basic accounts are limited to three active accounts, matching the UI.
    active_count = len(db.scalars(select(User.id).where(User.restaurant_id == user.restaurant_id, User.active.is_(True))).all())
    if restaurant and restaurant.plan_code == "basic" and active_count >= 3: raise HTTPException(409, "Basic plan user limit reached")
    first, _, last = name.partition(" ")
    email = f"staff-{uid()}@{restaurant.code.lower() if restaurant else 'ralypto'}.local"
    row = User(restaurant_id=user.restaurant_id, email=email, first_name=first, last_name=last,
               role=role, phone=str(body.get("phone", ""))[:40], active=True,
               password_digest=password_hash.hash(secrets.token_urlsafe(24)), pin_digest=password_hash.hash(pin))
    db.add(row); db.commit(); db.refresh(row)
    return {"id": row.id, "name": f"{row.first_name} {row.last_name}".strip(), "role": row.role,
            "phone": row.phone, "isActive": row.active, "isOwner": False}


@app.patch(api + "/staff/{staff_id}")
def update_staff(staff_id: str, body: dict[str, Any], user: User = Depends(require_roles("owner", "manager")), db: Session = Depends(tenant_db)):
    row = db.scalar(select(User).where(User.id == staff_id, User.restaurant_id == user.restaurant_id))
    if not row: raise HTTPException(404, "Staff member not found")
    if row.role == "owner" and any(key in body for key in ("role", "isActive")): raise HTTPException(409, "Owner account role and status are protected")
    if "name" in body:
        first, _, last = str(body["name"]).strip().partition(" ")
        if not first: raise HTTPException(422, "Staff name is required")
        row.first_name, row.last_name = first, last
    if "phone" in body: row.phone = str(body["phone"])[:40]
    if "pin" in body and body["pin"]:
        pin = str(body["pin"])
        if len(pin) != 4 or not pin.isdigit(): raise HTTPException(422, "PIN must contain exactly four digits")
        row.pin_digest = password_hash.hash(pin)
    if "role" in body:
        if body["role"] not in {"manager", "cashier", "waiter", "kitchen", "accountant"}: raise HTTPException(422, "Unsupported staff role")
        row.role = body["role"]
    if "isActive" in body: row.active = bool(body["isActive"])
    db.commit()
    return {"id": row.id, "name": f"{row.first_name} {row.last_name}".strip(), "role": row.role,
            "phone": row.phone, "isActive": row.active, "isOwner": row.role == "owner"}


@app.delete(api + "/staff/{staff_id}", status_code=204)
def delete_staff(staff_id: str, user: User = Depends(require_roles("owner", "manager")), db: Session = Depends(tenant_db)):
    row = db.scalar(select(User).where(User.id == staff_id, User.restaurant_id == user.restaurant_id))
    if not row: raise HTTPException(404, "Staff member not found")
    if row.role == "owner": raise HTTPException(409, "Owner account cannot be deleted")
    row.active = False; db.commit()


SHOWCASE_COLLECTIONS = {"settings", "inventory", "delivery", "accounting"}
SHOWCASE_ROLES = {
    "settings": {"owner", "manager"},
    "inventory": {"owner", "manager", "kitchen"},
    "delivery": {"owner", "manager", "waiter", "cashier"},
    "accounting": {"owner", "manager", "accountant"},
}

def _authorize_showcase(collection: str, user: User) -> None:
    if collection not in SHOWCASE_COLLECTIONS: raise HTTPException(404, "Unknown collection")
    if user.role not in SHOWCASE_ROLES[collection]: raise HTTPException(403, "Insufficient role permissions")

def _showcase_record(row: ShowcaseRecord) -> dict[str, Any]:
    return {"id": row.id, **(row.data or {}), "createdAt": as_utc(row.created_at).isoformat(), "updatedAt": as_utc(row.updated_at).isoformat()}

@app.get(api + "/showcase/{collection}")
def list_showcase(collection: str, user: User = Depends(current_user), db: Session = Depends(tenant_db)):
    _authorize_showcase(collection, user)
    rows = db.scalars(select(ShowcaseRecord).where(ShowcaseRecord.restaurant_id == user.restaurant_id,
        ShowcaseRecord.collection == collection).order_by(ShowcaseRecord.created_at.desc())).all()
    return [_showcase_record(row) for row in rows]

@app.post(api + "/showcase/{collection}", status_code=201)
def create_showcase(collection: str, body: dict[str, Any], user: User = Depends(current_user),
                    db: Session = Depends(tenant_db), response: Response = None):
    _authorize_showcase(collection, user)
    if collection == "settings":
        restaurant = db.get(Restaurant, user.restaurant_id)
        if restaurant:
            if "restName" in body and str(body["restName"]).strip(): restaurant.name = str(body["restName"]).strip()[:160]
            if "serviceRate" in body: restaurant.service_charge_rate = int(max(0, min(30, float(body["serviceRate"]))) * 100) if body.get("serviceEnabled", True) else 0
            if "taxRate" in body: restaurant.tax_rate = int(max(0, min(30, float(body["taxRate"]))) * 100) if body.get("taxEnabled", True) else 0
        row = db.scalar(select(ShowcaseRecord).where(ShowcaseRecord.restaurant_id == user.restaurant_id,
            ShowcaseRecord.collection == collection, ShowcaseRecord.data["key"].as_string() == "restaurant"))
        if row:
            row.data = {**row.data, **body}; row.updated_at = datetime.now(timezone.utc); db.commit(); db.refresh(row)
            if response is not None:
                response.status_code = 200
            return _showcase_record(row)
        body = {"key": "restaurant", **body}
    row = ShowcaseRecord(restaurant_id=user.restaurant_id, collection=collection, data=body)
    db.add(row); db.commit(); db.refresh(row)
    return _showcase_record(row)

@app.patch(api + "/showcase/{collection}/{record_id}")
def update_showcase(collection: str, record_id: str, body: dict[str, Any], user: User = Depends(current_user), db: Session = Depends(tenant_db)):
    _authorize_showcase(collection, user)
    row = db.scalar(select(ShowcaseRecord).where(ShowcaseRecord.id == record_id,
        ShowcaseRecord.restaurant_id == user.restaurant_id, ShowcaseRecord.collection == collection))
    if not row: raise HTTPException(404, "Record not found")
    row.data = {**row.data, **body}; row.updated_at = datetime.now(timezone.utc); db.commit(); db.refresh(row)
    return _showcase_record(row)

@app.delete(api + "/showcase/{collection}/{record_id}", status_code=204)
def delete_showcase(collection: str, record_id: str, user: User = Depends(current_user), db: Session = Depends(tenant_db)):
    _authorize_showcase(collection, user)
    row = db.scalar(select(ShowcaseRecord).where(ShowcaseRecord.id == record_id,
        ShowcaseRecord.restaurant_id == user.restaurant_id, ShowcaseRecord.collection == collection))
    if not row: raise HTTPException(404, "Record not found")
    db.delete(row); db.commit()

@app.websocket("/ws")
async def websocket_endpoint(socket: WebSocket, token: str):
    try:
        claims = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
        if claims.get("type") != "access": raise ValueError()
        db = SessionLocal()
        user = db.scalar(select(User).where(User.id == claims["sub"], User.restaurant_id == claims["restaurant_id"], User.active.is_(True)))
        db.close()
        if not user: raise ValueError()
    except (JWTError, ValueError, KeyError):
        await socket.close(code=4401); return
    await sockets.connect(user.restaurant_id, socket)
    try:
        while True: await socket.receive_text()
    except WebSocketDisconnect: sockets.disconnect(user.restaurant_id, socket)
