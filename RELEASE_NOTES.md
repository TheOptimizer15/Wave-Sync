# Release Notes

## v1.1.0 - Multi-Store Session Management

**Release Date:** January 27, 2026

### 🎯 Highlights

This release introduces a complete session management system with support for multiple Wave Business accounts, persistent cookie storage, and enhanced webhook notifications.

---

### ✨ New Features

#### Store-Based Session Management

- Each store now has its own session cookie stored in `stores/{store_id}.json`
- Sessions are automatically loaded and injected into browser requests
- Supports multiple Wave Business accounts simultaneously

#### New API Endpoints

- `GET /transactions/:store_id` - Get transactions for a specific store
- `GET /status/:store_id` - Check connection status for a specific store
- `DELETE /disconnect/:store_id` - Remove session cookie and disconnect a store

#### Enhanced Webhook Alerts

- `alert_no_config` - Triggered when a store's config file is not found
- `alert_session_expired` - Triggered when a session cookie has expired or is invalid

#### Transaction Data Enhancement

- Added `client_reference` field to transaction response data

---

### 🔧 Improvements

- Cookie injection now uses secure cookies with proper domain configuration
- Better error handling with descriptive messages for missing configs and expired sessions
- Updated console output to show all available endpoints on server startup

---

### 📁 Configuration Changes

Add the following new options to your `app.config.json`:

```json
{
  "webhook": {
    "alert_no_config": true,
    "alert_session_expired": true
  }
}
```

---

### 📝 Files Changed

- `src/main.ts` - Added disconnect endpoint and store_id routing
- `src/transactions.ts` - Added cookie loading, injection, and webhook alerts
- `src/status.ts` - Added cookie loading, injection, and webhook alerts
- `src/cookie.ts` - Added ESM path resolution and delete_cookie function
- `app.config.json` - Added new webhook alert options
- `README.md` - Updated documentation for v1.1.0
- `.gitignore` - Added stores folder (except demo file)

---

### ⚠️ Breaking Changes

- `/transactions` endpoint now requires store_id parameter: `/transactions/:store_id`
- `/status` endpoint now requires store_id parameter: `/status/:store_id`
- Login endpoint now requires `store_id` in request body

---

### 🚀 Upgrade Guide

1. Update your API calls to include `store_id` in the URL path
2. Add `store_id` to your login request body
3. Add new webhook options to `app.config.json` if you want session alerts
4. Existing session cookies will need to be regenerated via login
