import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Payment from "./pages/payment";
import QRScanner from "./pages/Qrscanner";

export default function App() {
  return (
    <Router>
      <nav style={{ padding: "1rem", backgroundColor: "#eee" }}>
        <Link to="/" style={{ marginRight: 10 }}>Home</Link>
        <Link to="/scan">Scanner</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Payment />} />
        <Route path="/scan" element={<QRScanner />} />
      </Routes>
    </Router>
  );
}
