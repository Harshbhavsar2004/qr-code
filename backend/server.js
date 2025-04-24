const express = require('express');
const cors = require('cors');

const paymentRoutes = require('./routes/payment.js');

const app = express();

// Configure CORS to allow requests from your frontend URL
const corsOptions = {
  origin: 'https://qr-code-slqs.vercel.app', // Allow this origin
  methods: ['GET', 'POST'], // Specify allowed methods
  credentials: true, // Allow credentials if needed
};

app.use(cors(corsOptions)); // Use the CORS middleware with options
app.use(express.json());

app.use('/api', paymentRoutes);

app.listen(5000, () => console.log("Server running at 5000"));
