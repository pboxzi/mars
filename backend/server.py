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
from urllib.parse import urlparse
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
WHATSAPP_ACCESS_TOKEN = os.environ.get('WHATSAPP_ACCESS_TOKEN', '').strip()
WHATSAPP_PHONE_NUMBER_ID = os.environ.get('WHATSAPP_PHONE_NUMBER_ID', '').strip()
WHATSAPP_WABA_ID = os.environ.get('WHATSAPP_WABA_ID', '').strip()
WHATSAPP_ALERT_TO_NUMBER = os.environ.get('WHATSAPP_ALERT_TO_NUMBER', '').strip()
WHATSAPP_ALERT_TEMPLATE_NAME = os.environ.get('WHATSAPP_ALERT_TEMPLATE_NAME', '').strip()
WHATSAPP_ALERT_TEMPLATE_LANGUAGE = os.environ.get('WHATSAPP_ALERT_TEMPLATE_LANGUAGE', 'en_US').strip() or 'en_US'
WHATSAPP_ALERT_TEXT_FALLBACK = os.environ.get('WHATSAPP_ALERT_TEXT_FALLBACK', '').strip().lower() in (
    '1',
    'true',
    'yes',
)
TURNSTILE_SITE_KEY = os.environ.get('TURNSTILE_SITE_KEY', '').strip()
TURNSTILE_SECRET_KEY = os.environ.get('TURNSTILE_SECRET_KEY', '').strip()
TURNSTILE_INCLUDE_REMOTEIP = os.environ.get('TURNSTILE_INCLUDE_REMOTEIP', '').strip().lower() in (
    '1',
    'true',
    'yes',
)
DISABLE_TURNSTILE_VERIFICATION = os.environ.get('DISABLE_TURNSTILE_VERIFICATION', '').strip().lower() in (
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
PUBLIC_VISIT_RATE_LIMIT = int(os.environ.get('PUBLIC_VISIT_RATE_LIMIT', '20'))
PUBLIC_VISIT_RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get('PUBLIC_VISIT_RATE_LIMIT_WINDOW_SECONDS', '300'))
resend.api_key = RESEND_API_KEY

if (TURNSTILE_SITE_KEY and not TURNSTILE_SECRET_KEY) or (TURNSTILE_SECRET_KEY and not TURNSTILE_SITE_KEY):
    logger.warning(
        "Turnstile is partially configured. Set both TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY to enable verification."
    )
elif DISABLE_TURNSTILE_VERIFICATION and (TURNSTILE_SITE_KEY or TURNSTILE_SECRET_KEY):
    logger.warning("Turnstile keys are configured but verification is disabled (DISABLE_TURNSTILE_VERIFICATION).")

whatsapp_env_values = [WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ALERT_TO_NUMBER]
if any(whatsapp_env_values) and not all(whatsapp_env_values):
    logger.warning(
        "WhatsApp click alerts are partially configured. Set WHATSAPP_ACCESS_TOKEN, "
        "WHATSAPP_PHONE_NUMBER_ID, and WHATSAPP_ALERT_TO_NUMBER together."
    )

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")
PUBLIC_RATE_LIMITS: Dict[str, List[float]] = {}
PUBLIC_RATE_LIMIT_LOCK = asyncio.Lock()
BTC_PRICE_CACHE = {
    "btc_to_usd": None,
    "timestamp": None,
    "source": None,
    "is_live": False,
}
BTC_PRICE_CACHE_TTL_SECONDS = 120


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


def payment_method_label(method) -> str:
    labels = {
        PaymentMethodEnum.ZELLE.value: "Zelle",
        PaymentMethodEnum.CASHAPP.value: "Cash App",
        PaymentMethodEnum.APPLEPAY.value: "Apple Pay",
        PaymentMethodEnum.BANK.value: "Bank Transfer",
        PaymentMethodEnum.BTC.value: "Bitcoin (BTC)",
    }
    key = method.value if isinstance(method, PaymentMethodEnum) else str(method or "")
    return labels.get(key, key.replace("_", " ").title() if key else "selected payment method")


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


class PublicVisitCreate(BaseModel):
    path: str
    page_title: Optional[str] = None
    page_url: Optional[str] = None
    referrer: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    fbclid: Optional[str] = None
    gclid: Optional[str] = None


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
    source: Optional[str] = None
    is_live: bool = True


class PublicVisitNotification(BaseModel):
    id: str
    type: str
    path: str
    page_title: Optional[str] = None
    page_url: Optional[str] = None
    referrer: Optional[str] = None
    referrer_domain: Optional[str] = None
    source: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_content: Optional[str] = None
    click_id: Optional[str] = None
    location_city: Optional[str] = None
    location_region: Optional[str] = None
    location_country: Optional[str] = None
    ip_address: Optional[str] = None
    device_type: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime
    read_at: Optional[datetime] = None


class PublicVisitNotificationFeed(BaseModel):
    unread_count: int
    notifications: List[PublicVisitNotification]


class AdminLaunchCleanupSummary(BaseModel):
    deleted_bookings: int
    deleted_subscriptions: int
    deleted_public_visits: int
    reset_ticket_types: int


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


