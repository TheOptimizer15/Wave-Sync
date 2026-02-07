import { Controller } from "./controller.js";
import { WaveSyncService } from "../services/wavesync_service.js";

export class WaveSyncController extends Controller{
    constructor(protected service: WaveSyncService) {
        super();
    }

    public async status(store_id: string) {
        const result = await this.service.check_status(store_id);
        return {
            response: result,
            status: result.status
        }
    }
    
    public async getMerchantId(store_id: string) {
        const result = await this.service.get_merchant_id(store_id);
         return {
            response: result,
            status: result.status
        }
    }
}
