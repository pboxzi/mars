from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument
import ipaddress
import os
import logging
import asyncio
import resend
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Dict, List, Optional
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
import requests
from enum import Enum
from official_tour_schedule import (
    DEFAULT_TICKET_SETUP,
    OFFICIAL_TOUR_DESCRIPTION,
    OFFICIAL_TOUR_IMAGE_URL,
    OFFICIAL_TOUR_SCHEDULE,
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def parse_csv_env(name: str, default: str = "") -> List[str]:
    raw_value = os.environ.get(name, default)
    values = [item.strip() for item in raw_value.split(',') if item.strip()]
    return values

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', '').strip()
db_name = os.environ.get('DB_NAME', 'bruno_mars_vip')

if mongo_url:
    client = AsyncIOMotorClient(mongo_url)
    logger.info("Using configured MongoDB backend for %s", db_name)
else:
    try:
        from mongomock_motor import AsyncMongoMockClient
    except ImportError as exc:
        raise RuntimeError(
            "MONGO_URL is not configured and mongomock-motor is unavailable. "
            "Install mongomock-motor or set MONGO_URL to start the backend."
        ) from exc
    client = AsyncMongoMockClient()
    logger.info("Using local in-memory Mongo mock backend for %s", db_name)

db = client[db_name]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24
DEFAULT_ADMIN_EMAIL = os.environ.get('DEFAULT_ADMIN_EMAIL', 'admin@brunomars.com')
DEFAULT_ADMIN_PASSWORD = os.environ.get('DEFAULT_ADMIN_PASSWORD', '')
ADMIN_SETUP_KEY = os.environ.get('ADMIN_SETUP_KEY', '')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
SITE_SETTINGS_ID = 'public-contact'
CORS_ORIGINS = parse_csv_env('CORS_ORIGINS', '*') or ['*']

# Email Configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
SUPPORT_EMAIL = os.environ.get('SUPPORT_EMAIL', ADMIN_EMAIL)
SUPPORT_PHONE = os.environ.get('SUPPORT_PHONE', '')
SUPPORT_WHATSAPP = os.environ.get('SUPPORT_WHATSAPP', '')
SUPPORT_INSTAGRAM = os.environ.get('SUPPORT_INSTAGRAM', '')
SUPPORT_HOURS = os.environ.get('SUPPORT_HOURS', '')
TURNSTILE_SECRET_KEY = os.environ.get('TURNSTILE_SECRET_KEY', '').strip()
TURNSTILE_INCLUDE_REMOTEIP = os.environ.get('TURNSTILE_INCLUDE_REMOTEIP', '').strip().lower() in (
    '1',
    'true',
    'yes',
)
BOOKING_RATE_LIMIT = int(os.environ.get('BOOKING_RATE_LIMIT', '5'))
BOOKING_RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get('BOOKING_RATE_LIMIT_WINDOW_SECONDS', '900'))
SUBSCRIPTION_RATE_LIMIT = int(os.environ.get('SUBSCRIPTION_RATE_LIMIT', '6'))
SUBSCRIPTION_RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get('SUBSCRIPTION_RATE_LIMIT_WINDOW_SECONDS', '900'))
PAYMENT_UPDATE_RATE_LIMIT = int(os.environ.get('PAYMENT_UPDATE_RATE_LIMIT', '6'))
PAYMENT_UPDATE_RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get('PAYMENT_UPDATE_RATE_LIMIT_WINDOW_SECONDS', '900'))
resend.api_key = RESEND_API_KEY

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")
PUBLIC_RATE_LIMITS: Dict[str, List[float]] = {}
PUBLIC_RATE_LIMIT_LOCK = asyncio.Lock()


# ==================== ENUMS ====================
class TicketTypeEnum(str, Enum):
    GENERAL = "general"
    VIP = "vip"
    MEETGREET = "meetgreet"
    BACKSTAGE = "backstage"
    SOUNDCHECK = "soundcheck"
    PHOTOOP = "photoop"
    AFTERSHOW = "aftershow"
    HOSPITALITY = "hospitality"
    BIRTHDAY = "birthday"
    CORPORATE = "corporate"
    PRIVATEMEETUP = "privatemeetup"


