import puppeteer from "puppeteer";
import express from "express";

import { login } from "./login.js";
import { status } from "./status.js";
import { transactions } from "./transactions.js";
import { otpEmitter } from "./emitter.js";

// init browser
const browser = await puppeteer.launch({
    headless: false,
    slowMo: 50
});

// init express
const PORT = process.env.PORT || 3000
const app = express();
app.listen(PORT, () => {
    console.log(`Server started on PORT : ${PORT}`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.get("/", (req, res) => {
    res.json({
        status: true,
        message: "Server is up and running"
    });
});

app.get("/login", async (req, res) => {
    res.status(202).json({
        success: true,
        message: "Process started",
        action: "PORTAL_LOGIN"
    });
    await login(browser, app);

});

app.post("/otp", (req, res) => {
    const { code } = req.body

    if (!code) {
        res.status(422).json({
            success: false,
            message: "Not not provided"
        });
    }

    console.log("Otp submited")
    otpEmitter.emit("otp", code);
    res.status(202).json({
        succes: true,
        message: "Otp submitted"
    })

});

app.get("/status", async (req, res) => {
    const response = await status(browser);
    res.status(response.status).json(response);
});

app.get("/transactions", async (req, res) => {
    const response = await transactions(browser);
    res.json(response);
});