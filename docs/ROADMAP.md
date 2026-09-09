# KashmirStag Future Architecture & Roadmap

This document outlines architectural extension points designed into the MVP to support future growth without requiring fundamental rewrites.

---

## 1. Post-MVP Architecture Milestones

### Phase 1: Logistics & Multi-Courier Integration
- **Architecture Extension**: The current fulfillment abstraction (`Shipment` model and `order.fulfillment` object) is decoupled from any single carrier.
- **Milestone Goal**: Integrate Shiprocket / Delhivery APIs for automated AWB generation, pickup scheduling, and real-time webhook status updates.

### Phase 2: Marketplace & Multi-Vendor Capability
- **Architecture Extension**: The `Product` schema includes vendor/creator hooks.
- **Milestone Goal**:
  - Introduce `Vendor` model with commission rates.
  - Dedicated Vendor Portal for artisan product uploads and order fulfillment.

### Phase 3: Omnichannel Notifications (WhatsApp & SMS)
- **Architecture Extension**: The notification layer (`src/lib/email.ts`) is designed to sit alongside a generalized `NotificationDispatcher`.
- **Milestone Goal**:
  - Add Twilio / Gupshup WhatsApp Business API integration.
  - Send instant WhatsApp dispatch notifications with live courier tracking links.

### Phase 4: Recommendation Engine & Personalization
- **Architecture Extension**: High-quality search indices and product tag matrices (`tags`, `categoryId`, `collectionIds`).
- **Milestone Goal**:
  - Real-time "Frequently Bought Together" bundle logic.
  - Personalized homepage carousels driven by customer browsing history.

### Phase 5: Loyalty, Rewards & Gift Cards
- **Architecture Extension**: The coupon engine (`Coupon`, `CouponUsage`) supports percentage and fixed discounts.
- **Milestone Goal**:
  - Introduce customer points ledger.
  - Store credit and redeemable digital gift cards.
