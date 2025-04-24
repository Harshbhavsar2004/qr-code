const express = require('express');
const cors = require('cors');

const paymentRoutes = require('./routes/payment.js');

const app = express();

// Configure CORS
const corsOptions = {
  origin: 'http://localhost:3000', // Replace with your frontend's URL
  methods: ['GET', 'POST'], // Specify the methods you want to allow
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify the headers you want to allow
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api', paymentRoutes);

app.listen(5000, () => console.log("Server running at 5000"));
