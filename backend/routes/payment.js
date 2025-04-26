const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { Buffer } = require("buffer");
const fs = require("fs");
const path = require("path");

// Load the template PDF (same directory)
const templatePath = path.join(__dirname, "Music Festival.pdf");
const templateBytes = fs.readFileSync(templatePath);


const router = express.Router();

const razorpay = new Razorpay({
  key_id: "rzp_live_lfqaisJcKJ0oGX",
  key_secret: "TQpBkjoh8mHdorCCOU98SSsA",
});

let tickets = {};

router.post("/create-order", async (req, res) => {
  const { amount } = req.body;
  const order = await razorpay.orders.create({
    amount: amount * 1,
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
    attendees = [],
    package,
    price
  } = req.body;
  console.log("Received verification request with:", {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    name,
    email,
    attendees,
    package,
    price
  });

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expected = crypto
    .createHmac("sha256", "TQpBkjoh8mHdorCCOU98SSsA")
    .update(sign.toString())
    .digest("hex");

  console.log("Expected signature:", expected);
  console.log("Received signature:", razorpay_signature);

  if (expected !== razorpay_signature) {
    console.error("Payment verification failed: Signature mismatch");
    return res.status(400).json({ error: "Payment verification failed: Signature mismatch" });
  }

  const attachments = [];

  for (const [i, attendee] of attendees.entries()) {
    const ticketId = uuidv4();
    tickets[ticketId] = { ...attendee, used: false };
  
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://qr-code-8h8f.vercel.app/api/validate/${ticketId}`;
    const response = await fetch(qrUrl);
    const qrImageBytes = await response.arrayBuffer();
  
    const templatePdf = await PDFDocument.load(templateBytes);
    const qrImage = await templatePdf.embedPng(qrImageBytes);
    const font = await templatePdf.embedFont(StandardFonts.Helvetica);
    const pages = templatePdf.getPages();
    const page = pages[0];
  
    // Add attendee-specific data
    page.drawText(`Name: ${attendee.name || name}`, { x: 20, y: 90, size: 10, font, color: rgb(0, 0, 0) });
    page.drawText(`${price}`, { x: 65, y: 35, size: 12, font, color: rgb(0, 0, 0) });
    // Draw QR code at the bottom
    page.drawImage(qrImage, {
      x: 498 , // adjust x to align properly
      y: 50, // place near the bottom
      width: 100,
      height: 100,
    });
  
    const pdfBytes = await templatePdf.save();
  
    attachments.push({
      filename: `Ticket-${i + 1}-${attendee.name}.pdf`,
      content: Buffer.from(pdfBytes),
      contentType: "application/pdf",
    });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "hbhavsar847@gmail.com",
      pass: "eugp brlu crbq qozu",
    },
  });

  if (attendees.length > 0) {
    const mainContact = attendees[0]; // Get the first attendee
    console.log(mainContact);
    
    await transporter.sendMail({
      from: "hbhavsar847@gmail.com",
      to: mainContact.email || email, // Send to the first attendee or fallback email
      subject: `🎫 Your ${package} Tickets for Summer Music Festival`,
      html: `<p>Hi ${mainContact.name},</p><p>Your tickets for the ${package} package at the Summer Music Festival are attached as PDFs. Show them at entry. Enjoy the show! 🎶</p>`,
      attachments,
    });
  } else {
    console.error("No attendees found to send tickets.");
    return res.status(400).json({ error: "No attendees found to send tickets." });
  }

  res.json({ success: true });
});

router.get("/validate/:ticketId", (req, res) => {
  const ticket = tickets[req.params.ticketId];
  if (!ticket)
    return res.status(404).json({ valid: false, message: "Ticket not found" });
  if (ticket.used)
    return res.json({ valid: false, message: "Ticket already used" });

  ticket.used = true;
  res.json({ valid: true, name: ticket.name });
});

module.exports = router;
