import { AuthController } from "./controllers/auth_controller.js";
import { TransactionController } from "./controllers/transaction_controller.js";
import { WaveSyncController } from "./controllers/wave_sync_controller.js";
import { bootable } from "../bootstrap/app.js";

import { WaveSyncFileSystem } from "../wavesync/file/WaveSyncFIleSystem.js";
import { WaveSyncBrowser } from "../wavesync/browser/WaveSyncBrowser.js";
import { WaveSyncEvent } from "../wavesync/event/WaveSyncEvent.js";
import { WaveSyncCookie } from "../wavesync/cookie/WaveSyncCookie.js";

import { AuthService } from "./services/auth_service.js";
import { TransactionService } from "./services/transaction_service.js";
import { WaveSyncService } from "./services/wavesync_service.js";

// 1. Instantiate Infrastructure
const fs = new WaveSyncFileSystem();
const browser = new WaveSyncBrowser();
const event = new WaveSyncEvent();
const cookie = new WaveSyncCookie(fs);

// 2. Instantiate Services
const authService = new AuthService(fs, browser, event, cookie);
const transactionService = new TransactionService(fs, browser, cookie);
const storeService = new WaveSyncService(fs, browser, cookie);

// 3. Instantiate Controllers
const authController = new AuthController(authService);
const transactionController = new TransactionController(transactionService);
const waveSyncController = new WaveSyncController(storeService);


const router = bootable.router;

// Routes

// Auth
router.post({
  path: "/login",
  callback: (req, res) => {
    const { store_id, phone, password, country } = req.body
    const response = authController.login({
      store_id,
      phone,
      password,
      country
    });

    res.status(response.status).json(response.response);
  }
});

router.post({
  path: "/otp",
  callback: (req, res) => {
    const { store_id, code } = req.body;
    const response = authController.submit_otp({ store_id, code });
    res.status(response.status).json(response.response);
  }
});

// Transactions
router.get({
    path: "/transactions/:store_id",
    callback: async (req, res) => {
        const { store_id } = req.params;
        const response = await transactionController.getAllTransactions(store_id as string);
        res.status(response.status).json(response.response);
    }
});

router.post({
    path: "/verify/:store_id",
    callback: async (req, res) => {
         const { store_id } = req.params;
         const { client_reference } = req.body;
         const response = await transactionController.verify(store_id as string, client_reference);
         res.status(response.status).json(response.response);
    }
});

// Wave Sync / Store
router.get({
    path: "/status/:store_id",
    callback: async (req, res) => {
        const { store_id } = req.params;
        const response = await waveSyncController.status(store_id as string);
        res.status(response.status).json(response.response);

    }
});

router.get({
    path: "/merchant/:store_id",
    callback: async (req, res) => {
        const { store_id } = req.params;
        const response = await waveSyncController.getMerchantId(store_id as string);
        res.status(response.status).json(response.response);
    }
});
