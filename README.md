# Wave Business Automation API

A Node.js/TypeScript service that automates interactions with the Wave Business Portal. It provides a RESTful interface to trigger logins, fetch transaction history, and check account status.

## 🚀 How it Works

1. **Express Server:** Listens for requests to trigger automation tasks.
2. **Puppeteer:** Launches a headless Chromium instance to navigate the portal.
3. **Network Interception:** Listens to GraphQL responses to extract transaction data with 100% accuracy (avoiding UI-based scraping).
4. **OTP Bridge:** Provides a POST endpoint to inject the 2FA code into the live browser session.

## 🛠 Prerequisites

- Node.js (v18+)
- Puppeteer / Chromium
- A valid Wave Business Account (Côte d'Ivoire supported)

## 📦 Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install

   This is a sophisticated Wave Business Portal Automation API. It transforms the official Wave (Mobile Money) Business web portal into a programmatic REST API using Puppeteer, allowing for automated transaction monitoring and status checks.

Project Description
This project solves the lack of a traditional callback/webhook system for some merchant tiers by using a "Headless Browser as a Service" approach. It automates the multi-step authentication process (Login -> Password -> OTP via API) and intercepts internal GraphQL network traffic to extract real-time transaction data.

Key Features:

Programmatic Login: Handles country selection, phone/password entry, and session persistence.

Dynamic OTP Injection: Exposes a /otp endpoint to receive two-factor codes from an external SMS listener or manual entry.

Network Interception: Instead of fragile HTML scraping, it intercepts the business_graphql responses to get clean, structured JSON data directly from Wave's servers.

Status Monitoring: A dedicated heartbeat endpoint to verify if the session is still active.

README.md
Markdown

# Wave Business Automation API

A Node.js/TypeScript service that automates interactions with the Wave Business Portal. It provides a RESTful interface to trigger logins, fetch transaction history, and check account status.

## 🚀 How it Works

1. **Express Server:** Listens for requests to trigger automation tasks.
2. **Puppeteer:** Launches a headless Chromium instance to navigate the portal.
3. **Network Interception:** Listens to GraphQL responses to extract transaction data with 100% accuracy (avoiding UI-based scraping).
4. **OTP Bridge:** Provides a POST endpoint to inject the 2FA code into the live browser session.

## 🛠 Prerequisites

- Node.js (v18+)
- Puppeteer / Chromium
- A valid Wave Business Account (Côte d'Ivoire supported)

## 📦 Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
Configure your credentials in config.json:

JSON

{
  "mobile_phone": "0102030405",
  "password": "your_password"
}

This is a sophisticated Wave Business Portal Automation API. It transforms the official Wave (Mobile Money) Business web portal into a programmatic REST API using Puppeteer, allowing for automated transaction monitoring and status checks.

Project Description
This project solves the lack of a traditional callback/webhook system for some merchant tiers by using a "Headless Browser as a Service" approach. It automates the multi-step authentication process (Login -> Password -> OTP via API) and intercepts internal GraphQL network traffic to extract real-time transaction data.

Key Features:

Programmatic Login: Handles country selection, phone/password entry, and session persistence.

Dynamic OTP Injection: Exposes a /otp endpoint to receive two-factor codes from an external SMS listener or manual entry.

Network Interception: Instead of fragile HTML scraping, it intercepts the business_graphql responses to get clean, structured JSON data directly from Wave's servers.

Status Monitoring: A dedicated heartbeat endpoint to verify if the session is still active.

README.md
Markdown

# Wave Business Automation API

A Node.js/TypeScript service that automates interactions with the Wave Business Portal. It provides a RESTful interface to trigger logins, fetch transaction history, and check account status.

## 🚀 How it Works

1. **Express Server:** Listens for requests to trigger automation tasks.
2. **Puppeteer:** Launches a headless Chromium instance to navigate the portal.
3. **Network Interception:** Listens to GraphQL responses to extract transaction data with 100% accuracy (avoiding UI-based scraping).
4. **OTP Bridge:** Provides a POST endpoint to inject the 2FA code into the live browser session.

## 🛠 Prerequisites

- Node.js (v18+)
- Puppeteer / Chromium
- A valid Wave Business Account (Côte d'Ivoire supported)

## 📦 Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
Configure your credentials in config.json:

JSON

{
  "mobile_phone": "0102030405",
  "password": "your_password"
}
🚥 API Endpoints
1. Start Login
GET /login Starts the Puppeteer browser, enters credentials, and waits for the OTP.

2. Submit OTP
POST /otp Used to send the OTP code received on your phone to the automation engine. Body: { "code": "123456" }

3. Check Status
GET /status Returns whether the browser session is currently authenticated and active.

4. Fetch Transactions
GET /transactions Triggers a refresh on the portal and intercepts the transaction list. Returns: A cleaned list of recent MerchantSaleEntry items (Amount, Fee, Phone, Client Name, etc.).

⚠️ Important Note on Hosting
This project uses Puppeteer. If deploying to a VPS (recommended), ensure you install the necessary build-essential libraries for Chromium. Shared hosting is generally not supported due to missing system dependencies and high RAM usage.


