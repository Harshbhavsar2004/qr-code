const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");

const router = express.Router();

const razorpay = new Razorpay({
  key_id: "rzp_live_x0HMOJCEo5eIlI",
  key_secret: "WB57Onehuwx6UHEhmZ32jmng"
});

let tickets = {};

router.post("/create-order", async (req, res) => {
  const { amount } = req.body;
  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  });
  res.json({ order });
});

router.post("/verify-payment", async (req, res) => {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      name,
      email,
      attendees = []
    } = req.body;
  
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expected = crypto
      .createHmac("sha256", "WB57Onehuwx6UHEhmZ32jmng")
      .update(sign.toString())
      .digest("hex");
  
    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: "Payment verification failed" });
    }
  
    const ticketEntries = attendees.map((attendee) => {
      const ticketId = uuidv4();
      tickets[ticketId] = { ...attendee, used: false };
  
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=http://localhost:3000/verify/${ticketId}`;
      return {
        name: attendee.name,
        email: attendee.email,
        qrUrl
      };
    });
  
    const htmlContent = `
      <h2>Hi ${name},</h2>
      <p>Thanks for booking tickets to the Summer Music Festival 🎶. Below are your ticket details:</p>
      ${ticketEntries
        .map(
          (entry, i) => `
          <div style="margin-bottom: 20px;">
            <strong>Ticket #${i + 1} - ${entry.name}</strong><br />
            <img src="${entry.qrUrl}" alt="QR Code" /><br />
          </div>`
        )
        .join("")}
      <p>Please show these QR codes at the entry gate.</p>
    `;
  
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "hbhavsar847@gmail.com",
        pass: "eugp brlu crbq qozu"
      }
    });
  
    await transporter.sendMail({
      from: "hbhavsar847@gmail.com",
      to: email, // Only to the main contact
      subject: "🎫 Your Concert Tickets for Summer Music Festival",
      html: htmlContent
    });
  
    res.json({ success: true });
  });
  

router.get("/validate/:ticketId", (req, res) => {
  const ticket = tickets[req.params.ticketId];
  if (!ticket) return res.status(404).json({ valid: false, message: "Ticket not found" });
  if (ticket.used) return res.json({ valid: false, message: "Ticket already used" });

  ticket.used = true;
  res.json({ valid: true, name: ticket.name });
});

module.exports = router;