class BookingStatusEnum(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"
    CONFIRMED = "confirmed"


class PaymentMethodEnum(str, Enum):
    ZELLE = "zelle"
    CASHAPP = "cashapp"
    APPLEPAY = "applepay"
    BANK = "bank"
    BTC = "btc"


class EventStatusEnum(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


# ==================== MODELS ====================

# Admin Models
class Admin(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class AdminCreate(BaseModel):
    email: EmailStr
    password: str


class AdminToken(BaseModel):
    token: str
    email: str


# Event Models
class Event(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    venue: str
    city: str
    date: str  # YYYY-MM-DD format
    time: str  # HH:MM format
    image_url: str
    description: str
    status: EventStatusEnum = EventStatusEnum.ACTIVE
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class EventCreate(BaseModel):
    title: str
    venue: str
    city: str
    date: str
    time: str
    image_url: str
    description: str
    status: Optional[EventStatusEnum] = EventStatusEnum.ACTIVE


class EventUpdate(BaseModel):
    title: Optional[str] = None
    venue: Optional[str] = None
    city: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    status: Optional[EventStatusEnum] = None


# Ticket Models
class TicketType(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_id: str
    type: TicketTypeEnum
    price_usd: float
    available_quantity: int
    total_quantity: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TicketTypeCreate(BaseModel):
    event_id: str
    type: TicketTypeEnum
    price_usd: float
    available_quantity: int
    total_quantity: int


class TicketTypeUpdate(BaseModel):
    price_usd: Optional[float] = None
    available_quantity: Optional[int] = None
    total_quantity: Optional[int] = None


# Booking Models
class BookingRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    confirmation_number: str = Field(default_factory=lambda: str(uuid.uuid4())[:8].upper())
    event_id: str
    ticket_type: TicketTypeEnum
    customer_name: str
    email: EmailStr
    phone: str
    quantity: int
    message: Optional[str] = None
    status: BookingStatusEnum = BookingStatusEnum.PENDING
    inventory_reserved: bool = False
    payment_method: Optional[PaymentMethodEnum] = None
    payment_instructions: Optional[str] = None
    btc_wallet_address: Optional[str] = None
    btc_amount: Optional[float] = None
    transaction_id: Optional[str] = None
    customer_payment_method: Optional[PaymentMethodEnum] = None
    customer_payment_reference: Optional[str] = None
    customer_payment_amount: Optional[float] = None
    customer_payment_notes: Optional[str] = None
    customer_payment_proof_url: Optional[str] = None
    customer_payment_submitted_at: Optional[datetime] = None
    admin_notes: Optional[str] = None
    request_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    confirmed_date: Optional[datetime] = None


class BookingRequestCreate(BaseModel):
    event_id: str
    ticket_type: TicketTypeEnum
    customer_name: str
    email: EmailStr
    phone: str
    quantity: int
    message: Optional[str] = None
    captcha_token: Optional[str] = None
    website: Optional[str] = None


class BookingApproval(BaseModel):
    payment_method: PaymentMethodEnum
    payment_instructions: str
    btc_wallet_address: Optional[str] = None
    btc_amount: Optional[float] = None
    admin_notes: Optional[str] = None


class BookingMarkPaid(BaseModel):
    transaction_id: Optional[str] = None
    admin_notes: Optional[str] = None


class BookingPaymentUpdate(BaseModel):
    payment_method: PaymentMethodEnum
    transaction_id: str
    payment_amount: Optional[float] = None
    proof_url: Optional[str] = None
    notes: Optional[str] = None
    captcha_token: Optional[str] = None
    website: Optional[str] = None


class BookingConfirm(BaseModel):
    admin_notes: Optional[str] = None


class BookingReject(BaseModel):
    admin_notes: str


class BookingRestore(BookingRequest):
    pass


# Payment Settings Models
class PaymentSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    payment_method: PaymentMethodEnum
    instructions: str
    btc_wallet_address: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PaymentSettingsUpdate(BaseModel):
    instructions: str
    btc_wallet_address: Optional[str] = None


class SiteSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = SITE_SETTINGS_ID
    support_email: Optional[EmailStr] = None
    support_phone: Optional[str] = None
    support_whatsapp: Optional[str] = None
    support_instagram: Optional[str] = None
    support_hours: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SiteSettingsUpdate(BaseModel):
    support_email: Optional[EmailStr] = None
    support_phone: Optional[str] = None
    support_whatsapp: Optional[str] = None
    support_instagram: Optional[str] = None
    support_hours: Optional[str] = None


class Subscription(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    source: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SubscriptionCreate(BaseModel):
    email: EmailStr
    source: Optional[str] = None
    captcha_token: Optional[str] = None
    website: Optional[str] = None


# Dashboard Stats Model
class DashboardStats(BaseModel):
    total_requests: int
    pending_count: int
    approved_count: int
    paid_count: int
    confirmed_count: int
    rejected_count: int
    total_revenue: float
    recent_bookings: List[BookingRequest]


# BTC Price Model
class BTCPrice(BaseModel):
    usd_to_btc: float
    btc_to_usd: float
    timestamp: datetime


# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_jwt_token(email: str) -> str:
    """Create a JWT token for admin"""
    payload = {
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_jwt_token(token: str) -> dict:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Dependency to verify admin JWT token"""
    token = credentials.credentials
    payload = verify_jwt_token(token)
    admin = await db.admins.find_one({"email": payload['email']}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin not found")
    return admin


def get_btc_price() -> float:
    """Get current BTC/USD price from CoinGecko API"""
    try:
        response = requests.get(
            'https://api.coingecko.com/api/v3/simple/price',
            params={'ids': 'bitcoin', 'vs_currencies': 'usd'},
            timeout=5
        )
        response.raise_for_status()
        return response.json()['bitcoin']['usd']
    except Exception as e:
        logger.error(f"Error fetching BTC price: {e}")
        return 50000.0  # Fallback price


def clean_text(value: Optional[str]) -> str:
    """Normalize optional text inputs before storing them."""
    return value.strip() if value else ""


BOOKING_DATE_FIELDS = [
    'request_date',
    'approved_date',
    'paid_date',
    'confirmed_date',
    'customer_payment_submitted_at'
]


def normalize_booking_datetime_fields(booking: Optional[dict]) -> Optional[dict]:
    """Convert serialized booking datetimes back into datetime objects."""
    if not booking:
        return booking

    for date_field in BOOKING_DATE_FIELDS:
        if booking.get(date_field) and isinstance(booking[date_field], str):
            booking[date_field] = datetime.fromisoformat(booking[date_field])

    return booking


def contact_value(value: Optional[str]) -> Optional[str]:
    """Normalize optional contact fields before storing them."""
    cleaned = clean_text(value)
    return cleaned or None


def get_client_ip(request: Request) -> str:
    """Best-effort client IP resolution behind Render/proxy layers."""
    forwarded_for = clean_text(request.headers.get('x-forwarded-for'))
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()

    real_ip = clean_text(request.headers.get('x-real-ip'))
    if real_ip:
        return real_ip

    true_client = clean_text(request.headers.get('true-client-ip'))
    if true_client:
        return true_client

    cf = clean_text(request.headers.get('cf-connecting-ip'))
    if cf:
        return cf

    return request.client.host if request.client else 'unknown'


def get_turnstile_remote_ip(request: Request) -> Optional[str]:
    """Visitor IP for Turnstile siteverify; omit when unknown (wrong IP breaks verification)."""
    forwarded_for = clean_text(request.headers.get('x-forwarded-for'))
    if forwarded_for:
        candidate = forwarded_for.split(',')[0].strip()
        if candidate:
            return candidate

    real_ip = clean_text(request.headers.get('x-real-ip'))
    if real_ip:
        return real_ip

    true_client = clean_text(request.headers.get('true-client-ip'))
    if true_client:
        return true_client

    cf = clean_text(request.headers.get('cf-connecting-ip'))
    if cf:
        return cf

    return None


def ensure_honeypot_clear(value: Optional[str]) -> None:
    """Reject obvious bot traffic when the hidden field is filled."""
    if clean_text(value):
        raise HTTPException(status_code=400, detail="Security check failed. Please refresh and try again.")


async def enforce_public_rate_limit(request: Request, bucket: str, limit: int, window_seconds: int) -> None:
    """Apply a small per-IP rate limit to public write endpoints."""
    now = datetime.now(timezone.utc).timestamp()
    rate_key = f"{bucket}:{get_client_ip(request)}"

    async with PUBLIC_RATE_LIMIT_LOCK:
        recent_hits = PUBLIC_RATE_LIMITS.get(rate_key, [])
        recent_hits = [ts for ts in recent_hits if now - ts < window_seconds]

        if len(recent_hits) >= limit:
            retry_after = max(1, int(window_seconds - (now - recent_hits[0])))
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests. Please wait about {retry_after} seconds and try again."
            )

        recent_hits.append(now)
        PUBLIC_RATE_LIMITS[rate_key] = recent_hits


async def verify_turnstile_token(token: Optional[str], request: Request) -> None:
    """Validate Turnstile when a secret key is configured."""
    if not TURNSTILE_SECRET_KEY:
        return

    cleaned_token = clean_text(token)
    if not cleaned_token:
        raise HTTPException(status_code=400, detail="Please complete the security check.")

    payload = {
        "secret": TURNSTILE_SECRET_KEY,
        "response": cleaned_token,
    }

    if TURNSTILE_INCLUDE_REMOTEIP:
        candidate_ip = clean_text(get_turnstile_remote_ip(request) or "")
        if candidate_ip:
            try:
                ipaddress.ip_address(candidate_ip)
                payload["remoteip"] = candidate_ip
            except ValueError:
                logger.warning("Skipping invalid Turnstile remote IP value: %s", candidate_ip)

    try:
        response = await asyncio.to_thread(
            requests.post,
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            data=payload,
            timeout=10,
        )
        result = response.json()
    except Exception as exc:
        logger.error("Turnstile verification failed: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Security verification is temporarily unavailable. Please try again."
        ) from exc

    if response.status_code >= 500:
        logger.error(
            "Turnstile verification service error: status=%s body=%s",
            response.status_code,
            result,
        )
        raise HTTPException(
            status_code=503,
            detail="Security verification is temporarily unavailable. Please try again."
        )

    if not result.get("success"):
        logger.warning(
            "Turnstile verification rejected token: status=%s errors=%s",
            response.status_code,
            result.get("error-codes", []),
        )
        raise HTTPException(status_code=400, detail="Please complete the security check and try again.")


def normalize_event_key(date_value: str, venue: str, city: str) -> str:
    """Build a normalized key for matching schedule entries."""
    return f"{clean_text(date_value)}|{clean_text(venue).lower()}|{clean_text(city).lower()}"


def build_official_event_document(schedule_item: dict) -> dict:
    """Create a deterministic event document for an official tour stop."""
    event_id = str(
        uuid.uuid5(
            uuid.NAMESPACE_URL,
            f"brunomars-tour::{schedule_item['date']}::{schedule_item['venue']}::{schedule_item['city']}"
        )
    )
    event = Event(
        id=event_id,
        title="The Romantic Tour",
        venue=schedule_item['venue'],
        city=schedule_item['city'],
        date=schedule_item['date'],
        time="19:00",
        image_url=OFFICIAL_TOUR_IMAGE_URL,
        description=OFFICIAL_TOUR_DESCRIPTION,
        status=EventStatusEnum.ACTIVE
    )
    doc = event.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    return doc


async def ensure_official_tour_schedule() -> None:
    """Make sure the official Bruno tour schedule exists in the database."""
    existing_events = await db.events.find({}, {"_id": 0, "id": 1, "date": 1, "venue": 1, "city": 1}).to_list(500)
    existing_keys = {
        normalize_event_key(event.get('date', ''), event.get('venue', ''), event.get('city', '')): event
        for event in existing_events
    }

    seeded_event_ids = []

    for schedule_item in OFFICIAL_TOUR_SCHEDULE:
        normalized_key = normalize_event_key(schedule_item['date'], schedule_item['venue'], schedule_item['city'])
        existing_event = existing_keys.get(normalized_key)

        if existing_event:
            seeded_event_ids.append(existing_event['id'])
            continue

        event_doc = build_official_event_document(schedule_item)
        await db.events.update_one(
            {"id": event_doc['id']},
            {"$setOnInsert": event_doc},
            upsert=True
        )
        seeded_event_ids.append(event_doc['id'])
        existing_keys[normalized_key] = {"id": event_doc['id']}

    for event_id in seeded_event_ids:
        for ticket_setup in DEFAULT_TICKET_SETUP:
            ticket = TicketType(
                event_id=event_id,
                type=ticket_setup['type'],
                price_usd=ticket_setup['price_usd'],
                available_quantity=ticket_setup['available_quantity'],
                total_quantity=ticket_setup['total_quantity']
            )
            ticket_doc = ticket.model_dump()
            ticket_doc['created_at'] = ticket_doc['created_at'].isoformat()
            await db.ticket_types.update_one(
                {"event_id": event_id, "type": ticket_doc['type']},
                {"$setOnInsert": ticket_doc},
                upsert=True
            )


async def get_site_settings_model() -> SiteSettings:
    """Return public-facing support settings with env fallbacks."""
    settings = await db.site_settings.find_one({"id": SITE_SETTINGS_ID}, {"_id": 0}) or {}

    if isinstance(settings.get('updated_at'), str):
        settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])

    return SiteSettings(
        id=SITE_SETTINGS_ID,
        support_email=settings.get('support_email') or contact_value(SUPPORT_EMAIL),
        support_phone=settings.get('support_phone') or contact_value(SUPPORT_PHONE),
        support_whatsapp=settings.get('support_whatsapp') or contact_value(SUPPORT_WHATSAPP),
        support_instagram=settings.get('support_instagram') or contact_value(SUPPORT_INSTAGRAM),
        support_hours=settings.get('support_hours') or contact_value(SUPPORT_HOURS),
        updated_at=settings.get('updated_at') or datetime.now(timezone.utc)
    )


async def save_subscription(payload: SubscriptionCreate) -> dict:
    """Persist a newsletter subscription and keep duplicate submits idempotent."""
    normalized_email = payload.email.lower().strip()
    existing = await db.subscriptions.find_one({"email": normalized_email}, {"_id": 0})
    if existing:
        return {
            "status": "already_subscribed",
            "email": normalized_email,
            "source": existing.get("source") or clean_text(payload.source) or None
        }

    subscription = Subscription(
        email=normalized_email,
        source=clean_text(payload.source) or None
    )
    document = subscription.model_dump()
    document["created_at"] = document["created_at"].isoformat()
    await db.subscriptions.insert_one(document)
    asyncio.create_task(send_subscription_confirmation_email(normalized_email))

    return {
        "status": "subscribed",
        "email": normalized_email,
        "source": subscription.source
    }


def get_ticket_type_label(ticket_type: str) -> str:
    labels = {
        "general": "General Admission",
        "vip": "VIP Access",
        "meetgreet": "Meet & Greet",
        "backstage": "Backstage Pass",
        "soundcheck": "Soundcheck Experience",
        "photoop": "Photo Op Experience",
        "aftershow": "After Show Lounge",
        "hospitality": "Private Table / Hospitality",
        "birthday": "Birthday / Celebration Package",
        "corporate": "Corporate Booking",
        "privatemeetup": "Private Meet-Up Request"
    }
    return labels.get(ticket_type, ticket_type)


def get_booking_status_label(status: str) -> str:
    labels = {
        "pending": "Pending Review",
        "approved": "Approved - Awaiting Payment",
        "paid": "Payment Received",
        "confirmed": "Confirmed",
        "rejected": "Rejected"
    }
    return labels.get(status, status.title())


def build_support_contact_html(site_settings: SiteSettings) -> str:
    support_items = []
    if site_settings.support_phone:
        support_items.append(
            f'<div class="detail-row"><span class="label">Phone:</span> '
            f'<a href="tel:{site_settings.support_phone}">{site_settings.support_phone}</a></div>'
        )
    if site_settings.support_whatsapp:
        support_items.append(
            f'<div class="detail-row"><span class="label">WhatsApp:</span> {site_settings.support_whatsapp}</div>'
        )
    if site_settings.support_instagram:
        support_items.append(
            f'<div class="detail-row"><span class="label">Instagram:</span> {site_settings.support_instagram}</div>'
        )
    if site_settings.support_hours:
        support_items.append(
            f'<div class="detail-row" style="border-bottom: none;"><span class="label">Response Hours:</span> '
            f'{site_settings.support_hours}</div>'
        )

    if not support_items:
        return ""

    return f"""
    <div class="booking-details">
        <h3>Contact Support</h3>
        <p>Include your confirmation number when you reach out so we can find your booking quickly.</p>
        {''.join(support_items)}
    </div>
    """


def build_payment_html(booking: dict) -> str:
    if booking.get('status') != 'approved' or not booking.get('payment_instructions'):
        return ""

    btc_block = ""
    if booking.get('btc_wallet_address'):
        btc_block = f"""
        <div class="detail-row">
            <span class="label">BTC Wallet:</span> {booking['btc_wallet_address']}
        </div>
        {f'<div class="detail-row" style="border-bottom: none;"><span class="label">BTC Amount:</span> {booking["btc_amount"]} BTC</div>' if booking.get('btc_amount') else ''}
        """

    return f"""
    <div class="booking-details">
        <h3>Payment Instructions</h3>
        <p style="white-space: pre-wrap;">{booking['payment_instructions']}</p>
        {btc_block}
    </div>
    """


def build_admin_notes_html(booking: dict) -> str:
    if not booking.get('admin_notes'):
        return ""

    return f"""
    <div class="booking-details">
        <h3>Additional Notes</h3>
        <p style="white-space: pre-wrap;">{booking['admin_notes']}</p>
    </div>
    """


def build_customer_payment_update_html(booking: dict) -> str:
    if not booking.get('customer_payment_submitted_at'):
        return ""

    submitted_at = booking['customer_payment_submitted_at']
    if isinstance(submitted_at, datetime):
        submitted_label = submitted_at.strftime('%B %d, %Y at %I:%M %p UTC')
    else:
        submitted_label = str(submitted_at)

    method_label = booking.get('customer_payment_method', '').upper()
    details = []

    if method_label:
        details.append(
            f'<div class="detail-row"><span class="label">Method:</span> {method_label}</div>'
        )
    if booking.get('customer_payment_reference'):
        details.append(
            f'<div class="detail-row"><span class="label">Reference:</span> {booking["customer_payment_reference"]}</div>'
        )
    if booking.get('customer_payment_amount'):
        details.append(
            f'<div class="detail-row"><span class="label">Amount:</span> ${booking["customer_payment_amount"]:,.2f}</div>'
        )
    if booking.get('customer_payment_proof_url'):
        details.append(
            f'<div class="detail-row"><span class="label">Proof:</span> '
            f'<a href="{booking["customer_payment_proof_url"]}">Open payment proof</a></div>'
        )
    if booking.get('customer_payment_notes'):
        details.append(
            f'<div class="detail-row"><span class="label">Notes:</span> {booking["customer_payment_notes"]}</div>'
        )
    details.append(
        f'<div class="detail-row" style="border-bottom: none;"><span class="label">Submitted:</span> {submitted_label}</div>'
    )

    return f"""
    <div class="booking-details">
        <h3>Customer Payment Update</h3>
        {''.join(details)}
    </div>
    """


# ==================== EMAIL NOTIFICATIONS ====================
async def send_booking_notification(booking: dict, event: dict, ticket: dict):
    """Send email notification to admin when new booking is submitted"""
    try:
        ticket_label = get_ticket_type_label(booking['ticket_type'])
        total_price = ticket['price_usd'] * booking['quantity']
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #d32f2f; color: white; padding: 20px; text-align: center; }}
                .content {{ background: #f9f9f9; padding: 20px; }}
                .booking-details {{ background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #d32f2f; }}
                .detail-row {{ padding: 8px 0; border-bottom: 1px solid #eee; }}
                .label {{ font-weight: bold; color: #d32f2f; }}
                .button {{ background: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; display: inline-block; margin: 20px 0; border-radius: 4px; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎫 New VIP Booking Request!</h1>
                </div>
                <div class="content">
                    <p><strong>You have a new booking request for The Romantic Tour!</strong></p>
                    
                    <div class="booking-details">
                        <h3>📋 Booking Details</h3>
                        <div class="detail-row">
                            <span class="label">Confirmation Number:</span> {booking['confirmation_number']}
                        </div>
                        <div class="detail-row">
                            <span class="label">Status:</span> PENDING APPROVAL
                        </div>
                    </div>
                    
                    <div class="booking-details">
                        <h3>🎤 Event Information</h3>
                        <div class="detail-row">
                            <span class="label">Event:</span> {event['title']}
                        </div>
                        <div class="detail-row">
                            <span class="label">Venue:</span> {event['venue']}
                        </div>
                        <div class="detail-row">
                            <span class="label">Location:</span> {event['city']}
                        </div>
                        <div class="detail-row">
                            <span class="label">Date:</span> {event['date']} at {event['time']}
                        </div>
                    </div>
                    
                    <div class="booking-details">
                        <h3>👤 Customer Information</h3>
                        <div class="detail-row">
                            <span class="label">Name:</span> {booking['customer_name']}
                        </div>
                        <div class="detail-row">
                            <span class="label">Email:</span> {booking['email']}
                        </div>
                        <div class="detail-row">
                            <span class="label">Phone:</span> {booking['phone']}
                        </div>
                    </div>
                    
                    <div class="booking-details">
                        <h3>💰 Ticket Information</h3>
                        <div class="detail-row">
                            <span class="label">Ticket Type:</span> {ticket_label}
                        </div>
                        <div class="detail-row">
                            <span class="label">Quantity:</span> {booking['quantity']}
                        </div>
                        <div class="detail-row">
                            <span class="label">Price per Ticket:</span> ${ticket['price_usd']:,.2f}
                        </div>
                        <div class="detail-row" style="border-bottom: none;">
                            <span class="label">Total Amount:</span> <strong style="color: #d32f2f; font-size: 18px;">${total_price:,.2f}</strong>
                        </div>
                    </div>
                    
                    {f'<div class="booking-details"><h3>💬 Customer Message</h3><p>{booking["message"]}</p></div>' if booking.get('message') else ''}
                    
                    <div style="text-align: center;">
                        <a href="{FRONTEND_URL}/admin-secret/bookings" class="button">
                            Review & Approve Booking
                        </a>
                    </div>
                </div>
                <div class="footer">
                    <p>This is an automated notification from your Bruno Mars VIP Concierge System</p>
                    <p>Login to your admin panel to manage this booking</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        params = {
            "from": SENDER_EMAIL,
            "to": [ADMIN_EMAIL],
            "subject": f"🎫 New VIP Booking: {ticket_label} - {event['venue']} ({event['date']})",
            "html": html_content
        }
        
        # Send email in background (non-blocking)
        await asyncio.to_thread(resend.Emails.send, params)
        logging.info(f"Booking notification sent to {ADMIN_EMAIL}")
        
    except Exception as e:
        logging.error(f"Failed to send booking notification: {str(e)}")
        # Don't raise exception - we don't want email failure to block booking


async def send_subscription_confirmation_email(email: str):
    """Send a simple confirmation email when someone subscribes for updates."""
    if not RESEND_API_KEY or not SENDER_EMAIL:
        return

    try:
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #111827; color: white; padding: 20px; text-align: center; }}
                .content {{ background: #f9f9f9; padding: 20px; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>You're subscribed</h1>
                </div>
                <div class="content">
                    <p>Thanks for subscribing to Bruno Mars updates.</p>
                    <p>We'll send you tour news, premium booking updates, and official announcements as they become available.</p>
                </div>
                <div class="footer">
                    <p>This is an automated subscription confirmation.</p>
                </div>
            </div>
        </body>
        </html>
        """

        await asyncio.to_thread(resend.Emails.send, {
            "from": SENDER_EMAIL,
            "to": [email],
            "subject": "Subscription confirmed",
            "html": html_content
        })
    except Exception as e:
        logging.error(f"Failed to send subscription confirmation email: {str(e)}")


async def send_customer_status_email(booking: dict, event: dict, site_settings: SiteSettings):
    """Send the customer a booking confirmation or status update email."""
    if not RESEND_API_KEY or not SENDER_EMAIL:
        return

    try:
        track_url = f"{FRONTEND_URL}/booking-status?confirmation={booking['confirmation_number']}"
        payment_update_url = f"{track_url}&action=payment"
        ticket_label = get_ticket_type_label(booking['ticket_type'])
        status_label = get_booking_status_label(booking['status'])

        status_content = {
            "pending": {
                "subject": f"Booking received: {booking['confirmation_number']}",
                "headline": "We received your booking request",
                "message": "Your request is in our review queue. Use the button below anytime to check the latest status."
            },
            "approved": {
                "subject": f"Booking approved: {booking['confirmation_number']}",
                "headline": "Your booking request has been approved",
                "message": "Your request is approved and waiting for payment. Your payment instructions are included below. After you pay, use the payment update button so our team can verify it quickly."
            },
            "paid": {
                "subject": f"Payment received: {booking['confirmation_number']}",
                "headline": "We received your payment",
                "message": "Your payment has been logged. We are finalizing your booking confirmation now."
            },
            "confirmed": {
                "subject": f"Booking confirmed: {booking['confirmation_number']}",
                "headline": "Your booking is confirmed",
                "message": "Everything is set. Keep this email and your confirmation number for reference."
            },
            "rejected": {
                "subject": f"Booking update: {booking['confirmation_number']}",
                "headline": "Your booking request could not be confirmed",
                "message": "Please review the notes below and contact us if you want help with another option."
            }
        }.get(booking['status'], {
            "subject": f"Booking update: {booking['confirmation_number']}",
            "headline": "Your booking status was updated",
            "message": "Use the tracking link below to review the latest status."
        })

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #111827; color: white; padding: 20px; text-align: center; }}
                .content {{ background: #f9f9f9; padding: 20px; }}
                .booking-details {{ background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #b91c1c; }}
                .detail-row {{ padding: 8px 0; border-bottom: 1px solid #eee; }}
                .label {{ font-weight: bold; color: #b91c1c; }}
                .button {{ background: #b91c1c; color: white; padding: 12px 30px; text-decoration: none; display: inline-block; margin: 20px 0; border-radius: 4px; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{status_content['headline']}</h1>
                </div>
                <div class="content">
                    <p>Hello {booking['customer_name']},</p>
                    <p>{status_content['message']}</p>

                    <div class="booking-details">
                        <h3>Booking Summary</h3>
                        <div class="detail-row">
                            <span class="label">Confirmation Number:</span> {booking['confirmation_number']}
                        </div>
                        <div class="detail-row">
                            <span class="label">Status:</span> {status_label}
                        </div>
                        <div class="detail-row">
                            <span class="label">Ticket Type:</span> {ticket_label}
                        </div>
                        <div class="detail-row">
                            <span class="label">Quantity:</span> {booking['quantity']}
                        </div>
                        <div class="detail-row" style="border-bottom: none;">
                            <span class="label">Event:</span> {event.get('title', 'Selected Event')} at {event.get('venue', 'Venue TBA')} on {event.get('date', 'TBA')}
                        </div>
                    </div>

                    {build_payment_html(booking)}
                    {build_customer_payment_update_html(booking)}
                    {build_admin_notes_html(booking)}
                    {build_support_contact_html(site_settings)}

                    <div style="text-align: center;">
                        <a href="{track_url}" class="button">Track Booking</a>
                        {f'<a href="{payment_update_url}" class="button" style="margin-left: 12px;">Submit Payment Update</a>' if booking['status'] == 'approved' else ''}
                    </div>
                </div>
                <div class="footer">
                    <p>This is an automated update from your booking concierge.</p>
                    <p>Keep your confirmation number handy for faster support.</p>
                </div>
            </div>
        </body>
        </html>
        """

        params = {
            "from": SENDER_EMAIL,
            "to": [booking['email']],
            "subject": status_content['subject'],
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        logging.info(f"Customer booking email sent to {booking['email']}")
    except Exception as e:
        logging.error(f"Failed to send customer booking email: {str(e)}")
        # Don't raise exception - booking flow should continue even if email fails


async def send_admin_payment_update_email(booking: dict, event: dict):
    """Notify admin when a customer submits payment details."""
    if not RESEND_API_KEY or not SENDER_EMAIL or not ADMIN_EMAIL:
        return

    try:
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #111827; color: white; padding: 20px; text-align: center; }}
                .content {{ background: #f9f9f9; padding: 20px; }}
                .booking-details {{ background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #b91c1c; }}
                .detail-row {{ padding: 8px 0; border-bottom: 1px solid #eee; }}
                .label {{ font-weight: bold; color: #b91c1c; }}
                .button {{ background: #b91c1c; color: white; padding: 12px 30px; text-decoration: none; display: inline-block; margin: 20px 0; border-radius: 4px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Customer payment update received</h1>
                </div>
                <div class="content">
                    <div class="booking-details">
                        <h3>Booking Summary</h3>
                        <div class="detail-row"><span class="label">Confirmation Number:</span> {booking['confirmation_number']}</div>
                        <div class="detail-row"><span class="label">Customer:</span> {booking['customer_name']}</div>
                        <div class="detail-row"><span class="label">Email:</span> {booking['email']}</div>
                        <div class="detail-row" style="border-bottom: none;"><span class="label">Event:</span> {event.get('venue', 'Venue TBA')} on {event.get('date', 'TBA')}</div>
                    </div>
                    {build_customer_payment_update_html(booking)}
                    <div style="text-align: center;">
                        <a href="{FRONTEND_URL}/admin-secret/bookings" class="button">Review Booking</a>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """

        await asyncio.to_thread(resend.Emails.send, {
            "from": SENDER_EMAIL,
            "to": [ADMIN_EMAIL],
            "subject": f"Payment update submitted: {booking['confirmation_number']}",
            "html": html_content
        })
    except Exception as e:
        logging.error(f"Failed to send admin payment update email: {str(e)}")


async def send_customer_payment_update_received_email(booking: dict, event: dict, site_settings: SiteSettings):
    """Acknowledge to the customer that their payment update was received."""
    if not RESEND_API_KEY or not SENDER_EMAIL:
        return

    try:
        track_url = f"{FRONTEND_URL}/booking-status?confirmation={booking['confirmation_number']}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #111827; color: white; padding: 20px; text-align: center; }}
                .content {{ background: #f9f9f9; padding: 20px; }}
                .booking-details {{ background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #b91c1c; }}
                .detail-row {{ padding: 8px 0; border-bottom: 1px solid #eee; }}
                .label {{ font-weight: bold; color: #b91c1c; }}
                .button {{ background: #b91c1c; color: white; padding: 12px 30px; text-decoration: none; display: inline-block; margin: 20px 0; border-radius: 4px; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>We received your payment update</h1>
                </div>
                <div class="content">
                    <p>Hello {booking['customer_name']},</p>
                    <p>Thanks for sending your payment details. Our team will review the information and update your booking as soon as it is verified.</p>
                    <div class="booking-details">
                        <h3>Booking Summary</h3>
                        <div class="detail-row"><span class="label">Confirmation Number:</span> {booking['confirmation_number']}</div>
                        <div class="detail-row"><span class="label">Status:</span> Awaiting payment verification</div>
                        <div class="detail-row" style="border-bottom: none;"><span class="label">Event:</span> {event.get('venue', 'Venue TBA')} on {event.get('date', 'TBA')}</div>
                    </div>
                    {build_customer_payment_update_html(booking)}
                    {build_support_contact_html(site_settings)}
                    <div style="text-align: center;">
                        <a href="{track_url}" class="button">Track Booking</a>
                    </div>
                </div>
                <div class="footer">
                    <p>This is an automated payment acknowledgment email.</p>
                </div>
            </div>
        </body>
        </html>
        """

        await asyncio.to_thread(resend.Emails.send, {
            "from": SENDER_EMAIL,
            "to": [booking['email']],
            "subject": f"Payment update received: {booking['confirmation_number']}",
            "html": html_content
        })
    except Exception as e:
        logging.error(f"Failed to send customer payment update email: {str(e)}")


# ==================== PUBLIC API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "VIP Concierge Booking System API"}


# Get BTC Price
@api_router.get("/btc-price", response_model=BTCPrice)
async def get_btc_price_endpoint():
    """Get current BTC/USD conversion rate"""
    btc_price = get_btc_price()
    return BTCPrice(
        usd_to_btc=1 / btc_price,
        btc_to_usd=btc_price,
        timestamp=datetime.now(timezone.utc)
    )


# Get all active events (public)
@api_router.get("/events", response_model=List[Event])
async def get_public_events():
    """Get all active events for public viewing"""
    await ensure_official_tour_schedule()
    events = await db.events.find({"status": "active"}, {"_id": 0}).to_list(100)
    for event in events:
        if isinstance(event.get('created_at'), str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
    return events


# Get event details with tickets (public)
@api_router.get("/events/{event_id}", response_model=dict)
async def get_event_details(event_id: str):
    """Get event details with available ticket types"""
    await ensure_official_tour_schedule()
    event = await db.events.find_one({"id": event_id, "status": "active"}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if isinstance(event.get('created_at'), str):
        event['created_at'] = datetime.fromisoformat(event['created_at'])
    
    # Get ticket types for this event
    tickets = await db.ticket_types.find({"event_id": event_id}, {"_id": 0}).to_list(10)
    for ticket in tickets:
        if isinstance(ticket.get('created_at'), str):
            ticket['created_at'] = datetime.fromisoformat(ticket['created_at'])
    
    return {
        "event": event,
        "tickets": tickets
    }


# Get customer support settings (public)
@api_router.get("/site-settings", response_model=SiteSettings)
async def get_public_site_settings():
    """Get public-facing support and communication settings."""
    return await get_site_settings_model()


# Newsletter subscribe (public)
@api_router.post("/subscriptions")
async def create_subscription(subscription: SubscriptionCreate, request: Request):
    """Subscribe an email address to updates."""
    await enforce_public_rate_limit(
        request,
        "subscriptions",
        SUBSCRIPTION_RATE_LIMIT,
        SUBSCRIPTION_RATE_LIMIT_WINDOW_SECONDS,
    )
    ensure_honeypot_clear(subscription.website)
    await verify_turnstile_token(subscription.captcha_token, request)
    return await save_subscription(subscription)


@api_router.get("/health")
async def health_check():
    """Simple health endpoint for hosted uptime checks."""
    return {
        "status": "ok",
        "db_backend": "mongodb" if mongo_url else "in-memory",
        "db_name": db_name,
        "email_ready": bool(RESEND_API_KEY and SENDER_EMAIL and ADMIN_EMAIL),
        "captcha_ready": bool(TURNSTILE_SECRET_KEY),
    }


# Submit booking request (public)
@api_router.post("/bookings", response_model=BookingRequest)
async def create_booking_request(booking: BookingRequestCreate, request: Request):
    """Submit a booking request"""
    await ensure_official_tour_schedule()
    await enforce_public_rate_limit(
        request,
        "bookings",
        BOOKING_RATE_LIMIT,
        BOOKING_RATE_LIMIT_WINDOW_SECONDS,
    )
    ensure_honeypot_clear(booking.website)
    await verify_turnstile_token(booking.captcha_token, request)
    # Verify event exists
    event = await db.events.find_one({"id": booking.event_id, "status": "active"}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Verify ticket type exists and has availability
    ticket = await db.ticket_types.find_one({
        "event_id": booking.event_id,
        "type": booking.ticket_type
    }, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket type not found")
    
    if ticket['available_quantity'] < booking.quantity:
        raise HTTPException(status_code=400, detail="Not enough tickets available")
    
    # Create booking request
    booking_obj = BookingRequest(**booking.model_dump(exclude={"captcha_token", "website"}))
    doc = booking_obj.model_dump()
    doc['request_date'] = doc['request_date'].isoformat()
    
    await db.booking_requests.insert_one(doc)
    
    site_settings = await get_site_settings_model()

    # Send email notification to admin (non-blocking)
    asyncio.create_task(send_booking_notification(doc, event, ticket))
    asyncio.create_task(send_customer_status_email(doc, event, site_settings))
    
    return booking_obj


@api_router.post("/bookings/{confirmation_number}/payment-update", response_model=BookingRequest)
async def submit_payment_update(confirmation_number: str, payment_update: BookingPaymentUpdate, request: Request):
    """Allow customers to submit payment details after approval."""
    await enforce_public_rate_limit(
        request,
        "payment-update",
        PAYMENT_UPDATE_RATE_LIMIT,
        PAYMENT_UPDATE_RATE_LIMIT_WINDOW_SECONDS,
    )
    ensure_honeypot_clear(payment_update.website)
    await verify_turnstile_token(payment_update.captcha_token, request)
    booking = await db.booking_requests.find_one(
        {"confirmation_number": confirmation_number.upper()},
        {"_id": 0}
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking['status'] != 'approved':
        raise HTTPException(
            status_code=400,
            detail="Payment updates can only be submitted after approval and before final payment verification."
        )

    update_data = {
        "customer_payment_method": payment_update.payment_method,
        "customer_payment_reference": clean_text(payment_update.transaction_id),
        "customer_payment_amount": payment_update.payment_amount if payment_update.payment_amount and payment_update.payment_amount > 0 else None,
        "customer_payment_notes": contact_value(payment_update.notes),
        "customer_payment_proof_url": contact_value(payment_update.proof_url),
        "customer_payment_submitted_at": datetime.now(timezone.utc).isoformat()
    }

    await db.booking_requests.update_one(
        {"confirmation_number": confirmation_number.upper()},
        {"$set": update_data}
    )

    updated_booking = await db.booking_requests.find_one(
        {"confirmation_number": confirmation_number.upper()},
        {"_id": 0}
    )
    normalize_booking_datetime_fields(updated_booking)

    event = await db.events.find_one({"id": updated_booking['event_id']}, {"_id": 0}) or {}
    site_settings = await get_site_settings_model()
    asyncio.create_task(send_admin_payment_update_email(updated_booking, event))
    asyncio.create_task(send_customer_payment_update_received_email(updated_booking, event, site_settings))

    return updated_booking


# Check booking status (public)
@api_router.get("/bookings/{confirmation_number}", response_model=dict)
async def get_booking_status(confirmation_number: str):
    """Check booking status by confirmation number"""
    booking = await db.booking_requests.find_one(
        {"confirmation_number": confirmation_number.upper()},
        {"_id": 0}
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    normalize_booking_datetime_fields(booking)
    
    # Get event details
    event = await db.events.find_one({"id": booking['event_id']}, {"_id": 0})
    
    return {
        "booking": booking,
        "event": event
    }


# ==================== ADMIN API ROUTES ====================

# Admin Login
@api_router.post("/admin/login", response_model=AdminToken)
async def admin_login(credentials: AdminLogin):
    """Admin login endpoint"""
    admin = await db.admins.find_one({"email": credentials.email}, {"_id": 0})
    if not admin or not verify_password(credentials.password, admin['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = create_jwt_token(credentials.email)
    return AdminToken(token=token, email=credentials.email)


# Seed default admin (for initial setup)
@api_router.post("/admin/seed")
async def seed_admin(x_setup_key: Optional[str] = Header(default=None)):
    """Create default admin account (use only once)"""
    if not ADMIN_SETUP_KEY or not DEFAULT_ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin seeding is disabled. Configure ADMIN_SETUP_KEY and DEFAULT_ADMIN_PASSWORD."
        )

    if x_setup_key != ADMIN_SETUP_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid setup key"
        )

    # Check if admin already exists
    existing = await db.admins.find_one({"email": DEFAULT_ADMIN_EMAIL})
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    admin = Admin(
        email=DEFAULT_ADMIN_EMAIL,
        password_hash=hash_password(DEFAULT_ADMIN_PASSWORD)
    )
    doc = admin.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.admins.insert_one(doc)
    
    return {"message": "Admin created successfully", "email": DEFAULT_ADMIN_EMAIL}


# Dashboard Stats
@api_router.get("/admin/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(admin: dict = Depends(get_current_admin)):
    """Get dashboard statistics"""
    all_bookings = await db.booking_requests.find({}, {"_id": 0}).to_list(1000)
    
    pending = [b for b in all_bookings if b['status'] == 'pending']
    approved = [b for b in all_bookings if b['status'] == 'approved']
    paid = [b for b in all_bookings if b['status'] == 'paid']
    confirmed = [b for b in all_bookings if b['status'] == 'confirmed']
    rejected = [b for b in all_bookings if b['status'] == 'rejected']
    
    # Calculate total revenue (confirmed bookings only)
    total_revenue = 0.0
    for booking in confirmed:
        ticket = await db.ticket_types.find_one({
            "event_id": booking['event_id'],
            "type": booking['ticket_type']
        })
        if ticket:
            total_revenue += ticket['price_usd'] * booking['quantity']
    
    # Get recent bookings (last 10)
    recent = sorted(all_bookings, key=lambda x: x['request_date'], reverse=True)[:10]
    for booking in recent:
        normalize_booking_datetime_fields(booking)
    
    return DashboardStats(
        total_requests=len(all_bookings),
        pending_count=len(pending),
        approved_count=len(approved),
        paid_count=len(paid),
        confirmed_count=len(confirmed),
        rejected_count=len(rejected),
        total_revenue=total_revenue,
        recent_bookings=recent
    )


# ==================== EVENT MANAGEMENT (ADMIN) ====================

@api_router.get("/admin/events", response_model=List[Event])
async def get_all_events(admin: dict = Depends(get_current_admin)):
    """Get all events (admin only)"""
    await ensure_official_tour_schedule()
    events = await db.events.find({}, {"_id": 0}).to_list(100)
    for event in events:
        if isinstance(event.get('created_at'), str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
    return events


@api_router.post("/admin/events", response_model=Event)
async def create_event(event_data: EventCreate, admin: dict = Depends(get_current_admin)):
    """Create a new event"""
    event = Event(**event_data.model_dump())
    doc = event.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.events.insert_one(doc)
    return event


@api_router.put("/admin/events/{event_id}", response_model=Event)
async def update_event(event_id: str, event_data: EventUpdate, admin: dict = Depends(get_current_admin)):
    """Update an event"""
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    update_data = {k: v for k, v in event_data.model_dump().items() if v is not None}
    if update_data:
        await db.events.update_one({"id": event_id}, {"$set": update_data})
    
    updated_event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if isinstance(updated_event.get('created_at'), str):
        updated_event['created_at'] = datetime.fromisoformat(updated_event['created_at'])
    return updated_event


@api_router.delete("/admin/events/{event_id}")
async def delete_event(event_id: str, admin: dict = Depends(get_current_admin)):
    """Delete an event"""
    result = await db.events.delete_one({"id": event_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Also delete associated tickets
    await db.ticket_types.delete_many({"event_id": event_id})
    
    return {"message": "Event deleted successfully"}


# ==================== TICKET MANAGEMENT (ADMIN) ====================

@api_router.get("/admin/tickets/{event_id}", response_model=List[TicketType])
async def get_event_tickets(event_id: str, admin: dict = Depends(get_current_admin)):
    """Get all tickets for an event"""
    tickets = await db.ticket_types.find({"event_id": event_id}, {"_id": 0}).to_list(10)
    for ticket in tickets:
        if isinstance(ticket.get('created_at'), str):
            ticket['created_at'] = datetime.fromisoformat(ticket['created_at'])
    return tickets


@api_router.post("/admin/tickets", response_model=TicketType)
async def create_ticket_type(ticket_data: TicketTypeCreate, admin: dict = Depends(get_current_admin)):
    """Create or update ticket type for an event"""
    # Check if ticket type already exists
    existing = await db.ticket_types.find_one({
        "event_id": ticket_data.event_id,
        "type": ticket_data.type
    })
    
    if existing:
        # Update existing
        update_data = ticket_data.model_dump()
        await db.ticket_types.update_one(
            {"event_id": ticket_data.event_id, "type": ticket_data.type},
            {"$set": update_data}
        )
        existing.update(update_data)
        if isinstance(existing.get('created_at'), str):
            existing['created_at'] = datetime.fromisoformat(existing['created_at'])
        return existing
    else:
        # Create new
        ticket = TicketType(**ticket_data.model_dump())
        doc = ticket.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        await db.ticket_types.insert_one(doc)
        return ticket


@api_router.put("/admin/tickets/{ticket_id}", response_model=TicketType)
async def update_ticket_type(ticket_id: str, ticket_data: TicketTypeUpdate, admin: dict = Depends(get_current_admin)):
    """Update ticket type"""
    update_data = {k: v for k, v in ticket_data.model_dump().items() if v is not None}
    if update_data:
        await db.ticket_types.update_one({"id": ticket_id}, {"$set": update_data})
    
    ticket = await db.ticket_types.find_one({"id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    if isinstance(ticket.get('created_at'), str):
        ticket['created_at'] = datetime.fromisoformat(ticket['created_at'])
    return ticket


# ==================== BOOKING MANAGEMENT (ADMIN) ====================

@api_router.get("/admin/bookings", response_model=List[BookingRequest])
async def get_all_bookings(
    status_filter: Optional[BookingStatusEnum] = None,
    admin: dict = Depends(get_current_admin)
):
    """Get all booking requests with optional status filter"""
    query = {}
    if status_filter:
        query['status'] = status_filter
    
    bookings = await db.booking_requests.find(query, {"_id": 0}).to_list(1000)
    for booking in bookings:
        normalize_booking_datetime_fields(booking)

    return bookings


@api_router.post("/admin/bookings/restore", response_model=BookingRequest)
async def restore_booking_snapshot(
    booking_data: BookingRestore,
    admin: dict = Depends(get_current_admin)
):
    """Restore a booking snapshot into the local admin environment."""
    await ensure_official_tour_schedule()

    existing_booking = await db.booking_requests.find_one(
        {"confirmation_number": booking_data.confirmation_number},
        {"_id": 0}
    )

    booking_doc = booking_data.model_dump()
    for date_field in BOOKING_DATE_FIELDS:
        if booking_doc.get(date_field):
            booking_doc[date_field] = booking_doc[date_field].isoformat()

    if booking_doc.get('inventory_reserved') and not (existing_booking and existing_booking.get('inventory_reserved')):
        reserved_ticket = await db.ticket_types.find_one_and_update(
            {
                "event_id": booking_doc['event_id'],
                "type": booking_doc['ticket_type'],
                "available_quantity": {"$gte": booking_doc['quantity']}
            },
            {"$inc": {"available_quantity": -booking_doc['quantity']}},
            projection={"_id": 0},
            return_document=ReturnDocument.AFTER
        )
        if not reserved_ticket:
            raise HTTPException(
                status_code=400,
                detail="Unable to restore booking because ticket inventory could not be reserved."
            )

    await db.booking_requests.update_one(
        {"confirmation_number": booking_doc['confirmation_number']},
        {"$set": booking_doc},
        upsert=True
    )

    return booking_data


@api_router.put("/admin/bookings/{booking_id}/approve", response_model=BookingRequest)
async def approve_booking(
    booking_id: str,
    approval_data: BookingApproval,
    admin: dict = Depends(get_current_admin)
):
    """Approve a booking request"""
    booking = await db.booking_requests.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking['status'] != 'pending':
        raise HTTPException(status_code=400, detail="Only pending bookings can be approved")
    ticket = await db.ticket_types.find_one({
        "event_id": booking['event_id'],
        "type": booking['ticket_type']
    }, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket type not found")

    saved_settings = await db.payment_settings.find_one(
        {"payment_method": approval_data.payment_method},
        {"_id": 0}
    )

    payment_instructions = clean_text(approval_data.payment_instructions) or clean_text(
        saved_settings.get('instructions') if saved_settings else None
    )
    if not payment_instructions:
        raise HTTPException(status_code=400, detail="Payment instructions are required")

    btc_wallet_address = clean_text(approval_data.btc_wallet_address) or clean_text(
        saved_settings.get('btc_wallet_address') if saved_settings else None
    )
    btc_amount = approval_data.btc_amount if approval_data.btc_amount and approval_data.btc_amount > 0 else None

    if approval_data.payment_method == PaymentMethodEnum.BTC:
        if not btc_wallet_address:
            raise HTTPException(status_code=400, detail="BTC wallet address is required for Bitcoin approvals")
        if btc_amount is None:
            total_usd = ticket['price_usd'] * booking['quantity']
            btc_amount = round(total_usd / get_btc_price(), 8)

    reserved_ticket = await db.ticket_types.find_one_and_update(
        {
            "event_id": booking['event_id'],
            "type": booking['ticket_type'],
            "available_quantity": {"$gte": booking['quantity']}
        },
        {"$inc": {"available_quantity": -booking['quantity']}},
        projection={"_id": 0},
        return_document=ReturnDocument.AFTER
    )
    if not reserved_ticket:
        raise HTTPException(status_code=400, detail="Not enough tickets available to approve this booking")

    update_data = {
        'status': 'approved',
        'inventory_reserved': True,
        'payment_method': approval_data.payment_method,
        'payment_instructions': payment_instructions,
        'approved_date': datetime.now(timezone.utc).isoformat()
    }
    
    if btc_wallet_address:
        update_data['btc_wallet_address'] = btc_wallet_address
    if btc_amount is not None:
        update_data['btc_amount'] = btc_amount
    if approval_data.admin_notes:
        update_data['admin_notes'] = approval_data.admin_notes

    try:
        await db.booking_requests.update_one({"id": booking_id}, {"$set": update_data})
    except Exception:
        await db.ticket_types.update_one(
            {"event_id": booking['event_id'], "type": booking['ticket_type']},
            {"$inc": {"available_quantity": booking['quantity']}}
        )
        raise
    
    updated_booking = await db.booking_requests.find_one({"id": booking_id}, {"_id": 0})
    normalize_booking_datetime_fields(updated_booking)

    event = await db.events.find_one({"id": booking['event_id']}, {"_id": 0}) or {}
    site_settings = await get_site_settings_model()
    asyncio.create_task(send_customer_status_email(updated_booking, event, site_settings))
    
    return updated_booking


@api_router.put("/admin/bookings/{booking_id}/reject", response_model=BookingRequest)
async def reject_booking(
    booking_id: str,
    reject_data: BookingReject,
    admin: dict = Depends(get_current_admin)
):
    """Reject a booking request"""
    booking = await db.booking_requests.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking['status'] not in {'pending', 'approved', 'paid'}:
        raise HTTPException(
            status_code=400,
            detail="Only pending, approved, or paid bookings can be rejected"
        )

    if booking['status'] in {'approved', 'paid'} and booking.get('inventory_reserved'):
        ticket = await db.ticket_types.find_one(
            {"event_id": booking['event_id'], "type": booking['ticket_type']},
            {"_id": 0}
        )
        if ticket:
            restored_quantity = min(
                ticket['total_quantity'],
                ticket['available_quantity'] + booking['quantity']
            )
            await db.ticket_types.update_one(
                {"event_id": booking['event_id'], "type": booking['ticket_type']},
                {"$set": {"available_quantity": restored_quantity}}
            )

    update_data = {
        'status': 'rejected',
        'inventory_reserved': False,
        'admin_notes': reject_data.admin_notes
    }
    
    await db.booking_requests.update_one({"id": booking_id}, {"$set": update_data})
    
    updated_booking = await db.booking_requests.find_one({"id": booking_id}, {"_id": 0})
    normalize_booking_datetime_fields(updated_booking)

    event = await db.events.find_one({"id": booking['event_id']}, {"_id": 0}) or {}
    site_settings = await get_site_settings_model()
    asyncio.create_task(send_customer_status_email(updated_booking, event, site_settings))
    
    return updated_booking


@api_router.put("/admin/bookings/{booking_id}/mark-paid", response_model=BookingRequest)
async def mark_booking_paid(
    booking_id: str,
    paid_data: BookingMarkPaid,
    admin: dict = Depends(get_current_admin)
):
    """Mark a booking as paid"""
    booking = await db.booking_requests.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking['status'] != 'approved':
        raise HTTPException(status_code=400, detail="Only approved bookings can be marked as paid")
    
    update_data = {
        'status': 'paid',
        'paid_date': datetime.now(timezone.utc).isoformat()
    }
    
    if paid_data.transaction_id:
        update_data['transaction_id'] = paid_data.transaction_id
    if paid_data.admin_notes:
        update_data['admin_notes'] = paid_data.admin_notes
    
    await db.booking_requests.update_one({"id": booking_id}, {"$set": update_data})
    
    updated_booking = await db.booking_requests.find_one({"id": booking_id}, {"_id": 0})
    normalize_booking_datetime_fields(updated_booking)

    event = await db.events.find_one({"id": booking['event_id']}, {"_id": 0}) or {}
    site_settings = await get_site_settings_model()
    asyncio.create_task(send_customer_status_email(updated_booking, event, site_settings))
    
    return updated_booking


@api_router.put("/admin/bookings/{booking_id}/confirm", response_model=BookingRequest)
async def confirm_booking(
    booking_id: str,
    confirm_data: BookingConfirm,
    admin: dict = Depends(get_current_admin)
):
    """Confirm a booking"""
    booking = await db.booking_requests.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking['status'] != 'paid':
        raise HTTPException(status_code=400, detail="Only paid bookings can be confirmed")
    
    update_data = {
        'status': 'confirmed',
        'inventory_reserved': True,
        'confirmed_date': datetime.now(timezone.utc).isoformat()
    }
    
    if confirm_data.admin_notes:
        update_data['admin_notes'] = confirm_data.admin_notes

    if not booking.get('inventory_reserved'):
        reserved_ticket = await db.ticket_types.find_one_and_update(
            {
                "event_id": booking['event_id'],
                "type": booking['ticket_type'],
                "available_quantity": {"$gte": booking['quantity']}
            },
            {"$inc": {"available_quantity": -booking['quantity']}},
            projection={"_id": 0},
            return_document=ReturnDocument.AFTER
        )
        if not reserved_ticket:
            raise HTTPException(
                status_code=400,
                detail="Not enough tickets available to confirm this booking"
            )
    
    await db.booking_requests.update_one({"id": booking_id}, {"$set": update_data})
    
    updated_booking = await db.booking_requests.find_one({"id": booking_id}, {"_id": 0})
    normalize_booking_datetime_fields(updated_booking)

    event = await db.events.find_one({"id": booking['event_id']}, {"_id": 0}) or {}
    site_settings = await get_site_settings_model()
    asyncio.create_task(send_customer_status_email(updated_booking, event, site_settings))
    
    return updated_booking


# ==================== PAYMENT SETTINGS (ADMIN) ====================

@api_router.get("/admin/payment-settings", response_model=List[PaymentSettings])
async def get_payment_settings(admin: dict = Depends(get_current_admin)):
    """Get all payment settings"""
    settings = await db.payment_settings.find({}, {"_id": 0}).to_list(10)
    for setting in settings:
        if isinstance(setting.get('updated_at'), str):
            setting['updated_at'] = datetime.fromisoformat(setting['updated_at'])
    return settings


@api_router.put("/admin/payment-settings/{payment_method}", response_model=PaymentSettings)
async def update_payment_settings(
    payment_method: PaymentMethodEnum,
    settings_data: PaymentSettingsUpdate,
    admin: dict = Depends(get_current_admin)
):
    """Update payment settings for a specific payment method"""
    existing = await db.payment_settings.find_one({"payment_method": payment_method})
    
    if existing:
        update_data = settings_data.model_dump()
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.payment_settings.update_one(
            {"payment_method": payment_method},
            {"$set": update_data}
        )
        existing.update(update_data)
        if isinstance(existing.get('updated_at'), str):
            existing['updated_at'] = datetime.fromisoformat(existing['updated_at'])
        return existing
    else:
        settings = PaymentSettings(
            payment_method=payment_method,
            **settings_data.model_dump()
        )
        doc = settings.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.payment_settings.insert_one(doc)
        return settings


@api_router.get("/admin/site-settings", response_model=SiteSettings)
async def get_admin_site_settings(admin: dict = Depends(get_current_admin)):
    """Get customer-facing support settings for admin editing."""
    return await get_site_settings_model()


@api_router.put("/admin/site-settings", response_model=SiteSettings)
async def update_site_settings(
    settings_data: SiteSettingsUpdate,
    admin: dict = Depends(get_current_admin)
):
    """Update customer-facing support settings."""
    next_settings = {
        "id": SITE_SETTINGS_ID,
        "support_email": settings_data.support_email,
        "support_phone": contact_value(settings_data.support_phone),
        "support_whatsapp": contact_value(settings_data.support_whatsapp),
        "support_instagram": contact_value(settings_data.support_instagram),
        "support_hours": contact_value(settings_data.support_hours),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    await db.site_settings.update_one(
        {"id": SITE_SETTINGS_ID},
        {"$set": next_settings},
        upsert=True
    )

    return await get_site_settings_model()


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_tasks():
    await ensure_official_tour_schedule()
    if not mongo_url:
        logger.warning(
            "MONGO_URL is not configured. Using the in-memory database fallback; "
            "data will reset whenever the backend restarts."
        )
    missing_email_settings = []
    if not RESEND_API_KEY:
        missing_email_settings.append('RESEND_API_KEY')
    if not ADMIN_EMAIL:
        missing_email_settings.append('ADMIN_EMAIL')
    if not SENDER_EMAIL:
        missing_email_settings.append('SENDER_EMAIL')

    if missing_email_settings:
        logger.warning(
            "Email delivery is not fully configured. Missing: %s",
            ", ".join(missing_email_settings)
        )
    elif SENDER_EMAIL == 'onboarding@resend.dev':
        logger.warning(
            "Email delivery is using the default Resend onboarding sender. "
            "Use a verified sender address for production delivery."
        )

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
