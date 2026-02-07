import path from "path";
import { WaveSyncFIleSystem } from "../../wavesync/contracts/WaveSyncFIleSystem.js";

type WebhookAlertType = {
  type: "login:failed" | "login:success" | "otp:failed" | "otp:required" | "config:failed";
  message: string | null;
  store_id: string | null | undefined;
}

type StoreConfigFileType = {
  store_id: string;
  webhook_url: string;
  login_alert: boolean;
  otp_alert: boolean;
}
export abstract class Service {
  constructor(protected filesystem: WaveSyncFIleSystem) { }

   async send_webhook({ type, message, store_id }: WebhookAlertType) {
    if (!store_id) return;

    const store_config_file = `../store_config/${store_id}.json`;

    if (!(await this.filesystem.file_exists(store_config_file))) {
      return;
    }

    try {
      const file = await this.filesystem.load_file(store_config_file);
      const parsed_config_file: StoreConfigFileType = JSON.parse(file);

      const should_send = this.can_send_alert(type, parsed_config_file);

      if (!should_send) {
        return;
      }

      await this.request_webhook(parsed_config_file.webhook_url, {
        type,
        message,
        store_id,
      });

    } catch (error: any) {
      console.error(`Webhook Logic Error: ${error.message}`);
    }
  }

  /**
   * Maps WebhookAlertType to StoreConfigFileType boolean flags
   */
  private can_send_alert(type: WebhookAlertType["type"], config: StoreConfigFileType): boolean {
    const alert_map: Record<WebhookAlertType["type"], keyof StoreConfigFileType> = {
      "login:failed": "login_alert",
      "login:success": "login_alert",
      "otp:failed": "otp_alert",
      "otp:required": "otp_alert",
      "config:failed": "login_alert",
    };

    const config_key = alert_map[type];

    return config[config_key as keyof StoreConfigFileType] !== false;
  }

  private async request_webhook(url: string, body: WebhookAlertType) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.log("Request failed, status", response.status)
      }
    } catch (error: any) {
      console.log(`Fetch Error: ${error.message}`);
    }
  }
}