def get_btc_price_snapshot(force_refresh: bool = False) -> dict:
    """Get a live BTC/USD quote with caching and multi-provider fallback."""
    now = datetime.now(timezone.utc)
    cached_timestamp = BTC_PRICE_CACHE.get("timestamp")

    if (
        not force_refresh
        and BTC_PRICE_CACHE.get("btc_to_usd")
        and isinstance(cached_timestamp, datetime)
        and (now - cached_timestamp).total_seconds() < BTC_PRICE_CACHE_TTL_SECONDS
    ):
        return {
            "usd_to_btc": 1 / BTC_PRICE_CACHE["btc_to_usd"],
            "btc_to_usd": BTC_PRICE_CACHE["btc_to_usd"],
            "timestamp": cached_timestamp,
            "source": BTC_PRICE_CACHE.get("source"),
            "is_live": BTC_PRICE_CACHE.get("is_live", False),
        }

    providers = [
        (
            "CoinGecko",
            "https://api.coingecko.com/api/v3/simple/price",
            {"ids": "bitcoin", "vs_currencies": "usd"},
            lambda payload: float(payload["bitcoin"]["usd"]),
        ),
        (
            "Coinbase",
            "https://api.coinbase.com/v2/prices/BTC-USD/spot",
            {},
            lambda payload: float(payload["data"]["amount"]),
        ),
        (
            "Kraken",
            "https://api.kraken.com/0/public/Ticker",
            {"pair": "XBTUSD"},
            lambda payload: float(next(iter(payload["result"].values()))["c"][0]),
        ),
    ]

    for source_name, url, params, extractor in providers:
        try:
            response = requests.get(url, params=params, timeout=5)
            response.raise_for_status()
            btc_to_usd = extractor(response.json())
            BTC_PRICE_CACHE.update({
                "btc_to_usd": btc_to_usd,
                "timestamp": now,
                "source": source_name,
                "is_live": True,
            })
            return {
                "usd_to_btc": 1 / btc_to_usd,
                "btc_to_usd": btc_to_usd,
                "timestamp": now,
                "source": source_name,
                "is_live": True,
            }
        except Exception as exc:
            logger.warning("BTC price lookup failed via %s: %s", source_name, exc)

    if BTC_PRICE_CACHE.get("btc_to_usd"):
        logger.warning("Using cached BTC price because all live providers failed.")
        return {
            "usd_to_btc": 1 / BTC_PRICE_CACHE["btc_to_usd"],
            "btc_to_usd": BTC_PRICE_CACHE["btc_to_usd"],
            "timestamp": BTC_PRICE_CACHE.get("timestamp") or now,
            "source": f'{BTC_PRICE_CACHE.get("source") or "cache"} (cached)',
            "is_live": False,
        }

    fallback_price = 50000.0
    logger.error("BTC live price unavailable. Falling back to static reference price.")
    BTC_PRICE_CACHE.update({
        "btc_to_usd": fallback_price,
        "timestamp": now,
        "source": "Fallback reference",
        "is_live": False,
    })
    return {
        "usd_to_btc": 1 / fallback_price,
        "btc_to_usd": fallback_price,
        "timestamp": now,
        "source": "Fallback reference",
        "is_live": False,
    }


def get_btc_price(force_refresh: bool = False) -> float:
    """Return the BTC/USD reference rate."""
    return get_btc_price_snapshot(force_refresh=force_refresh)["btc_to_usd"]


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


PUBLIC_SOURCE_MAP = {
    'instagram.com': 'Instagram',
    'l.instagram.com': 'Instagram',
    'facebook.com': 'Facebook',
    'm.facebook.com': 'Facebook',
    'lm.facebook.com': 'Facebook',
    'l.facebook.com': 'Facebook',
    'messenger.com': 'Messenger',
    'm.me': 'Messenger',
    'tiktok.com': 'TikTok',
    't.co': 'X',
    'twitter.com': 'X',
    'x.com': 'X',
    'whatsapp.com': 'WhatsApp',
    'wa.me': 'WhatsApp',
    'google.com': 'Google',
    'google.': 'Google',
    'youtube.com': 'YouTube',
}


def parse_referrer_domain(url: Optional[str]) -> Optional[str]:
    cleaned = clean_text(url)
    if not cleaned:
        return None

    parsed = urlparse(cleaned)
    domain = clean_text(parsed.netloc).lower()
    if domain.startswith('www.'):
        domain = domain[4:]
    return domain or None


def infer_public_source(
    referrer: Optional[str],
    utm_source: Optional[str],
    fbclid: Optional[str],
    gclid: Optional[str],
) -> str:
    explicit_source = clean_text(utm_source)
    if explicit_source:
        return explicit_source.replace('-', ' ').replace('_', ' ').title()

    if clean_text(fbclid):
        return 'Facebook / Instagram'

    if clean_text(gclid):
        return 'Google'

    referrer_domain = parse_referrer_domain(referrer)
    if referrer_domain:
        for candidate, label in PUBLIC_SOURCE_MAP.items():
            if candidate in referrer_domain:
                return label

        return referrer_domain

    return 'Direct'


def detect_device_type(user_agent: Optional[str]) -> str:
    normalized = clean_text(user_agent).lower()
    if not normalized:
        return 'Unknown device'

    if 'ipad' in normalized or 'tablet' in normalized:
        return 'Tablet'
    if 'mobile' in normalized or 'iphone' in normalized or 'android' in normalized:
        return 'Mobile'
    return 'Desktop'


def get_geo_details(request: Request) -> dict:
    city = (
        clean_text(request.headers.get('x-vercel-ip-city'))
        or clean_text(request.headers.get('cf-ipcity'))
        or clean_text(request.headers.get('x-city'))
    )
    region = (
        clean_text(request.headers.get('x-vercel-ip-country-region'))
        or clean_text(request.headers.get('cf-region'))
        or clean_text(request.headers.get('x-region'))
    )
    country = (
        clean_text(request.headers.get('x-vercel-ip-country'))
        or clean_text(request.headers.get('cf-ipcountry'))
        or clean_text(request.headers.get('x-country'))
    )
    return {
        'location_city': city or None,
        'location_region': region or None,
        'location_country': country or None,
    }


PUBLIC_VISIT_DATE_FIELDS = ['created_at', 'read_at']


def normalize_public_visit_datetime_fields(notification: Optional[dict]) -> Optional[dict]:
    if not notification:
        return notification

    for field_name in PUBLIC_VISIT_DATE_FIELDS:
        if notification.get(field_name) and isinstance(notification[field_name], str):
            notification[field_name] = datetime.fromisoformat(notification[field_name])

    return notification


def normalize_public_path(path: Optional[str]) -> str:
    cleaned = clean_text(path)
    if not cleaned:
        return '/'
    if not cleaned.startswith('/'):
        return f'/{cleaned}'
    return cleaned


