# 🎟️ VIP Concierge Booking System - Bruno Mars Clone

## 🎯 Project Overview
A complete **VIP ticketing and meet-and-greet booking system** with Bruno Mars website clone design and manual payment processing workflow.

---

## ✨ Key Features

### 🌐 Public Website (Bruno Mars Clone)
- ✅ Hero section with promotional banner
- ✅ Tour dates section with event cards
- ✅ Store/Album promotional sections
- ✅ Video embed sections (Risk It All, I Just Might)
- ✅ Vinyl promotional section
- ✅ Full responsive design
- ✅ Booking request modal
- ✅ Booking status checker
- ✅ Social media footer

### 🎫 Ticketing System
- ✅ Three ticket tiers:
  - **General Admission** - Standard access
  - **VIP Access** - Premium experience
  - **Meet & Greet** - Exclusive backstage access
- ✅ Real-time availability tracking
- ✅ Dynamic pricing display
- ✅ Confirmation number generation

### 💳 Payment System (Manual Control)
Supported payment methods:
- ✅ **Zelle** - Email/Phone payment
- ✅ **Cash App** - $Cashtag payment
- ✅ **Apple Pay** - Email/Phone payment
- ✅ **Bank Transfer** - ACH/Wire details
- ✅ **Bitcoin (BTC)** - Wallet address + BTC amount calculation

### 📊 Admin Panel (/admin-secret)
1. **Dashboard**
   - Real-time booking statistics
   - Pending, Approved, Paid, Confirmed counts
   - Total revenue tracking
   - Recent booking requests table

2. **Event Management**
   - Create/Edit/Delete events
   - Set venue, city, date, time
   - Upload event images
   - Configure ticket types and pricing
   - Set availability for each ticket tier

3. **Booking Management**
   - View all bookings (filtered by status)
   - Approve/Reject booking requests
   - Provide payment instructions
   - Mark bookings as paid
   - Confirm final bookings
   - BTC wallet address configuration

4. **Payment Settings**
   - Configure payment instructions for each method
   - Set up BTC wallet address
   - Edit payment templates

---

## 🔄 Booking Flow

### Customer Flow:
1. Browse events on homepage
2. Click "REQUEST TICKETS"
3. Select ticket type (General/VIP/Meet & Greet)
4. Fill in customer details (name, email, phone, quantity)
5. Submit request → Receive confirmation number
6. Check status anytime with confirmation number

### Admin Workflow:
1. **Pending** → Review booking request
2. **Approve** → Select payment method, provide instructions
3. **Paid** → Verify payment, mark as paid
4. **Confirmed** → Final confirmation, tickets released

### Status Flow:
```
Pending → Approved → Paid → Confirmed
   ↓
Rejected (with admin notes)
```

---

## 🛠️ Technical Stack

### Backend:
- **Framework**: FastAPI (Python)
- **Database**: MongoDB (Motor async driver)
- **Authentication**: JWT tokens (bcrypt password hashing)
- **API**: RESTful endpoints with /api prefix

### Frontend:
- **Framework**: React 19
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **Routing**: React Router v7
- **HTTP Client**: Axios

### APIs:
- **BTC Price**: CoinGecko API for real-time BTC/USD conversion

---

## 📁 Project Structure

```
/app/
├── backend/
│   ├── server.py              # FastAPI application with all endpoints
│   ├── requirements.txt       # Python dependencies
│   └── .env                   # Backend environment variables
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main routing
│   │   ├── pages/
│   │   │   ├── HomePage.js           # Bruno Mars clone
│   │   │   ├── BookingStatus.js      # Status checker
│   │   │   └── admin/
│   │   │       ├── AdminLogin.js     # Admin authentication
│   │   │       ├── AdminLayout.js    # Admin panel layout
│   │   │       ├── AdminDashboard.js # Statistics dashboard
│   │   │       ├── EventManagement.js    # Event CRUD
│   │   │       ├── BookingManagement.js  # Booking workflow
│   │   │       └── PaymentSettings.js    # Payment config
│   │   └── components/
│   │       ├── Navbar.js         # Site navigation
│   │       ├── Footer.js         # Social footer
│   │       └── BookingModal.js   # Ticket request form
│   └── .env                  # Frontend environment variables
└── memory/
    └── test_credentials.md   # Admin credentials
```

---

## 🔐 Admin Credentials

**Admin Panel URL**: `/admin-secret`

**Default Admin Account:**
- Email: `admin@brunomars.com`
- Password: `admin123`

⚠️ **Change these credentials in production!**

---

## 🗄️ Database Models

### 1. admins
- id, email, password_hash, created_at

### 2. events
- id, title, venue, city, date, time, image_url, description, status

### 3. ticket_types
- id, event_id, type (general/vip/meetgreet), price_usd, available_quantity, total_quantity

### 4. booking_requests
- id, confirmation_number, event_id, ticket_type, customer_name, email, phone, quantity
- status, payment_method, payment_instructions, btc_wallet_address, btc_amount
- transaction_id, admin_notes, request_date, approved_date, paid_date, confirmed_date

### 5. payment_settings
- id, payment_method, instructions, btc_wallet_address, updated_at

---

## 🚀 API Endpoints

### Public APIs:
```
GET  /api/events                      # List active events
GET  /api/events/:id                  # Event details with tickets
POST /api/bookings                    # Submit booking request
GET  /api/bookings/:confirmationNumber # Check booking status
GET  /api/btc-price                   # Get BTC/USD price
```

