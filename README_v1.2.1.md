# Wave Sync v1.2.1 Patch Notes

## 🔧 Fix: OTP Listener Reliability

This patch specifically addresses race conditions and reliability issues in the OTP (One-Time Password) listener during the login process.

### Problem

In previous versions, the OTP listener could potentially:

- Miss events if multiple login attempts were happening simultaneously.
- Trigger multiple times or for the wrong session if event listeners weren't properly namespaced or cleaned up.
- Cause memory leaks by leaving "aborted" listeners active after a timeout.

### Solution -> `v1.2.1`

We have refactored the OTP listening logic in `src/login.ts` and `src/emitter.ts` to ensuring strict store/session isolation.

#### key Changes:

1.  **Namespaced Events**:
    The `otpEmitter` now listens for specific events tied to the `store_id` (e.g., `otp_store123`) instead of a generic `otp` event. This ensures that an OTP submitted for Store A is never accidentally processed by the login flow for Store B.

    ```typescript
    // Before
    otpEmitter.once("otp", otpListener);

    // After (v1.2.1)
    otpEmitter.once(`otp_${store_id}`, otpListener);
    ```

2.  **Proper Cleanup**:
    We added explicit `.off()` calls in the timeout logic to remove the listener if the OTP isn't received in time. This prevents "zombie" listeners from stacking up in memory.

    ```typescript
    const rejectTimeout = setTimeout(() => {
      // ... failure logic ...
      otpEmitter.off("otp", otpListener); // Cleanup
      reject(new Error("OTP_TIMEOUT"));
    }, appConfig.timeout);
    ```

3.  **One-Time Listeners**:
    We continue to use `.once()` to ensure the listener automatically removes itself after a successful capture, but the added namespacing guarantees it captures the _correct_ event.

### Upgrade Instructions

- No configuration changes are required.
- Simply pull the latest code and rebuild.
