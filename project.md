
# Communication Protocol: Kitchen Sync

This file is the single source of truth between the project owner and Claude Code.

All changes, versions, and decisions are logged here with timestamps.

The changes are added under ## Change Requests and Claude Code should pick it up.


_"Please read PROJECT.md, understand the tech stack and requirements, and execute the first Pending Change Request to bootstrap the project from scratch."_

## Project Overview

**Problem:** Street food vendors manage orders through memory. Customers crowd around, pay via UPI with no tracking, wait without knowing order status, and things get chaotic at peak hours.

**Solution:** **Kitchen Sync** is a QR-based ordering system where customers scan a vendor's unique QR code, browse the menu, pay via Razorpay, get a simple 3-digit order ID, and receive push notifications when their food is ready. Vendors get a streamlined dashboard to manage orders, add menu items, and track analytics. The flow is designed to be completely frictionless, requiring zero PII or login from the customer.

## System Flow (End to End)

**Vendor Onboarding Flow:**

Vendor Registers (Name, Mobile, Kitchen Name, Address, Logo, Password, Unique ID) → Admin reviews details and approves → Vendor logs in → Adds menu items (Name, Price, Image) → Starts accepting orders.

**Customer Ordering Flow:**

Customer scans QR via any payment app / camera → Redirected to `website/v/{unique_qr_id}` → Local Storage UUID assigned automatically (No login/PII required) → Sees vendor logo, name, and menu items → Adds items to cart → Checks out & completes payment via Razorpay → Receives a simple 3-digit Order ID.

**Fulfillment Flow:**

Vendor sees new order on dashboard → Vendor clicks Accept → Customer receives push notification (Firebase/Browser Push) → Vendor marks Ready → Customer receives Ready notification → Customer shows 3-digit Order ID at counter → Vendor marks Complete.

## Tech Stack

|**Layer**|**Technology**|
|---|---|
|Backend|Django 5.x + Django REST Framework|
|Frontend|React 18 (or Next.js)|
|Database|SQLite (MVP) / PostgreSQL (Production)|
|Payment|Razorpay|
|Notifications|Firebase Cloud Messaging (FCM) / Browser Push|
|Hosting|Digital Ocean|
|QR Codes|`qrcode` Python library|

## Data Models

**Vendor**

| Field | Type | Notes |

| ------------- | -------- | ----------------------------------------------- |

| id | UUID | Primary key |

| name | String | Vendor owner human name |

| kitchen_name | String | Shop name |

| mobile_number | String | Contact number (Used for Login) |

| password | Hash | Hashed password for login |

| address | Text | Kitchen location |

| kitchen_logo | Image | Displayed on the customer menu page |

| unique_qr_id | String | Format: 'KS' + 3 alphanumeric (e.g., KSA1B) |

| is_approved | Boolean | Admin must set to True before vendor can log in |

| is_active | Boolean | Is the vendor currently accepting orders? |

| created_at | DateTime | Auto |

**MenuItem**

| Field | Type | Notes |

| ------------ | --------- | --------------------------- |

| id | UUID | Primary key |

| vendor | FK→Vendor | Which vendor owns this item |

| name | String | e.g., "Idli Plate" |

| price | Decimal | In INR |

| image | Image | Item photo |

| is_available | Boolean | Vendor can toggle on/off |

| created_at | DateTime | Auto |

**Order**

| Field | Type | Notes |

| ----------------- | --------- | ------------------------------------------------------------------ |

| id | UUID | Primary key |

| vendor | FK→Vendor | Which vendor |

| customer_local_id | String | UUID stored in customer's browser LocalStorage (No PII) |

| simple_order_id | Integer | 3-digit number (e.g., 001 to 999), resets daily per vendor |

| total_amount | Decimal | Sum of items |

| payment_id | String | Razorpay Transaction ID |

| payment_status | Enum | PENDING / PAID / FAILED |

| order_status | Enum | RECEIVED → ACCEPTED → READY → COMPLETED → CANCELLED |

| created_at | DateTime | Auto |

| updated_at | DateTime | Auto |

**OrderItem**

| Field | Type | Notes |

