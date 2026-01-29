import config from "../app.config.json" with{type: "json"}

export async function sendWebhook(type: string, message: string, store_id: string | null) {
  if (!config.webhook.url || typeof (config.webhook.url) !== "string") {
    return;
  }
  try {
    await fetch(config.webhook.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        store_id,
        message,
        time: Date.now(),
      }),
    });
    console.log(`Webhook sent: ${type} for store ${store_id}`);
  } catch (error: any) {
    console.log(`Failed to send webhook: ${error.message}`);
  }
}