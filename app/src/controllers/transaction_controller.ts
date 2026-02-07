import { Controller } from "./controller.js";
import { TransactionService } from "../services/transaction_service.js";

export class TransactionController extends Controller{
    constructor(protected service: TransactionService) {
        super();
    }
    
    public async getAllTransactions(store_id: string) {
        try {
            const result = await this.service.get_transactions(store_id);
            return {
                response: result,
                status: result.status
            };
        } catch (error: any) {
             return {
                response: {
                    success: false,
                    message: error.message,
                    error: "Internal Server Error"
                },
                status: 500
            };
        }
    }
    
    public async verify(store_id: string, client_reference: string) {
         try {
            const result = await this.service.verify_transaction(store_id, client_reference);
            return {
                response: result,
                status: result.status
            };
        } catch (error: any) {
             return {
                response: {
                    success: false,
                    message: error.message,
                    error: "Internal Server Error"
                },
                status: 500
            };
        }
    }
}