| ---------- | ----------- | ----------------------- |

| id | UUID | Primary key |

| order | FK→Order | Which order |

| menu_item | FK→MenuItem | Which item |

| quantity | Integer | How many |

| item_price | Decimal | Price at time of order |

## QR Code Strategy

Each vendor generates a unique QR code with their ID (e.g., `KS7X2`).

The QR encodes: `https://yourwebsite.com/v/KS7X2`

Scanning bypasses all app stores and logins, taking the user directly to the menu page.

## Vendor Dashboard Features

- **Live Orders Panel:** Real-time updates (Received → Accepted → Ready → Completed).
    
- **Menu Management:** Add items (Name, Image, Price), Edit, Delete, Toggle Availability.
    
- **Profile Section:** Manage kitchen details, address, logo.
    
- **Analytics Dashboard:** Total orders, revenue, top-selling items.
    

## Customer Flow Features

- **Zero-Friction Identity:** LocalStorage generates a unique ID on first visit. Tracks current and past orders on that device.
    
- **UI:** Vendor logo & name at the top, clean list of items with images and prices.
    
- **Checkout:** Seamless Razorpay integration.
    
- **Tracking:** Live tracking screen with Push Notifications when the vendor clicks "Accept" and "Ready".
    
- **Pickup:** Simple 3-digit number to show the vendor (e.g., "Order 042").
    

## Admin Flow Features

- **Login Only:** No public registration for Admins.
    
- **Vendor Approval:** View new vendor registrations and click "Approve" to grant them access.
    
- **Platform Analytics:** View global sales, active vendors, platform revenue.
    

## API Endpoints (Planned)

**Public & Customer**

| Method | Endpoint | Purpose |

| :--- | :--- | :--- |

| POST | `/api/vendors/register/` | Vendor signs up (Requires admin approval to activate) |

| GET | `/api/v/{unique_qr_id}/` | Fetch vendor details + menu for customer |

| POST | `/api/checkout/` | Create Razorpay order |

| POST | `/api/checkout/verify/` | Verify Razorpay payment signature & create Order |

| GET | `/api/orders/customer/{local_id}/`| Fetch all orders for a specific device |

**Vendor (Auth Required)**

| Method | Endpoint | Purpose |

| :--- | :--- | :--- |

| POST | `/api/vendor/login/` | Vendor login (returns token if approved) |

| GET | `/api/vendor/orders/` | List live orders |

| PATCH| `/api/vendor/orders/{id}/status/` | Update order status (triggers push notification) |

| GET | `/api/vendor/menu/` | List menu items |

| POST | `/api/vendor/menu/` | Add menu item |

| PATCH| `/api/vendor/menu/{id}/` | Edit/Toggle menu item |

| GET | `/api/vendor/analytics/` | Dashboard metrics (revenue, order counts) |

**Admin (Auth Required)**

| Method | Endpoint | Purpose |

| :--- | :--- | :--- |

| GET | `/api/admin/vendors/pending/` | List vendors awaiting approval |

| PATCH| `/api/admin/vendors/{id}/approve/`| Approve a vendor |

| GET | `/api/admin/analytics/` | Platform-wide stats |

## Version Plan

**V1.0 - MVP (Core Flow)**

- Admin vendor approval system.
    
- Vendor registration.
    
- Vendor Dashboard (Orders, Menu, Profile, Analytics).
    
- Customer LocalStorage tracking (No PII).
    
- Customer Menu UI & Cart.
    
- Razorpay integration.
    
- 3-Digit daily order ID generation.
    
- Firebase/Browser push notifications for Order updates.
    

## Folder Structure (Planned)

Plaintext

```
kitchen_sync/
├── backend/
│   ├── kitchen_sync/         # Django project settings
│   ├── accounts/             # Admin, Vendor models & Auth APIs
│   ├── menu/                 # MenuItem models & APIs
│   ├── orders/               # Order, OrderItem, Razorpay integration APIs
│   ├── analytics/            # Reporting endpoints
│   ├── notifications/        # FCM/Push logic
│   └── manage.py
├── frontend/
│   ├── public/
│   └── src/
│       ├── pages/
│       │   ├── admin/        # Admin dashboard & approvals
│       │   ├── vendor/       # Vendor auth, dashboard, menu management
│       │   └── customer/     # Menu view, Cart, Checkout, Tracking
│       ├── components/
│       ├── utils/            # LocalStorage handlers, Razorpay config
│       └── App.jsx
├── PROJECT.md                # ← THIS FILE
└── README.md
```

