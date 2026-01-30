Release Notes

v1.2.1 - OTP Listener Reliability Patch

Release Date: January 30, 2026

🎯 Highlights

This patch addresses a critical race condition in the OTP listener logic. Previous versions used a generic "otp" event which could lead to cross-talk between multiple store login sessions. v1.2.1 namespaces these events by `store_id` to ensure absolute isolation.

✨ Changes

- **Namespaced OTP Events:** OTP listeners now subscribe to `otp_{store_id}` instead of the global `otp` event.
- **Strict Cleanup:** Added explicit removal of event listeners upon timeout to prevent memory leaks.
- **Error Handling:** Improved rejection logic when OTPs timeout.

---

v1.2.0 - High-Reliability Data Interception

Release Date: January 29, 2026

🎯 Highlights

This release fixes the "missing data" issues caused by Wave's background network behavior. We've replaced the single-packet interception with a robust collection stream that merges multiple data shards and ensures type safety across the board.

✨ New Features

Multi-Packet Network Collector

Shard Merging: The system now listens for 5 seconds after triggering a load to collect all GraphQL shards sent by the portal.

Deduplication: Automatic removal of duplicate entries based on unique transaction IDs.

Improved Triggering: Replaced simple input filling with a click-type-enter sequence to better mimic user interaction and force API refreshes.

Robust Transaction Verification

New GET /verify/:store_id/:client_reference endpoint.

Uses the same high-reliability collector to find a specific transaction by its reference.

Full TypeScript Safety

Integrated strict typing using the WaveApiResponse and HistoryEntry interfaces.

Implemented TypeScript type guards to safely handle union types within the transaction stream.

🔧 Improvements

Network Resilience: Increased network timeouts to 60s to handle slow dashboard loads.

Chronological Sorting: All transaction lists are now sorted by actual timestamp (whenEntered) rather than simple list reversal.

Deprecation Fixes: Migrated all network logic to fetchPostData() to align with modern Puppeteer standards.

📝 Files Changed

src/transactions.ts - Switched to Multi-Packet Collector.

src/verify.ts - Refined verification logic with the new collector.

src/transaction.type.ts - Updated interfaces for better type coverage.

README.md - Added documentation for the verification endpoint.

🚀 Upgrade Guide

Pull latest changes.

Re-run npm install to ensure Puppeteer types are up to date.

No breaking changes to the existing API contract; just more reliable data returns.
