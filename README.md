# Wave Sync

**Wave Sync** is a TypeScript-based API wrapper and automation tool for the Wave Business Portal. It leverages **Puppeteer** to automate browser interactions and **Express** to provide a RESTful API interface. This allows developers to programmatically log in, handle OTPs, check account status, and retrieve transaction history from a Wave Business account.

## 📦 Version

Wave Sync

Wave Sync is a TypeScript-based API wrapper and automation tool for the Wave Business Portal. It leverages Puppeteer to automate browser interactions and Express to provide a RESTful API interface.

📦 Version

Current Version: 1.2.1

What's New in v1.2.1

- **OTP Listener Fix:** Solved race conditions in multi-store environments by namespacing OTP events per store ID.
- **Improved Cleanup:** Added strict listener removal on timeouts to prevent memory leaks.

What's New in v1.2.0

- **Multi-Packet Collector:** Merges background data shards to ensure 100% data capture.
- **Verification Endpoint:** Verify a single transaction using its client reference.
- **Full Type Safety:** Strict TypeScript interfaces for all Wave API responses.

🚀 Features

Automated Login: Handles the login flow and handles SMS OTPs via API.

Smart Interception: Captures GraphQL packets to retrieve clean, parsed transaction history.

Deduplication: Merges multiple network packets to prevent missing or double entries.

Webhooks: Real-time notifications for OTP, login status, and session health.

📡 API Endpoints

1. Get Transactions

Retrieves the history of transactions for a specific store.

URL: GET /transactions/:store_id

Logic: Waits 5 seconds to collect all background shards from Wave.

2. Verify Transaction

Checks if a specific transaction exists based on a client reference.

URL: GET /verify/:store_id/:client_reference

Response: ```json
{
"success": true,
"transaction": { ... },
"status": 200
}

### 3. Check Status

Checks if the browser session is currently active.

- **URL:** `GET /status/:store_id`

### 4. Disconnect Store

Removes the session cookie for a store.

- **URL:** `DELETE /disconnect/:store_id`

## 🪝 Webhook Events

Events are sent to the URL defined in `app.config.json`.

- `otp:required`
- `login:success` / `login:failed`
- `no_config`
- `session_expired`

## ⚠️ Disclaimer

This project is an unofficial automation tool. Use it responsibly and ensure you comply with Wave's Terms of Service.

## 🚀 Features

- **Automated Login:** Handles the login flow for the Wave Business Portal, including country selection and credential entry.
- **OTP Management via API:** Since Wave requires SMS OTPs, this service exposes an endpoint to receive the OTP programmatically and feed it into the automated browser instance.
- **Transaction Scraping:** Intercepts GraphQL network requests to retrieve clean, parsed transaction history (Deposits, Payments, Fees).
- **Status Monitoring:** Checks if the account is currently connected/active.
- **Webhooks:** Sends real-time webhooks for critical events (OTP required, Login success/failure, Session expired).
- **Multi-Store Support:** Manage multiple Wave Business accounts with separate session cookies.

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Language:** TypeScript
- **Browser Automation:** Puppeteer
- **Server:** Express.js

## ⚙️ Installation

1. **Clone the repository:**

```bash
git clone https://github.com/TheOptimizer15/Wave-Sync.git
cd Wave-Sync

```

2. **Install dependencies:**

```bash
npm install

```

3. **Build the project (if using tsc):**

```bash
npm run build