def build_public_visit_document(payload: PublicVisitCreate, request: Request) -> dict:
    path = normalize_public_path(payload.path)
    referrer = clean_text(payload.referrer) or None
    user_agent = clean_text(request.headers.get('user-agent')) or None
    click_id = clean_text(payload.fbclid) or clean_text(payload.gclid) or None
    geo = get_geo_details(request)
    visit = PublicVisitNotification(
        id=str(uuid.uuid4()),
        type='public_link_visit',
        path=path,
        page_title=clean_text(payload.page_title) or None,
        page_url=clean_text(payload.page_url) or f'{FRONTEND_URL}{path}',
        referrer=referrer,
        referrer_domain=parse_referrer_domain(referrer),
        source=infer_public_source(referrer, payload.utm_source, payload.fbclid, payload.gclid),
        timezone=clean_text(payload.timezone) or None,
        language=clean_text(payload.language) or None,
        utm_source=clean_text(payload.utm_source) or None,
        utm_medium=clean_text(payload.utm_medium) or None,
        utm_campaign=clean_text(payload.utm_campaign) or None,
        utm_content=clean_text(payload.utm_content) or None,
        click_id=click_id,
        location_city=geo.get('location_city'),
        location_region=geo.get('location_region'),
        location_country=geo.get('location_country'),
        ip_address=get_client_ip(request),
        device_type=detect_device_type(user_agent),
        user_agent=user_agent,
        created_at=datetime.now(timezone.utc),
        read_at=None,
    )
    document = visit.model_dump()
    document['created_at'] = visit.created_at.isoformat()
    document['read_at'] = None
    return document


def whatsapp_alert_configured() -> bool:
    return bool(WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ALERT_TO_NUMBER)


def normalize_phone_digits(value: Optional[str]) -> str:
    return ''.join(character for character in clean_text(value) if character.isdigit())


def build_visit_location_label(visit: dict) -> str:
    parts = [visit.get('location_city'), visit.get('location_region'), visit.get('location_country')]
    filtered_parts = [clean_text(part) for part in parts if clean_text(part)]
    if filtered_parts:
        return ', '.join(filtered_parts)

    timezone_value = clean_text(visit.get('timezone'))
    if timezone_value:
        return timezone_value

    return 'Location unavailable'


def build_visit_campaign_label(visit: dict) -> str:
    campaign_parts = [
        clean_text(visit.get('utm_source')),
        clean_text(visit.get('utm_medium')),
        clean_text(visit.get('utm_campaign')),
    ]
    filtered_parts = [value for value in campaign_parts if value]
    if filtered_parts:
        return ' / '.join(filtered_parts)

    referrer_domain = clean_text(visit.get('referrer_domain'))
    if referrer_domain:
        return referrer_domain

    return 'Direct'


def build_visit_ip_label(visit: dict) -> str:
    ip_value = clean_text(visit.get('ip_address'))
    return ip_value or 'Unknown IP'


def build_visit_device_label(visit: dict) -> str:
    device_label = clean_text(visit.get('device_type')) or 'Unknown device'
    language_label = clean_text(visit.get('language')) or 'Unknown language'
    return f"{device_label} | {language_label}"


def build_visit_referrer_label(visit: dict) -> str:
    return clean_text(visit.get('referrer_domain')) or clean_text(visit.get('referrer')) or 'Direct'


def build_whatsapp_click_alert_text(visit: dict) -> str:
    created_at = format_datetime_label(visit.get('created_at'))
    source = clean_text(visit.get('source')) or 'Direct'
    path = normalize_public_path(visit.get('path'))
    location_label = build_visit_location_label(visit)
    ip_label = build_visit_ip_label(visit)
    device_label = build_visit_device_label(visit)
    campaign_label = build_visit_campaign_label(visit)
    referrer_label = build_visit_referrer_label(visit)

    return (
        "New Bruno Mars Tour site visit alert\n"
        f"Source | Page: {source} | {path}\n"
        f"Location | IP: {location_label} | {ip_label}\n"
        f"Device | Time: {device_label} | {created_at}\n"
        f"Campaign | Referrer: {campaign_label} | {referrer_label}"
    )


def build_whatsapp_click_alert_template_payload(visit: dict) -> dict:
    parameters = [
        f"{clean_text(visit.get('source')) or 'Direct'} | {normalize_public_path(visit.get('path'))}",
        f"{build_visit_location_label(visit)} | {build_visit_ip_label(visit)}",
        f"{build_visit_device_label(visit)} | {format_datetime_label(visit.get('created_at'))}",
        f"{build_visit_campaign_label(visit)} | {build_visit_referrer_label(visit)}",
    ]
    return {
        "messaging_product": "whatsapp",
        "to": normalize_phone_digits(WHATSAPP_ALERT_TO_NUMBER),
        "type": "template",
        "template": {
            "name": WHATSAPP_ALERT_TEMPLATE_NAME,
            "language": {"code": WHATSAPP_ALERT_TEMPLATE_LANGUAGE},
            "components": [
                {
                    "type": "body",
                    "parameters": [{"type": "text", "text": parameter[:1024] or "-"} for parameter in parameters],
                }
            ],
        },
    }


def build_whatsapp_click_alert_text_payload(visit: dict) -> dict:
    return {
        "messaging_product": "whatsapp",
        "to": normalize_phone_digits(WHATSAPP_ALERT_TO_NUMBER),
        "type": "text",
        "text": {
            "preview_url": False,
            "body": build_whatsapp_click_alert_text(visit)[:4096],
        },
    }


