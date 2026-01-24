Here is the updated **README.md** incorporating the complete `country.json` configuration you provided.

---

# Wave Sync

**Wave Sync** is a TypeScript-based API wrapper and automation tool for the Wave Business Portal. It leverages **Puppeteer** to automate browser interactions and **Express** to provide a RESTful API interface. This allows developers to programmatically log in, handle OTPs, check account status, and retrieve transaction history from a Wave Business account.

## 🚀 Features

* **Automated Login:** Handles the login flow for the Wave Business Portal, including country selection and credential entry.
* **OTP Management via API:** Since Wave requires SMS OTPs, this service exposes an endpoint to receive the OTP programmatically and feed it into the automated browser instance.
* **Transaction Scraping:** Intercepts GraphQL network requests to retrieve clean, parsed transaction history (Deposits, Payments, Fees).
* **Status Monitoring:** Checks if the account is currently connected/active.
* **Webhooks:** Sends real-time webhooks for critical events (OTP required, Login success/failure).

## 🛠️ Tech Stack

* **Runtime:** Node.js
* **Language:** TypeScript
* **Browser Automation:** Puppeteer
* **Server:** Express.js

## ⚙️ Installation

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd wave-sync

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

To run this project, you must create three specific JSON configuration files in the root (or `src/` depending on your build setup) directory.

### 1. `config.json`

Contains your sensitive credentials.

```json
{
  "mobile_phone": "0123456789",
  "password": "your_secure_password"
}

```

### 2. `app.config.json`

Controls the application logic and URLs.

```json
{
  "wave_portal_url": "https://business.wave.com/login",
  "wave_transaction_url": "https://business.wave.com/transactions",
  "timeout": 60000,
  "webhook": {
    "url": "https://your-external-webhook-listener.com/events",
    "alert_otp": true,
    "alert_login": true
  }
}

```

### 3. `country.json`

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
# or directly with ts-node
npx ts-node src/main.ts

```

The server defaults to port `3000` (or `process.env.PORT`).

## 📡 API Endpoints

### 1. Start Login Process

Triggers the Puppeteer browser to open and attempt login.

* **URL:** `GET /login`
* **Response:**
```json
{
  "success": true,
  "message": "Process started",
  "action": "PORTAL_LOGIN"
}

```


* **Behavior:** This will keep the browser open. If an OTP is required, it triggers the `otp:required` webhook.

### 2. Submit OTP

If the login process pauses for an OTP, submit the code here.

* **URL:** `POST /otp`
* **Body:**
```json
{ "code": "1234" }

```


* **Response:**
```json
{ "succes": true, "message": "Otp submitted" }

```



### 3. Get Transactions

Retrieves the history of transactions.

* **URL:** `GET /transactions`
* **Response:** Returns a JSON list of transactions, including ID, amount, fees, sender name, and phone.

### 4. Check Status

Checks if the browser session is currently logged in.

* **URL:** `GET /status`
* **Response:**
```json
{
  "success": true,
  "message": "Account connected",
  "status": 200
}

```



## 🪝 Webhook Events

The application sends POST requests to the URL defined in `app.config.json`.

| Event Name | Trigger | Payload Data |
| --- | --- | --- |
| `otp:required` | Login page requested SMS code | `event`, `time`, `time_stamp` |
| `otp:failed` | OTP timed out (approx 4 mins) | `event`, `time`, `time_stamp` |
| `login:success` | Login completed successfully | `event`, `time`, `time_stamp` |
| `login:failed` | Wrong password or other error | `event`, `time`, `message` |

## ⚠️ Disclaimer

This project is not affiliated with Wave Digital Finance. It is an unofficial automation tool. Use it responsibly and ensure you comply with Wave's Terms of Service. Automated access to financial accounts may carry risks.