```

## 📁 Configuration

To run this project, you must create two JSON configuration files in the root directory.

> **Note:** Credentials (phone, password) are no longer stored in config files. They are passed securely via the API request body when calling the `/login` endpoint.

### 1. `app.config.json`

Controls the application logic and URLs.

```json
{
  "wave_portal_url": "https://business.wave.com/login",
  "wave_transaction_url": "https://business.wave.com/transactions",
  "timeout": 60000,
  "webhook": {
    "url": "https://your-external-webhook-listener.com/events",
    "alert_otp": true,
    "alert_login": true,
    "alert_no_config": true,
    "alert_session_expired": true
  }
}
```

### 2. `country.json`

Maintained to handle the latest CSS selectors for country selection. This file allows the bot to support multiple regions and adapt to UI changes.

```json
{
  "ci": {
    "value": "Côte d'Ivoire",
    "attr": "[data-value='ci']"
  },
  "sn": {
    "value": "Sénégale",
    "attr": "[data-value='sn']"
  },
  "ug": {
    "value": "Uganda",
    "attr": "[data-value='ug']"
  },
  "ml": {
    "value": "Mali",
    "attr": "[data-value='ml']"
  },
  "bf": {
    "value": "Burkina Faso",
    "attr": "[data-value='bf']"
  },
  "gm": {
    "value": "Gambie",
    "attr": "[data-value='gm']"
  },
  "ne": {
    "value": "Unknown",
    "attr": "[data-value='ne']"
  },
  "cm": {
    "value": "Cameroun",
    "attr": "[data-value='cm']"
  },
  "sl": {
    "value": "Unknown",
    "attr": "[data-value='sl']"
  },
  "cd": {
    "value": "Unknown",
    "attr": "[data-value='cd']"
  }
}
```

## ▶️ Usage

Start the server:

```bash
npm start
# or for development
npm run dev

```

The server defaults to port `3000` (or `process.env.PORT`).

## 📡 API Endpoints

### 1. Health Check

Check server and browser status.

- **URL:** `GET /health`
- **Response:**

```json
{
  "success": true,
  "browser_connected": true,
  "time": 1706357700000
}
```

### 2. Start Login Process

Triggers the Puppeteer browser to open and attempt login.

- **URL:** `POST /login`
- **Body:**

```json
{
  "store_id": "my_store",
  "phone": "0123456789",
  "password": "your_password"
}
```

- **Response:**

```json
{
  "success": true,
  "message": "Login process initiated, waiting for OTP"
}
```

- **Behavior:** This will keep the browser open. If an OTP is required, it triggers the `otp:required` webhook.

### 3. Submit OTP

If the login process pauses for an OTP, submit the code here.

- **URL:** `POST /otp`
- **Body:**

```json
{ "code": "1234" }
```

- **Response:**

```json
{ "success": true, "message": "OTP received and forwarded" }
```

### 4. Get Transactions

Retrieves the history of transactions for a specific store.

- **URL:** `GET /transactions/:store_id`
- **Response:** Returns a JSON list of transactions, including ID, amount, fees, sender name, phone, and client reference.

### 5. Check Status

Checks if the browser session is currently logged in for a specific store.

- **URL:** `GET /status/:store_id`
- **Response:**

```json
{
  "success": true,
  "message": "Account connected",
  "time": 1706357700000,
  "status": 200
}
```

### 6. Disconnect Store

Removes the session cookie for a store, effectively disconnecting it.

- **URL:** `DELETE /disconnect/:store_id`
- **Response:**

```json
{
  "success": true,
  "message": "Store my_store disconnected successfully",
  "time": 1706357700000
}
```

## 🪝 Webhook Events

The application sends POST requests to the URL defined in `app.config.json`.

| Event Name        | Trigger                       | Payload Data                          |
| ----------------- | ----------------------------- | ------------------------------------- |
| `otp:required`    | Login page requested SMS code | `event`, `time`, `time_stamp`         |
| `otp:failed`      | OTP timed out (approx 4 mins) | `event`, `time`, `time_stamp`         |
| `login:success`   | Login completed successfully  | `event`, `time`, `time_stamp`         |
| `login:failed`    | Wrong password or other error | `event`, `time`, `message`            |
| `no_config`       | Store config file not found   | `type`, `store_id`, `message`, `time` |
| `session_expired` | Session cookie is invalid     | `type`, `store_id`, `message`, `time` |

## ⚠️ Disclaimer

This project is not affiliated with Wave Digital Finance. It is an unofficial automation tool. Use it responsibly and ensure you comply with Wave's Terms of Service. Automated access to financial accounts may carry risks.