async def send_whatsapp_click_alert(visit: dict) -> None:
    if not whatsapp_alert_configured():
        return

    destination_number = normalize_phone_digits(WHATSAPP_ALERT_TO_NUMBER)
    if not destination_number:
        logger.warning("WhatsApp click alerts are configured with an invalid destination number.")
        return

    if WHATSAPP_ALERT_TEMPLATE_NAME:
        payload = build_whatsapp_click_alert_template_payload(visit)
    elif WHATSAPP_ALERT_TEXT_FALLBACK:
        payload = build_whatsapp_click_alert_text_payload(visit)
    else:
        logger.info(
            "Skipping WhatsApp click alert because no template is configured. "
            "Set WHATSAPP_ALERT_TEMPLATE_NAME or enable WHATSAPP_ALERT_TEXT_FALLBACK for session-based testing."
        )
        return

    url = (
        f"https://graph.facebook.com/{os.environ.get('META_GRAPH_VERSION', 'v23.0').strip() or 'v23.0'}"
        f"/{WHATSAPP_PHONE_NUMBER_ID}/messages"
    )
    headers = {
        "Authorization": f"Bearer {WHATSAPP_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }

    try:
        response = await asyncio.to_thread(requests.post, url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
    except Exception as exc:
        logger.warning("WhatsApp click alert failed: %s", exc)


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


def turnstile_enabled() -> bool:
    return bool(TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY and not DISABLE_TURNSTILE_VERIFICATION)


def get_public_config() -> dict:
    enabled = turnstile_enabled()
    return {
        "captcha_provider": "turnstile",
        "captcha_enabled": enabled,
        "turnstile_site_key": TURNSTILE_SITE_KEY if enabled else "",
    }


async def verify_turnstile_token(token: Optional[str], request: Request) -> None:
    """Validate Turnstile when the public and secret keys are both configured."""
    if DISABLE_TURNSTILE_VERIFICATION:
        logger.warning("Turnstile checks are disabled (DISABLE_TURNSTILE_VERIFICATION). Remove in production.")
        return

    if not turnstile_enabled():
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


async def reset_launch_data() -> AdminLaunchCleanupSummary:
    """Clear test-facing activity while preserving admin/config records."""
    deleted_bookings = await db.booking_requests.count_documents({})
    deleted_subscriptions = await db.subscriptions.count_documents({})
    deleted_public_visits = await db.public_visit_notifications.count_documents({})

    ticket_types = await db.ticket_types.find({}, {"_id": 0, "id": 1, "total_quantity": 1}).to_list(500)
    reset_ticket_types = 0
    for ticket in ticket_types:
        total_quantity = ticket.get("total_quantity")
        if total_quantity is None:
            continue

        await db.ticket_types.update_one(
            {"id": ticket["id"]},
            {"$set": {"available_quantity": total_quantity}},
        )
        reset_ticket_types += 1

    await db.booking_requests.delete_many({})
    await db.subscriptions.delete_many({})
    await db.public_visit_notifications.delete_many({})

    async with PUBLIC_RATE_LIMIT_LOCK:
        PUBLIC_RATE_LIMITS.clear()

    return AdminLaunchCleanupSummary(
        deleted_bookings=deleted_bookings,
        deleted_subscriptions=deleted_subscriptions,
        deleted_public_visits=deleted_public_visits,
        reset_ticket_types=reset_ticket_types,
    )


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


HIGH_PAYMENT_TRAFFIC_NOTICE = (
    "High payment traffic notice: Bank transfer and Bitcoin are currently the fastest payment routes for approved "
    "tour requests. Complete the approved payment exactly as shown below, then submit your payment reference so guest "
    "services can finish verification."
)
LEGACY_HIGH_PAYMENT_TRAFFIC_NOTICE = (
    "High payment traffic notice: Bank transfer and Bitcoin are currently the fastest verified settlement rails for "
    "approved tour requests. Complete the approved payment exactly as shown below, then submit your payment reference "
    "so guest services can finalize your file."
)
PAYMENT_NOTICE_VARIANTS = [
    HIGH_PAYMENT_TRAFFIC_NOTICE,
    LEGACY_HIGH_PAYMENT_TRAFFIC_NOTICE,
]


def format_event_datetime_label(event: dict) -> str:
    date_value = clean_text(event.get('date'))
    time_value = clean_text(event.get('time'))

    if not date_value and not time_value:
        return "Date and time to be confirmed"

    if date_value and time_value:
        try:
            event_dt = datetime.strptime(f"{date_value} {time_value}", "%Y-%m-%d %H:%M")
            return f"{event_dt.strftime('%B %d, %Y at %I:%M %p')} local venue time"
        except ValueError:
            return f"{date_value} | {time_value}"

    return date_value or time_value


def format_datetime_label(value) -> str:
    if isinstance(value, datetime):
        return value.strftime('%B %d, %Y at %I:%M %p UTC')

    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value).strftime('%B %d, %Y at %I:%M %p UTC')
        except ValueError:
            return value

    return "TBA"


def format_currency(value: Optional[float]) -> Optional[str]:
    if value is None:
        return None

    try:
        return f"${float(value):,.2f}"
    except (TypeError, ValueError):
        return str(value)


def format_payment_amount(value: Optional[float], method: Optional[str]) -> Optional[str]:
    if value is None:
        return None

    method_key = method.value if isinstance(method, PaymentMethodEnum) else str(method or "")

    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        return str(value)

    if method_key == PaymentMethodEnum.BTC.value:
        return f"{numeric_value:.8f}".rstrip('0').rstrip('.') + " BTC"

    return format_currency(numeric_value)


def get_guest_count_label(quantity: int) -> str:
    return f"{quantity} guest" if quantity == 1 else f"{quantity} guests"


def build_detail_rows(rows) -> str:
    filtered_rows = [(label, value) for label, value in rows if value not in (None, "")]
    if not filtered_rows:
        return ""

    html_rows = []
    last_index = len(filtered_rows) - 1
    for index, (label, value) in enumerate(filtered_rows):
        border_style = ' style="border-bottom: none;"' if index == last_index else ""
        html_rows.append(
            f'<div class="detail-row"{border_style}><span class="label">{label}:</span> {value}</div>'
        )

    return "".join(html_rows)


def normalize_payment_instruction_text(instructions: Optional[str]) -> str:
    cleaned = clean_text(instructions)
    if not cleaned:
        return ""

    for notice in PAYMENT_NOTICE_VARIANTS:
        cleaned = cleaned.replace(notice, "").strip()

    while "\n\n\n" in cleaned:
        cleaned = cleaned.replace("\n\n\n", "\n\n")

    return cleaned.strip()


def payment_instructions_have_placeholders(method: Optional[str], instructions: Optional[str]) -> bool:
    method_key = method.value if isinstance(method, PaymentMethodEnum) else str(method or "")
    if method_key not in {PaymentMethodEnum.BANK.value, PaymentMethodEnum.BTC.value}:
        return False

    cleaned = clean_text(instructions).lower()
    placeholder_markers = [
        "[add ",
        "add account name here",
        "add bank name here",
        "add account number here",
        "add bank routing detail here",
        "add wallet",
        "bc1q...",
    ]
    return any(marker in cleaned for marker in placeholder_markers)


def payment_wallet_has_placeholder(wallet_address: Optional[str]) -> bool:
    cleaned = clean_text(wallet_address).lower()
    if not cleaned:
        return False
    return cleaned.endswith("...") or "[add " in cleaned


def decorate_payment_instructions_text(method: Optional[str], instructions: Optional[str]) -> str:
    base_instructions = normalize_payment_instruction_text(instructions)
    if not base_instructions:
        return ""

    method_key = method.value if isinstance(method, PaymentMethodEnum) else str(method or "")
    if method_key not in {PaymentMethodEnum.BANK.value, PaymentMethodEnum.BTC.value}:
        return base_instructions

    if base_instructions.startswith(HIGH_PAYMENT_TRAFFIC_NOTICE):
        return base_instructions

    return f"{HIGH_PAYMENT_TRAFFIC_NOTICE}\n\n{base_instructions}"


def get_ticket_access_profile(ticket_type: str) -> dict:
    if ticket_type in {"hospitality", "birthday", "corporate", "privatemeetup"}:
        return {
            "arrival_minutes": 120,
            "checkin_note": "private guest services coordination",
            "package_note": (
                "Your package may include a personalized host handoff or venue coordination window, so keep your phone "
                "reachable on show day for any final timing note."
            ),
        }

    if ticket_type in {"meetgreet", "backstage", "soundcheck", "photoop", "aftershow"}:
        return {
            "arrival_minutes": 90,
            "checkin_note": "premium experience check-in",
            "package_note": (
                "Premium experience timing can move slightly with production and security flow. Follow the most recent "
                "guest-services direction if an updated meeting point is sent."
            ),
        }

    if ticket_type == "vip":
        return {
            "arrival_minutes": 60,
            "checkin_note": "VIP guest services check-in",
            "package_note": (
                "VIP access is handled through priority guest services. Keep this email open on your phone so the team "
                "can match your confirmation quickly at arrival."
            ),
        }

    return {
        "arrival_minutes": 45,
        "checkin_note": "standard guest entry",
        "package_note": (
            "Venue entry and security processing are managed by the host venue. Please allow extra time for traffic, "
            "screening, and directional queues on arrival."
        ),
    }


def get_arrival_target_label(event: dict, lead_minutes: int) -> str:
    date_value = clean_text(event.get('date'))
    time_value = clean_text(event.get('time'))

    if date_value and time_value:
        try:
            event_dt = datetime.strptime(f"{date_value} {time_value}", "%Y-%m-%d %H:%M")
            arrival_dt = event_dt - timedelta(minutes=lead_minutes)
            return f"{arrival_dt.strftime('%B %d, %Y at %I:%M %p')} local venue time"
        except ValueError:
            pass

    return f"approximately {lead_minutes} minutes before show time"


def build_purchase_overview_html(
    booking: dict,
    event: dict,
    ticket_label: str,
    status_label: str,
    price_per_ticket: Optional[float] = None,
    total_amount: Optional[float] = None,
) -> str:
    event_rows = [
        ("Event", event.get('title') or "Selected Event"),
        ("Venue", event.get('venue') or "Venue TBA"),
        ("Location", event.get('city') or "Location TBA"),
        ("Date & Time", format_event_datetime_label(event)),
    ]

    purchase_rows = [
        ("Confirmation", booking.get('confirmation_number')),
        ("Status", status_label),
        ("Package", ticket_label),
        ("Guests", get_guest_count_label(int(booking.get('quantity') or 1))),
        ("Approved Method", payment_method_label(booking.get('payment_method'))) if booking.get('payment_method') else (None, None),
        ("Price Per Guest", format_currency(price_per_ticket)) if price_per_ticket is not None else (None, None),
        ("Purchase Total", format_currency(total_amount)) if total_amount is not None else (None, None),
    ]

    return f"""
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 18px 0;">
        <tr>
            <td class="stack-column" width="50%" style="padding: 0 8px 12px 0; vertical-align: top;">
                <div class="mini-card">
                    <h3>Event Details</h3>
                    {build_detail_rows(event_rows)}
                </div>
            </td>
            <td class="stack-column" width="50%" style="padding: 0 0 12px 8px; vertical-align: top;">
                <div class="mini-card">
                    <h3>Purchase Details</h3>
                    {build_detail_rows(purchase_rows)}
                </div>
            </td>
        </tr>
    </table>
    """


def build_step_list_html(title: str, intro: str, items: List[str]) -> str:
    clean_items = [item for item in items if item]
    if not clean_items:
        return ""

    list_html = "".join(f"<li>{item}</li>" for item in clean_items)
    intro_html = f"<p class=\"note\">{intro}</p>" if intro else ""

    return f"""
    <div class="booking-details">
        <h3>{title}</h3>
        {intro_html}
        <ol class="step-list">
            {list_html}
        </ol>
    </div>
    """


def build_status_guidance_html(booking: dict, event: dict, ticket_label: str) -> str:
    status = booking.get('status')
    guest_count = get_guest_count_label(int(booking.get('quantity') or 1))

    if status == 'approved':
        method_label = payment_method_label(booking.get('payment_method'))
        method_key = booking.get('payment_method')
        method_key = method_key.value if isinstance(method_key, PaymentMethodEnum) else str(method_key or "")
        payment_reference_label = (
            "Send only the exact BTC amount shown in this approval and use the Bitcoin network only."
            if method_key == PaymentMethodEnum.BTC.value
            else "Use your confirmation number as the transfer reference wherever your bank allows it."
        )

        return build_step_list_html(
            "Next Steps",
            f"Your {ticket_label} reservation for {guest_count} is approved and waiting for verified payment.",
            [
                f"Complete payment using the approved method: {method_label}.",
                payment_reference_label,
                "Return to your booking page right after payment and submit the exact transfer reference or transaction hash.",
            ],
        )

    if status == 'paid':
        return build_step_list_html(
            "What Happens Next",
            "Your payment has been logged and guest services is now completing final verification.",
            [
                "Keep your transfer reference available until the confirmed email is delivered.",
                "Do not send another payment unless guest services contacts you directly.",
                "Your next email will include your final arrival guidance.",
            ],
        )

    if status == 'confirmed':
        profile = get_ticket_access_profile(booking.get('ticket_type', ''))
        arrival_label = get_arrival_target_label(event, profile['arrival_minutes'])
        steps = [
            f"Plan to arrive by {arrival_label} for {profile['checkin_note']}.",
            f"Bring a valid government-issued photo ID matching the primary booking name on file: {booking.get('customer_name', 'Primary guest')}.",
            f"Keep this email and confirmation number {booking.get('confirmation_number')} accessible on your phone at arrival.",
            profile['package_note'],
        ]

        if int(booking.get('quantity') or 1) > 1:
            steps.insert(
                3,
                f"If you purchased access for {guest_count}, arrive together and have each guest name ready for check-in.",
            )

        return build_step_list_html(
            "Event-Day Checklist",
            f"Your {ticket_label} purchase is confirmed. Review the guide below for a smooth arrival on {format_event_datetime_label(event)}.",
            steps,
        )

    if status == 'rejected':
        return build_step_list_html(
            "Need Another Option?",
            "This request could not be finalized as submitted, but guest services can still help if you would like to review another available package.",
            [
                "Review any note included in this email for the reason your original request could not be completed.",
                "Contact guest services with your confirmation number if you want help with another package or date.",
            ],
        )

    return build_step_list_html(
        "While You Wait",
        "Your request has entered the review queue.",
        [
            "Keep your confirmation number handy for support or tracking.",
            "Use the tracking link below any time to review the latest status.",
        ],
    )


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
        <h3>Guest Services</h3>
        <p class="note">For payment, arrival, or schedule questions, contact the team below and include your confirmation number for faster service.</p>
        {''.join(support_items)}
    </div>
    """


def build_payment_html(booking: dict, total_amount: Optional[float] = None) -> str:
    if booking.get('status') != 'approved' or not booking.get('payment_instructions'):
        return ""

    payment_method = booking.get('payment_method')
    payment_rows = [
        ("Approved Method", payment_method_label(payment_method)) if payment_method else (None, None),
        ("Confirmation Reference", booking.get('confirmation_number')),
    ]

    if payment_method == PaymentMethodEnum.BTC.value or (
        isinstance(payment_method, PaymentMethodEnum) and payment_method == PaymentMethodEnum.BTC
    ):
        payment_rows.append(("Exact BTC Amount", format_payment_amount(booking.get('btc_amount'), payment_method)))
        if total_amount is not None:
            payment_rows.append(("Reference Value", format_currency(total_amount)))
        if total_amount is not None and booking.get('btc_amount'):
            try:
                locked_rate = float(total_amount) / float(booking.get('btc_amount'))
                payment_rows.append(("Locked Rate At Approval", f"{format_currency(locked_rate)} / BTC"))
            except (TypeError, ValueError, ZeroDivisionError):
                pass
    elif total_amount is not None:
        payment_rows.append(("Approved Balance", format_currency(total_amount)))

    if booking.get('btc_wallet_address'):
        payment_rows.append(("BTC Wallet Address", booking.get('btc_wallet_address')))

    payment_instruction_text = decorate_payment_instructions_text(payment_method, booking.get('payment_instructions'))

    return f"""
    <div class="booking-details">
        <h3>Payment Instructions</h3>
        <p class="note">Use the approved method below. After payment is sent, submit your reference from the booking page.</p>
        {build_detail_rows(payment_rows)}
        <div class="instruction-box">{payment_instruction_text}</div>
    </div>
    """


def build_admin_notes_html(booking: dict) -> str:
    if not booking.get('admin_notes'):
        return ""

    return f"""
    <div class="booking-details">
        <h3>Guest Services Note</h3>
        <div class="instruction-box">{booking['admin_notes']}</div>
    </div>
    """


def build_customer_payment_update_html(booking: dict) -> str:
    if not booking.get('customer_payment_submitted_at'):
        return ""

    submitted_at = booking['customer_payment_submitted_at']
    submitted_label = format_datetime_label(submitted_at)

    method_label = payment_method_label(booking.get('customer_payment_method')) if booking.get('customer_payment_method') else None
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
            f'<div class="detail-row"><span class="label">Amount:</span> '
            f'{format_payment_amount(booking["customer_payment_amount"], booking.get("customer_payment_method"))}</div>'
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
        <h3>Submitted Payment Details</h3>
        <p class="note">The latest payment information on file for this reservation is shown below.</p>
        {''.join(details)}
    </div>
    """


def get_customer_email_styles(theme: dict) -> str:
    return f"""
        body {{ margin: 0; background: #f4efe9; font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; }}
        .container {{ max-width: 680px; margin: 0 auto; padding: 24px 16px; }}
        .header {{ background: {theme['header_background']}; color: white; padding: 28px 24px; border-radius: 24px 24px 0 0; text-align: left; }}
        .eyebrow {{ margin: 0 0 8px; color: {theme['eyebrow_color']}; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; }}
        .header h1 {{ margin: 0; font-size: 30px; line-height: 1.15; }}
        .subtitle {{ margin: 10px 0 0; color: {theme['subtitle_color']}; font-size: 14px; }}
        .content {{ background: #fffaf5; padding: 24px; border: 1px solid #eadfd3; border-top: none; border-radius: 0 0 24px 24px; }}
        .booking-details {{ background: white; padding: 18px; margin: 18px 0; border: 1px solid #eadfd3; border-radius: 18px; }}
        .booking-details h3, .mini-card h3 {{ margin: 0 0 12px; font-size: 18px; color: #111827; }}
        .mini-card {{ background: white; padding: 18px; border: 1px solid #eadfd3; border-radius: 18px; }}
        .detail-row {{ padding: 8px 0; border-bottom: 1px solid #f0e7dc; }}
        .label {{ font-weight: bold; color: {theme['label_color']}; display: inline-block; min-width: 136px; }}
        .note {{ margin: 0 0 14px; color: #5b5147; }}
        .instruction-box {{ background: #fff8ec; border: 1px solid #f2dcc4; border-radius: 14px; padding: 14px; white-space: pre-wrap; color: #3f3a36; }}
        .step-list {{ margin: 0; padding-left: 20px; color: #3f3a36; }}
        .step-list li {{ margin-bottom: 10px; }}
        .button {{ background: {theme['button_background']}; color: white !important; padding: 14px 24px; text-decoration: none; display: inline-block; margin: 12px 6px 0; border-radius: 999px; font-weight: bold; }}
        .button.secondary {{ background: {theme['button_secondary']}; }}
        .footer {{ text-align: center; padding: 18px; color: #6b7280; font-size: 12px; }}
        @media only screen and (max-width: 640px) {{
            .stack-column {{ display: block !important; width: 100% !important; padding: 0 0 12px 0 !important; }}
            .header h1 {{ font-size: 26px !important; }}
            .content {{ padding: 20px !important; }}
            .label {{ min-width: 0 !important; display: block !important; margin-bottom: 2px; }}
        }}
    """


def get_customer_email_theme(status: str) -> dict:
    themes = {
        "pending": {
            "eyebrow": "Request Received",
            "header_background": "#1f2937",
            "eyebrow_color": "#cbd5e1",
            "subtitle_color": "#e5e7eb",
            "label_color": "#334155",
            "button_background": "#1f2937",
            "button_secondary": "#7f1d1d",
        },
        "approved": {
            "eyebrow": "Approved | Payment Required",
            "header_background": "#7f1d1d",
            "eyebrow_color": "#fecaca",
            "subtitle_color": "#fee2e2",
            "label_color": "#991b1b",
            "button_background": "#991b1b",
            "button_secondary": "#111827",
        },
        "paid": {
            "eyebrow": "Payment Review",
            "header_background": "#92400e",
            "eyebrow_color": "#fde68a",
            "subtitle_color": "#fef3c7",
            "label_color": "#92400e",
            "button_background": "#92400e",
            "button_secondary": "#111827",
        },
        "confirmed": {
            "eyebrow": "Confirmed | Event Day Guide",
            "header_background": "#166534",
            "eyebrow_color": "#bbf7d0",
            "subtitle_color": "#dcfce7",
            "label_color": "#166534",
            "button_background": "#166534",
            "button_secondary": "#111827",
        },
        "rejected": {
            "eyebrow": "Booking Update",
            "header_background": "#4b5563",
            "eyebrow_color": "#e5e7eb",
            "subtitle_color": "#f3f4f6",
            "label_color": "#4b5563",
            "button_background": "#4b5563",
            "button_secondary": "#111827",
        },
        "payment-update": {
            "eyebrow": "Payment Submission Received",
            "header_background": "#1d4ed8",
            "eyebrow_color": "#bfdbfe",
            "subtitle_color": "#dbeafe",
            "label_color": "#1d4ed8",
            "button_background": "#1d4ed8",
            "button_secondary": "#111827",
        },
    }
    return themes.get(status, themes["approved"])


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
        theme = get_customer_email_theme(booking['status'])
        guest_count = get_guest_count_label(int(booking.get('quantity') or 1))
        event_datetime_label = format_event_datetime_label(event)
        ticket = await db.ticket_types.find_one(
            {"event_id": booking.get('event_id'), "type": booking.get('ticket_type')},
            {"_id": 0},
        ) or {}
        price_per_ticket = ticket.get('price_usd')
        total_amount = (price_per_ticket * booking['quantity']) if price_per_ticket is not None else None

        status_content = {
            "pending": {
                "subject": f"We received your request | The Romantic Tour | {booking['confirmation_number']}",
                "headline": "Your request is in review",
                "message": (
                    f"Thanks for choosing The Romantic Tour. We received your {ticket_label} request for {guest_count} "
                    f"and guest services is now reviewing availability for {event_datetime_label}."
                ),
                "subcopy": "Use the tracking link below any time to review the latest booking status."
            },
            "approved": {
                "subject": f"Approved | Payment steps inside | The Romantic Tour | {booking['confirmation_number']}",
                "headline": "Your reservation is approved",
                "message": (
                    f"Your {ticket_label} reservation for {guest_count} has been approved. Review the payment details "
                    "below and complete the transfer when ready."
                ),
                "subcopy": "After payment is sent, submit your transfer reference from the booking page so verification can begin."
            },
            "paid": {
                "subject": f"Payment under review | The Romantic Tour | {booking['confirmation_number']}",
                "headline": "Your payment is now in final review",
                "message": (
                    f"We have logged the payment details for your {ticket_label} reservation. Guest services is now "
                    "completing final verification before confirmation is released."
                ),
                "subcopy": "No additional payment is needed while verification is in progress."
            },
            "confirmed": {
                "subject": f"Confirmed | Arrival guide inside | The Romantic Tour | {booking['confirmation_number']}",
                "headline": "Your booking is confirmed",
                "message": (
                    f"Your {ticket_label} booking for {guest_count} is fully confirmed for {event_datetime_label}. "
                    "Please review the event-day checklist below so arrival is smooth."
                ),
                "subcopy": "Keep this email accessible on your phone on show day for quick check-in."
            },
            "rejected": {
                "subject": f"Booking update | The Romantic Tour | {booking['confirmation_number']}",
                "headline": "This request could not be completed",
                "message": (
                    "We were unable to finalize this request as submitted. Please review any note below and contact "
                    "guest services if you would like help with another package or date."
                ),
                "subcopy": "Your confirmation number remains the fastest way for our team to find your request."
            }
        }.get(booking['status'], {
            "subject": f"Booking update | The Romantic Tour | {booking['confirmation_number']}",
            "headline": "Your booking status was updated",
            "message": "Use the tracking link below to review the latest status for your request.",
            "subcopy": ""
        })

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                {get_customer_email_styles(theme)}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <p class="eyebrow">{theme['eyebrow']}</p>
                    <h1>{status_content['headline']}</h1>
                    <p class="subtitle">Confirmation {booking['confirmation_number']} | {status_label}</p>
                </div>
                <div class="content">
                    <p>Hello {booking['customer_name']},</p>
                    <p>{status_content['message']}</p>
                    {f'<p class="note">{status_content["subcopy"]}</p>' if status_content.get('subcopy') else ''}

                    {build_purchase_overview_html(booking, event, ticket_label, status_label, price_per_ticket, total_amount)}

                    {'' if booking['status'] == 'approved' else build_status_guidance_html(booking, event, ticket_label)}
                    {build_payment_html(booking, total_amount)}
                    {build_customer_payment_update_html(booking)}
                    {build_admin_notes_html(booking)}
                    {build_support_contact_html(site_settings)}

                    <div class="action-row">
                        <a href="{track_url}" class="button">Track Booking</a>
                        {f'<a href="{payment_update_url}" class="button secondary">Submit Payment Update</a>' if booking['status'] == 'approved' else ''}
                    </div>
                </div>
                <div class="footer">
                    <p>This is an automated guest-services update for The Romantic Tour.</p>
                    <p>Keep your confirmation number handy for faster support and show-day check-in.</p>
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
        theme = get_customer_email_theme("payment-update")
        ticket_label = get_ticket_type_label(booking['ticket_type'])
        status_label = "Awaiting Payment Verification"
        ticket = await db.ticket_types.find_one(
            {"event_id": booking.get('event_id'), "type": booking.get('ticket_type')},
            {"_id": 0},
        ) or {}
        price_per_ticket = ticket.get('price_usd')
        total_amount = (price_per_ticket * booking['quantity']) if price_per_ticket is not None else None
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                {get_customer_email_styles(theme)}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <p class="eyebrow">{theme['eyebrow']}</p>
                    <h1>We received your payment submission</h1>
                    <p class="subtitle">Confirmation {booking['confirmation_number']} | Awaiting Verification</p>
                </div>
                <div class="content">
                    <p>Hello {booking['customer_name']},</p>
                    <p>Thanks for sending your payment details. Your transfer is now in the verification queue for your {ticket_label} reservation.</p>
                    <p class="note">Guest services will review the submitted reference and contact you again as soon as your booking moves to the next stage.</p>
                    {build_purchase_overview_html(booking, event, ticket_label, status_label, price_per_ticket, total_amount)}
                    {build_customer_payment_update_html(booking)}
                    {build_step_list_html(
                        "While We Verify",
                        "A few quick reminders while your payment is under review:",
                        [
                            "Keep your transfer reference or blockchain transaction hash available until final confirmation is issued.",
                            "Do not send another payment unless guest services contacts you directly.",
                            "Your confirmed email will include package-specific arrival guidance for the event date.",
                        ],
                    )}
                    {build_support_contact_html(site_settings)}
                    <div class="action-row">
                        <a href="{track_url}" class="button">Track Booking</a>
                    </div>
                </div>
                <div class="footer">
                    <p>This is an automated guest-services update for The Romantic Tour.</p>
                </div>
            </div>
        </body>
        </html>
        """

        await asyncio.to_thread(resend.Emails.send, {
            "from": SENDER_EMAIL,
            "to": [booking['email']],
            "subject": f"Payment submitted | Review in progress | The Romantic Tour | {booking['confirmation_number']}",
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
    snapshot = get_btc_price_snapshot()
    return BTCPrice(**snapshot)


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


@api_router.get("/public-config", response_model=dict)
async def get_public_runtime_config():
    """Get public runtime configuration for browser-only integrations."""
    return get_public_config()


@api_router.post("/public-visits", response_model=dict)
async def record_public_visit(payload: PublicVisitCreate, request: Request):
    """Record a public landing click so admins can see live traffic."""
    await enforce_public_rate_limit(
        request,
        "public-visits",
        PUBLIC_VISIT_RATE_LIMIT,
        PUBLIC_VISIT_RATE_LIMIT_WINDOW_SECONDS,
    )

    normalized_path = normalize_public_path(payload.path)
    if normalized_path.startswith('/admin-secret'):
        return {"status": "ignored"}

    document = build_public_visit_document(payload, request)
    await db.public_visit_notifications.insert_one(document)
    asyncio.create_task(send_whatsapp_click_alert(document))
    return {"status": "recorded", "id": document["id"]}


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
        "captcha_ready": turnstile_enabled(),
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

    submitted_payment_method = payment_update.payment_method.value
    approved_method = booking.get("payment_method")
    if approved_method:
        approved_method_value = (
            approved_method.value if isinstance(approved_method, PaymentMethodEnum) else str(approved_method)
        )
        if submitted_payment_method != approved_method_value:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Please submit your update using the approved payment method: "
                    f"{payment_method_label(approved_method_value)}."
                )
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


@api_router.get("/admin/public-visits", response_model=PublicVisitNotificationFeed)
async def get_admin_public_visit_notifications(
    limit: int = 20,
    admin: dict = Depends(get_current_admin),
):
    """Return recent public visit notifications for the admin app."""
    capped_limit = max(1, min(limit, 50))
    raw_notifications = await db.public_visit_notifications.find({}, {"_id": 0}).sort("created_at", -1).to_list(capped_limit)
    unread_count = await db.public_visit_notifications.count_documents({"read_at": None})

    notifications = []
    for notification in raw_notifications:
        normalize_public_visit_datetime_fields(notification)
        notifications.append(PublicVisitNotification(**notification))

    return PublicVisitNotificationFeed(
        unread_count=unread_count,
        notifications=notifications,
    )


@api_router.post("/admin/public-visits/read", response_model=dict)
async def mark_admin_public_visit_notifications_read(admin: dict = Depends(get_current_admin)):
    """Mark the current public visit notifications as seen."""
    read_at = datetime.now(timezone.utc).isoformat()
    await db.public_visit_notifications.update_many(
        {"read_at": None},
        {"$set": {"read_at": read_at}},
    )
    return {"status": "ok", "read_at": read_at}


@api_router.post("/admin/cleanup-launch-data", response_model=AdminLaunchCleanupSummary)
async def cleanup_launch_data(admin: dict = Depends(get_current_admin)):
    """Clear test activity before launch while preserving core setup."""
    return await reset_launch_data()


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


@api_router.delete("/admin/bookings/{booking_id}", response_model=dict)
async def delete_booking(
    booking_id: str,
    admin: dict = Depends(get_current_admin)
):
    """Delete a booking and release reserved inventory when needed."""
    booking = await db.booking_requests.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.get('inventory_reserved'):
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

    result = await db.booking_requests.delete_one({"id": booking_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")

    return {
        "status": "deleted",
        "id": booking_id,
        "confirmation_number": booking.get("confirmation_number")
    }


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
    if payment_instructions_have_placeholders(approval_data.payment_method, payment_instructions):
        raise HTTPException(
            status_code=400,
            detail="Payment instructions still contain placeholders. Update them with real payment details before approving this booking."
        )

    btc_wallet_address = clean_text(approval_data.btc_wallet_address) or clean_text(
        saved_settings.get('btc_wallet_address') if saved_settings else None
    )
    btc_amount = approval_data.btc_amount if approval_data.btc_amount and approval_data.btc_amount > 0 else None

    if approval_data.payment_method == PaymentMethodEnum.BTC:
        if not btc_wallet_address:
            raise HTTPException(status_code=400, detail="BTC wallet address is required for Bitcoin approvals")
        if payment_wallet_has_placeholder(btc_wallet_address):
            raise HTTPException(
                status_code=400,
                detail="BTC wallet address still looks like a placeholder. Add the real wallet address before approving this booking."
            )
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
    try:
        await db.public_visit_notifications.create_index("created_at")
        await db.public_visit_notifications.create_index("read_at")
    except Exception as exc:
        logger.warning("Unable to create public visit notification indexes: %s", exc)

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
