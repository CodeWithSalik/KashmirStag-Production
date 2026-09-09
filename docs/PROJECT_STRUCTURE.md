# KashmirStag Project Structure Reference

```
KashmirStag-Production/
├── .env.example                     # Comprehensive environment variable documentation
├── .env.local                       # Local environment secrets (not committed)
├── next.config.ts                   # Next.js 15 configuration (image optimization, server actions)
├── package.json                     # Project manifest and scripts
├── postcss.config.js                # PostCSS setup
├── tailwind.config.js               # KashmirStag brand design system theme tokens
├── tsconfig.json                    # Strict TypeScript configuration
├── docs/                            # Core system documentation
│   ├── ARCHITECTURE.md              # System design and domain logic
│   ├── DATABASE.md                  # Entity schemas and relationships
│   ├── API.md                       # Complete API routes reference
│   ├── PROJECT_STRUCTURE.md         # Folder layout and guidelines
│   ├── SECURITY.md                  # Security controls and defenses
│   ├── DEPLOYMENT.md                # Deployment and operations guide
│   └── ROADMAP.md                   # Future enhancements and phases
├── public/                          # Static assets (logos, icons, placeholders)
│   ├── logo.png
│   ├── favicon.ico
│   └── uploads/                     # Local storage directory for product images
├── scripts/                         # Operational CLI scripts
│   ├── seed.ts                      # Populates demo catalog data
│   ├── migrate-legacy-passwords.ts  # Converts legacy AES credentials into bcrypt
│   └── fix-imports.js               # Batch utility script
└── src/                             # Source code root
    ├── app/                         # Next.js 15 App Router pages and layouts
    │   ├── globals.css              # Global styles, Tailwind layers
    │   ├── layout.tsx               # Root application layout (Providers + fonts)
    │   ├── not-found.tsx            # Global 404 page
    │   ├── error.tsx                # Global error boundary
    │   ├── loading.tsx              # Global loading suspense fallback
    │   ├── (auth)/                  # Auth route group
    │   │   ├── layout.tsx           # Centered card layout for authentication
    │   │   ├── login/page.tsx       # Sign In page
    │   │   ├── signup/page.tsx      # Customer registration page
    │   │   ├── forgot-password/page.tsx
    │   │   └── reset-password/page.tsx
    │   ├── (storefront)/            # Customer-facing shopping routes
    │   │   ├── layout.tsx           # Storefront layout (Navbar + Footer)
    │   │   ├── page.tsx             # Homepage (Hero, value props, categories)
    │   │   ├── shop/page.tsx        # Product browsing with filters & pagination
    │   │   ├── categories/page.tsx  # Categories index page
    │   │   ├── category/[slug]/     # Specific category product grid
    │   │   ├── collection/[slug]/   # Promotional collections
    │   │   ├── product/[slug]/      # Conversion-optimized Product Detail Page
    │   │   ├── search/page.tsx      # Search results
    │   │   ├── cart/page.tsx        # Shopping cart view
    │   │   ├── checkout/page.tsx    # Multi-step checkout with Razorpay modal
    │   │   ├── wishlist/page.tsx    # Customer wishlist
    │   │   ├── about/page.tsx       # Brand story
    │   │   ├── contact/page.tsx     # Contact details & form
    │   │   ├── faq/page.tsx         # Collapsible FAQ accordion
    │   │   ├── privacy/page.tsx     # Privacy policy
    │   │   ├── terms/page.tsx       # Terms of service
    │   │   ├── shipping-info/page.tsx# Shipping policy & timings
    │   │   └── returns/page.tsx     # Return & refund policy
    │   ├── (account)/               # Authenticated customer portal
    │   │   ├── layout.tsx           # Account layout with sidebar
    │   │   └── account/
    │   │       ├── page.tsx         # Account dashboard
    │   │       ├── orders/page.tsx  # Order history list
    │   │       ├── orders/[id]/page.tsx # Order details & fulfillment timeline
    │   │       ├── profile/page.tsx # Profile settings
    │   │       ├── addresses/page.tsx # Saved addresses manager
    │   │       └── reviews/page.tsx # My product reviews
    │   ├── admin/                   # Administrative back-office
    │   │   ├── layout.tsx           # Admin layout with collapsible sidebar
    │   │   ├── page.tsx             # Executive KPI dashboard
    │   │   ├── products/            # Product catalog management
    │   │   ├── categories/          # Category tree manager
    │   │   ├── collections/         # Collection manager
    │   │   ├── inventory/           # Stock tracker & adjustment dialogs
    │   │   ├── orders/              # Order processing & tracking manager
    │   │   ├── customers/           # Customer accounts & history
    │   │   ├── coupons/             # Promotional coupons
    │   │   ├── reviews/             # Review moderation
    │   │   ├── audit-log/           # System activity logs
    │   │   └── settings/            # Store configuration
    │   └── api/                     # REST API endpoints (App Router routes)
    ├── components/                  # Reusable UI component library
    │   ├── ui/                      # 17 primitive design system components (buttons, tables, modals)
    │   ├── layout/                  # Navbar, MobileNav, Footer, AdminSidebar
    │   ├── product/                 # ProductCard, ProductGrid, ProductGallery, VariantSelector
    │   ├── cart/                    # CartDrawer, CartItemRow
    │   ├── checkout/                # AddressForm, OrderSummaryCard
    │   ├── shared/                  # SearchBar, FilterSidebar, SortDropdown
    │   └── admin/                   # StatsCard, DataTable
    ├── config/                      # System constants & navigation maps
    │   ├── constants.ts             # Enums, statuses, business limits
    │   ├── navigation.ts            # Route definitions for all menus
    │   └── seo.ts                   # Default OpenGraph and SEO metadata
    ├── lib/                         # Low-level utilities and singletons
    │   ├── db.ts                    # MongoDB connection cache with transactions
    │   ├── auth.ts                  # JWT signing, cookie handlers, bcrypt
    │   ├── money.ts                 # Paise precision arithmetic & formatting
    │   ├── razorpay.ts              # Razorpay SDK initialization
    │   ├── email.ts                 # Nodemailer transactional templates
    │   ├── upload.ts                # File upload validation & storage
    │   ├── errors.ts                # AppError hierarchy & API error formatting
    │   ├── api-helpers.ts           # Standardized JSON response builders
    │   └── utils.ts                 # Tailwind `cn()` helper
    ├── models/                      # 18 Mongoose data models
    ├── providers/                   # Client-side React contexts
    │   ├── auth-provider.tsx        # Authentication state & actions
    │   ├── cart-provider.tsx        # Shopping cart state with server synchronization
    │   └── toast-provider.tsx       # Toast notifications
    ├── services/                    # Core business logic layer
    ├── types/                       # TypeScript interfaces
    └── validations/                 # Zod runtime validation schemas
```