## Change Requests

How to use: Add your change request below with a date. Claude Code will read this section, implement the change, and log it in the Development Log.

#### [2026-04-05] - Bootstrap Project From Scratch

**What:** Read this entire `PROJECT.md` file to understand the architecture, tech stack, data models, and folder structure. Then, initialize the project from scratch. Set up the Django backend and React frontend according to the planned folder structure. Create the initial database models and configure standard project settings (CORS, REST framework, etc.).

**Why:** The project is currently a blank slate. We need the foundational boilerplate and configuration set up before building specific features or APIs.

**Priority:** HIGH

**Status:** COMPLETED

## Development Log

Claude Code logs every implementation session here.

#### [2026-04-05] - V0.1 - Project Bootstrap

**Version:** V0.1

**Files changed:**
- `backend/` — Full Django 5.1 project scaffolded
  - `kitchen_sync/settings.py` — CORS, DRF, JWT, Razorpay, FCM config; `AUTH_USER_MODEL = accounts.Vendor`
  - `kitchen_sync/urls.py` — Root URL routing to all apps
  - `accounts/` — Custom `Vendor` model (UUID PK, `AbstractBaseUser`, auto QR ID), serializers, views, URLs, admin
  - `menu/` — `MenuItem` model, serializers, views, URLs
  - `orders/` — `Order` + `OrderItem` models (3-digit daily ID, status enum), Razorpay checkout + verify views, URLs
  - `analytics/` — Vendor & admin analytics views
  - `notifications/` — `PushSubscription` model, push subscribe view, `send_order_notification` task
  - `requirements.txt` — All pinned deps (Django 5.1, DRF, SimpleJWT, Razorpay, qrcode, Pillow, etc.)
  - `.env.example` — Template for secrets
  - Migrations applied; `manage.py check` passes (0 issues)
- `frontend/` — React 18 + Vite project scaffolded
  - `src/App.jsx` — BrowserRouter with all routes wired
  - `src/pages/customer/` — `MenuPage`, `CheckoutPage`, `OrderTrackingPage`
  - `src/pages/vendor/` — `LoginPage`, `RegisterPage`, `DashboardPage` (live orders, accept/ready/complete flow)
  - `src/pages/admin/` — `AdminDashboardPage` (pending approvals, platform analytics)
  - `src/utils/localStorage.js` — Customer UUID, vendor token, per-vendor cart helpers
  - `src/utils/api.js` — Axios instance with JWT auto-attach + 401 redirect
  - `.env.example` — `VITE_API_URL` template

**Summary:** Full project skeleton bootstrapped from scratch. All models created, migrations applied, Django system check clean. Frontend routes match the customer/vendor/admin flows defined in the spec.

#### [2026-04-05 16:05] - Pre-Development Finalization

**Version:** V0.0

**Files changed:** PROJECT.md (this file)

**Summary:** Finalized data models, removed SMS OTP requirement, confirmed Razorpay integration, and defined the initial bootstrap command for Claude Code to execute. Project is ready for code initialization.

## Decisions Log

|**Date**|**Decision**|**Reason**|
|---|---|---|
|2026-04-05|Project Initialization Instruction|Added explicit bootstrap commands in Change Requests to ensure AI starts with correct context and architecture.|
|2026-04-05|Removed SMS OTP|Relying on manual admin approval saves API costs and simplifies MVP onboarding.|
|2026-04-05|Name change to Kitchen Sync|Rebranding request|
|2026-04-05|Razorpay Integration|Requires a seamless automated checkout flow.|
|2026-04-05|LocalStorage UUID for Customers|Eliminates friction of signing up or entering details for street food context.|
|2026-04-05|3-Digit simple Order IDs|Easy for customers and vendors to communicate loudly in crowded areas.|
