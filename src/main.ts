import express, { Request, Response } from "express";
import puppeteer, { Browser } from "puppeteer";
import { login } from "./login.js";
import { transactions } from "./transactions.js";
import { status } from "./status.js";
import { otpEmitter } from "./emitter.js";
import { delete_cookie } from "./cookie.js";
import { verifyTransaction } from "./verify.js";

const app = express();
app.use(express.json());

// launch browser to maintain session active
const browser = puppeteer.launch({
  slowMo: 50
});

// create routes for user to login
app.post("/login", (req, res) => {
  const { password, country, phone, store_id } = req.body;
  if (!password || !country || !phone || !store_id) {
    res.status(422).json({
      status: false,
      message: "All required data have not been provided"
    })
    return;
  }

  login(store_id, phone, password, country);

  res.status(202).json({
    sucess: true,
    message: "Login process started"
  })

});


// otp event
app.post("/otp", (req, res) => {
  const { code } = req.body;
  if (!code) {
    res.status(422).json({
      status: false,
      mesasge: "OTP not provided"
    })
    return;
  }

  otpEmitter.emit("otp", code);

  res.send(200).json({
    status: true,
    message: "OTP submitted"
  })
})

// transactions 
app.get("/transactions/:store_id", async (req, res) => {
  const { store_id } = req.params;
  if (!store_id) {
    res.status(422).json({
      status: false,
      message: "Store id not provided"
    })
    return;
  }

  const response = await transactions(store_id);
  res.status(200).json(response)
})

app.get("/verify/:store_id/:transaction_id", async (req, res) => {
  const { store_id, transaction_id } = req.params;

  if (!store_id || !transaction_id) {
    res.status(422).json({
      status: false,
      message: "Store or transaction id not provided"
    })
    return;
  }

  const response = await verifyTransaction(store_id, transaction_id);
  res.status(response.status).json(response)
});

app.get("/status/:store_id", async (req, res) => {
  const { store_id } = req.params;
  if (!store_id) {
    res.status(422).json({
      status: false,
      message: "Store id not provided"
    })
    return;
  }

  const response = await status(store_id);
  res.json(response.status).json(response)
})

app.get("/disconnect/:store_id", async (req, res) => {
  const { store_id } = req.params;
  if (!store_id) {
    res.status(422).json({
      status: false,
      message: "Store id not provided"
    })
    return;
  }

  const response = await delete_cookie(store_id);
  if (response) {
    res.json({
      success: true,
      message: "Account sucessfully deleted"
    })
  }
})

const PORT = process.env.PORT || 3000;

// start the server
app.listen(PORT, () => {
  console.log("Server started on port ", PORT);
});

