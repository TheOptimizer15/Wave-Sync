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

#### Secure Credential Handling

- **Removed `config.json`** - Credentials are no longer stored in config files
- Phone and password are now passed securely via the `/login` API request body
- Each login request includes `store_id`, `phone`, and `password`

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

**Removed:**

- `config.json` - No longer needed, credentials passed via API
- `config.example.json` - Removed

**Updated `app.config.json`:**

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
- `README.md` - Updated documentation, removed config.json references
- `.gitignore` - Updated for stores folder, removed config.json
- **Deleted:** `config.json`, `config.example.json`

---

### ⚠️ Breaking Changes

- `/transactions` endpoint now requires store_id parameter: `/transactions/:store_id`
- `/status` endpoint now requires store_id parameter: `/status/:store_id`
- Login endpoint now requires `store_id`, `phone`, and `password` in request body
- `config.json` has been removed - migrate credentials to API requests

---

### 🚀 Upgrade Guide

1. **Remove config.json** - Delete your existing config.json file
2. **Update login calls** - Pass credentials in the request body:
   ```json
   {
     "store_id": "my_store",
     "phone": "0123456789",
     "password": "your_password"
   }
   ```
3. **Update API paths** - Add `store_id` to transaction and status URLs
4. **Add webhook options** - Add new alert options to `app.config.json`
5. **Regenerate sessions** - Existing cookies need to be regenerated via login
