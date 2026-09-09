# KashmirStag Production Deployment Guide

## 1. Prerequisites
- **Node.js**: Version 20.x or 22.x LTS
- **Database**: MongoDB Atlas Cluster (M10+ recommended for production with replica set transactions)
- **Payment Gateway**: Razorpay Live Account (Key ID, Secret, and Webhook Secret)
- **Email Service**: SMTP server (AWS SES, SendGrid, or Resend)
- **Hosting Platform**: Vercel, Railway, AWS ECS, or a Linux VPS (Ubuntu 24.04 with PM2 and Nginx)

---

## 2. Environment Variables Configuration

Copy `.env.example` to your production environment and populate all fields:

```ini
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://kashmirstag.com
NEXT_PUBLIC_APP_NAME="KashmirStag"

# Database
MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.mongodb.net/kashmirstag?retryWrites=true&w=majority"

# Authentication
JWT_SECRET="<generate-at-least-64-character-random-secret>"
ADMIN_EMAILS="pirzadasalik543@gmail.com"

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_KEY_SECRET="..."
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_..."
RAZORPAY_WEBHOOK_SECRET="..."

# Email Notifications
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT=587
SMTP_USER="apikey"
SMTP_PASS="..."
SMTP_FROM="KashmirStag <orders@kashmirstag.com>"
```

---

## 3. Deployment Steps

### Option A: Vercel (Recommended for Next.js 15)
1. Push the repository to GitHub/GitLab.
2. Link the repository in the Vercel dashboard.
3. Configure the Root Directory as `./` and Framework Preset as `Next.js`.
4. Add all environment variables in **Project Settings -> Environment Variables**.
5. Ensure MongoDB Atlas Network Access whitelist includes `0.0.0.0/0` (with strong DB credentials) or configure Vercel Secure Compute integration.
6. Deploy! Vercel automatically runs:
   ```bash
   npm install
   npm run build
   ```

### Option B: Linux VPS / Docker (Node.js Server)
1. Install Node.js 20+ and PM2:
   ```bash
   npm install -g pm2
   ```
2. Clone repository & install dependencies:
   ```bash
   git clone https://github.com/YourRepo/KashmirStag-Production.git
   cd KashmirStag-Production
   npm ci
   ```
3. Run database seed (if initial setup):
   ```bash
   npm run seed
   ```
4. Build the Next.js application:
   ```bash
   npm run build
   ```
5. Start the production server with PM2:
   ```bash
   pm2 start npm --name "kashmirstag" -- start
   pm2 save
   pm2 startup
   ```
6. Setup Nginx reverse proxy with SSL (Certbot):
   ```nginx
   server {
       server_name kashmirstag.com www.kashmirstag.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## 4. Post-Deployment Verification Checklist
1. Visit `https://kashmirstag.com/` and confirm styled homepage, navbar, and footer.
2. Navigate to `/shop` and test product filters and category navigation.
3. Test customer registration at `/signup` and confirm the `auth-token` cookie is set.
4. Add a product to the cart, proceed to `/checkout`, and verify test payment with Razorpay.
5. Log into `/admin` with the owner email and verify orders, inventory, and stats render properly.
6. Configure the Razorpay Webhook URL:
   - Endpoint: `https://kashmirstag.com/api/webhooks/razorpay`
   - Active Events: `payment.captured`, `payment.failed`, `order.paid`
   - Secret: Matches `RAZORPAY_WEBHOOK_SECRET` in environment variables.
