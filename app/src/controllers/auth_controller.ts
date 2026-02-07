import { Controller } from "./controller.js";
import { AuthService } from "../services/auth_service.js";

interface LoginCredentials {
    store_id: string;
    phone: string;
    password: string;
    country: string;
}

export class AuthController extends Controller {
    constructor(protected service: AuthService) {
        super();
    }

    public login({ store_id, phone, password, country }: LoginCredentials) {
        try {

            this.service.login({
                store_id,
                phone,
                password,
                country
            })

            return {
                response: {
                    success: true,
                    message: "login process started for the provided store",
                    error: null
                },
                status: 202
            };
        } catch (error: any) {
            return {
                response: {
                    success: false,
                    message: "an unknow error occured",
                    error: error.message
                },
                status: 500
            };
        }
    }
    
    public submit_otp({ store_id, code }: { store_id: string, code: string }) {
        if (!store_id || !code) {
             return {
                response: {
                    success: false,
                    message: "could not handle otp submition",
                    error: "cannot proccess null content"
                },
                status: 422
            }
        }
        
        this.service.submit_otp(store_id, code);
        
        return {
            response: {
                success: true,
                message: "otp submitted successfully",
                error: null
            },
            status: 200
        }
    }

    public async logout() { }

}
