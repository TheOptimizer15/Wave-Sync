import puppeteer from "puppeteer";
import express from "express";

import { login } from "./login.js";
import { status } from "./status.js";
import { transactions } from "./transactions.js";

// init browser
const browser = await puppeteer.launch({
    headless: true,
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

app.get("/", (req, res)=>{
    res.send("Server has started");
});

app.get("/login", async (req, res) => {
    res.json({
        success: true,
        message: "Process started",
        action: "PORTAL_LOGIN"
    });
    await login(browser, app);

});

app.get("/status", async (req, res) => {
    const response = await status(browser);
    res.json(response);
});

app.get("/transactions", async (req, res) => {
    const response = await transactions(browser);
    res.json(response);
});