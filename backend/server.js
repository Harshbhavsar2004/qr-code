const express = require('express');
const cors = require('cors');

const paymentRoutes = require('./routes/payment.js');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', paymentRoutes);

app.listen(5000, () => console.log("Server running at http://localhost:5000"));