### Admin APIs (JWT Protected):
```
POST   /api/admin/login               # Admin authentication
POST   /api/admin/seed                # Create default admin
GET    /api/admin/dashboard           # Dashboard statistics

# Events
GET    /api/admin/events              # List all events
POST   /api/admin/events              # Create event
PUT    /api/admin/events/:id          # Update event
DELETE /api/admin/events/:id          # Delete event

# Tickets
GET    /api/admin/tickets/:eventId    # Get event tickets
POST   /api/admin/tickets             # Create/update ticket type
PUT    /api/admin/tickets/:id         # Update ticket

# Bookings
GET    /api/admin/bookings            # List all bookings (filterable)
PUT    /api/admin/bookings/:id/approve    # Approve booking
PUT    /api/admin/bookings/:id/reject     # Reject booking
PUT    /api/admin/bookings/:id/mark-paid  # Mark as paid
PUT    /api/admin/bookings/:id/confirm    # Confirm booking

# Payment Settings
GET    /api/admin/payment-settings    # Get payment settings
PUT    /api/admin/payment-settings/:method # Update payment settings
```

---

## 💰 Bitcoin Integration

### Features:
- Real-time USD to BTC conversion (CoinGecko API)
- Admin provides wallet address
- BTC amount calculated at approval time
- 30-minute payment window recommendation
- Transaction ID (TXID) tracking
- Manual verification by admin

### Flow:
1. Booking approved → Admin provides BTC wallet + amount
2. Customer sends BTC payment
3. Customer submits TXID
4. Admin verifies on blockchain
5. Admin marks as paid → Booking confirmed

---

## 🎨 Design Features

### Bruno Mars Clone Aesthetic:
- Dark, moody color scheme (black/zinc/red)
- Large hero images with overlays
- Concert photography throughout
- Red accent color for CTAs
- Professional typography
- Smooth transitions and hover effects

### Responsive Design:
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Touch-friendly buttons
- Adaptive layouts

---

## 📊 Sample Data

### Events Created:
1. **Bruno Mars - The Romantic Tour**
   - Venue: Madison Square Garden
   - Location: New York, NY
   - Date: June 15, 2026
   - General: $150 (100 tickets)
   - VIP: $500 (50 tickets)
   - Meet & Greet: $2000 (10 tickets)

2. **Bruno Mars Live in LA**
   - Venue: Staples Center
   - Location: Los Angeles, CA
   - Date: July 20, 2026

3. **The Romantic Tour - Miami**
   - Venue: American Airlines Arena
   - Location: Miami, FL
   - Date: August 10, 2026

---

## ✅ Testing Results

### Completed Tests:
1. ✅ Homepage loads with all sections
2. ✅ Tour section displays events correctly
3. ✅ Booking modal opens and functions
4. ✅ Ticket type selection works
5. ✅ Booking submission successful
6. ✅ Confirmation number generated (E116B679)
7. ✅ Admin login successful
8. ✅ Admin dashboard shows statistics
9. ✅ Events management displays all events
10. ✅ Booking appears in admin panel
11. ✅ Pending request count updated

### Complete Booking Flow:
✅ Customer submits booking
✅ Admin sees pending request
✅ Dashboard updates in real-time
✅ All data correctly stored in MongoDB

---

## 🔒 Security Features

- JWT token authentication for admin
- Bcrypt password hashing
- Private admin URL (/admin-secret)
- CORS configuration
- Input validation (Pydantic models)
- SQL injection protection (MongoDB)
- Status-based access control

---

## 🌟 Key Highlights

### VIP Concierge Model:
- ✅ Manual approval for quality control
- ✅ Exclusive, high-touch experience
- ✅ Multiple premium payment options
- ✅ Bitcoin support for crypto enthusiasts
- ✅ Complete admin control over bookings
- ✅ No automated payment processing
- ✅ Personal customer communication

### Professional Features:
- ✅ Real-time inventory tracking
- ✅ Confirmation number system
- ✅ Status tracking for customers
- ✅ Comprehensive admin dashboard
- ✅ Payment method flexibility
- ✅ BTC price integration
- ✅ Mobile-responsive design
- ✅ Production-ready architecture

---

## 📝 Future Enhancements (Optional)

- Email notifications (Resend/SendGrid)
- SMS confirmations (Twilio)
- Automated payment integration (Stripe)
- Customer accounts/profiles
- Booking history
- QR code ticket generation
- Event analytics
- Calendar integration
- Multi-admin support
- Role-based permissions

---

## 🎉 System Status

**✅ FULLY OPERATIONAL**

- Backend API: Running
- Frontend: Running
- Database: Connected
- Admin Panel: Accessible
- Public Site: Live
- Booking System: Functional
- Sample Data: Loaded

**Test Booking Created:**
- Confirmation: E116B679
- Customer: John Smith
- Type: VIP (2 tickets)
- Status: Pending

---

## Access Routes

- **Public Site**: /
- **Admin Panel**: /admin-secret
- **Booking Status**: /booking-status
- **Backend API**: /api

---

## 🎯 Perfect For:

- VIP concert tickets
- Exclusive event access
- Meet & Greet experiences
- High-end event management
- Boutique ticketing services
- Premium entertainment bookings
- Artist tour management
- Luxury event coordination

---

**Built as a custom Bruno Mars VIP booking web app**

