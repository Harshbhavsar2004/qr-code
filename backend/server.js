const express = require('express');
const cors = require('cors');

const paymentRoutes = require('./routes/payment.js');

const app = express();

// List of allowed origins
const allowedOrigins = ['https://qr-code-ruby-one.vercel.app/', 'https://qr-code-ruby-one.vercel.app']; // Add more origins as needed

// Configure CORS
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'], // Specify the methods you want to allow
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify the headers you want to allow
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api', paymentRoutes);

app.listen(5000, () => console.log("Server running at http://localhost:5000"));
