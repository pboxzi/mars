from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import resend
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
import requests
from enum import Enum


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Email Configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
resend.api_key = RESEND_API_KEY

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ==================== ENUMS ====================
class TicketTypeEnum(str, Enum):
    GENERAL = "general"
    VIP = "vip"
    MEETGREET = "meetgreet"
    BACKSTAGE = "backstage"


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
    payment_method: Optional[PaymentMethodEnum] = None
    payment_instructions: Optional[str] = None
    btc_wallet_address: Optional[str] = None
    btc_amount: Optional[float] = None
    transaction_id: Optional[str] = None
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


class BookingApproval(BaseModel):
    payment_method: PaymentMethodEnum
    payment_instructions: str
    btc_wallet_address: Optional[str] = None
    btc_amount: Optional[float] = None
    admin_notes: Optional[str] = None


class BookingMarkPaid(BaseModel):
    transaction_id: Optional[str] = None
    admin_notes: Optional[str] = None


class BookingConfirm(BaseModel):
    admin_notes: Optional[str] = None


class BookingReject(BaseModel):
    admin_notes: str


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


# ==================== EMAIL NOTIFICATIONS ====================
async def send_booking_notification(booking: dict, event: dict, ticket: dict):
    """Send email notification to admin when new booking is submitted"""
    try:
        ticket_type_labels = {
            "general": "General Admission",
            "vip": "VIP Access",
            "meetgreet": "Meet & Greet",
            "backstage": "Backstage Pass"
        }
        
        ticket_label = ticket_type_labels.get(booking['ticket_type'], booking['ticket_type'])
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
                        <a href="{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/admin-secret/bookings" class="button">
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
    events = await db.events.find({"status": "active"}, {"_id": 0}).to_list(100)
    for event in events:
        if isinstance(event.get('created_at'), str):
            event['created_at'] = datetime.fromisoformat(event['created_at'])
    return events


# Get event details with tickets (public)
@api_router.get("/events/{event_id}", response_model=dict)
async def get_event_details(event_id: str):
    """Get event details with available ticket types"""
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


# Submit booking request (public)
@api_router.post("/bookings", response_model=BookingRequest)
async def create_booking_request(booking: BookingRequestCreate):
    """Submit a booking request"""
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
    booking_obj = BookingRequest(**booking.model_dump())
    doc = booking_obj.model_dump()
    doc['request_date'] = doc['request_date'].isoformat()
    
    await db.booking_requests.insert_one(doc)
    
    # Send email notification to admin (non-blocking)
    asyncio.create_task(send_booking_notification(doc, event, ticket))
    
    return booking_obj


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
    
    # Convert datetime strings back to datetime objects
    for date_field in ['request_date', 'approved_date', 'paid_date', 'confirmed_date']:
        if booking.get(date_field) and isinstance(booking[date_field], str):
            booking[date_field] = datetime.fromisoformat(booking[date_field])
    
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
async def seed_admin():
    """Create default admin account (use only once)"""
    # Check if admin already exists
    existing = await db.admins.find_one({"email": "admin@brunomars.com"})
    if existing:
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    admin = Admin(
        email="admin@brunomars.com",
        password_hash=hash_password("admin123")
    )
    doc = admin.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.admins.insert_one(doc)
    
    return {"message": "Admin created successfully", "email": "admin@brunomars.com", "password": "admin123"}


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
        for date_field in ['request_date', 'approved_date', 'paid_date', 'confirmed_date']:
            if booking.get(date_field) and isinstance(booking[date_field], str):
                booking[date_field] = datetime.fromisoformat(booking[date_field])
    
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
        for date_field in ['request_date', 'approved_date', 'paid_date', 'confirmed_date']:
            if booking.get(date_field) and isinstance(booking[date_field], str):
                booking[date_field] = datetime.fromisoformat(booking[date_field])
    
    return bookings


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
    
    update_data = {
        'status': 'approved',
        'payment_method': approval_data.payment_method,
        'payment_instructions': approval_data.payment_instructions,
        'approved_date': datetime.now(timezone.utc).isoformat()
    }
    
    if approval_data.btc_wallet_address:
        update_data['btc_wallet_address'] = approval_data.btc_wallet_address
    if approval_data.btc_amount:
        update_data['btc_amount'] = approval_data.btc_amount
    if approval_data.admin_notes:
        update_data['admin_notes'] = approval_data.admin_notes
    
    await db.booking_requests.update_one({"id": booking_id}, {"$set": update_data})
    
    updated_booking = await db.booking_requests.find_one({"id": booking_id}, {"_id": 0})
    for date_field in ['request_date', 'approved_date', 'paid_date', 'confirmed_date']:
        if updated_booking.get(date_field) and isinstance(updated_booking[date_field], str):
            updated_booking[date_field] = datetime.fromisoformat(updated_booking[date_field])
    
    return updated_booking


@api_router.put("/admin/bookings/{booking_id}/reject", response_model=BookingRequest)
async def reject_booking(
    booking_id: str,
    reject_data: BookingReject,
    admin: dict = Depends(get_current_admin)
):
    """Reject a booking request"""
    booking = await db.booking_requests.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    update_data = {
        'status': 'rejected',
        'admin_notes': reject_data.admin_notes
    }
    
    await db.booking_requests.update_one({"id": booking_id}, {"$set": update_data})
    
    updated_booking = await db.booking_requests.find_one({"id": booking_id}, {"_id": 0})
    for date_field in ['request_date', 'approved_date', 'paid_date', 'confirmed_date']:
        if updated_booking.get(date_field) and isinstance(updated_booking[date_field], str):
            updated_booking[date_field] = datetime.fromisoformat(updated_booking[date_field])
    
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
    for date_field in ['request_date', 'approved_date', 'paid_date', 'confirmed_date']:
        if updated_booking.get(date_field) and isinstance(updated_booking[date_field], str):
            updated_booking[date_field] = datetime.fromisoformat(updated_booking[date_field])
    
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
        'confirmed_date': datetime.now(timezone.utc).isoformat()
    }
    
    if confirm_data.admin_notes:
        update_data['admin_notes'] = confirm_data.admin_notes
    
    await db.booking_requests.update_one({"id": booking_id}, {"$set": update_data})
    
    # Update ticket availability
    ticket = await db.ticket_types.find_one({
        "event_id": booking['event_id'],
        "type": booking['ticket_type']
    })
    if ticket:
        new_available = ticket['available_quantity'] - booking['quantity']
        await db.ticket_types.update_one(
            {"event_id": booking['event_id'], "type": booking['ticket_type']},
            {"$set": {"available_quantity": max(0, new_available)}}
        )
    
    updated_booking = await db.booking_requests.find_one({"id": booking_id}, {"_id": 0})
    for date_field in ['request_date', 'approved_date', 'paid_date', 'confirmed_date']:
        if updated_booking.get(date_field) and isinstance(updated_booking[date_field], str):
            updated_booking[date_field] = datetime.fromisoformat(updated_booking[date_field])
    
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


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
