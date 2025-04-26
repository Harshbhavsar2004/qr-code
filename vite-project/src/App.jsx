import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Payment from "./pages/payment";
import QRScanner from "./pages/Qrscanner";
import PdfPreviewer from "./pages/pdf-maker";
import NotSupported from "./pages/not-supported";
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Payment />} />
        <Route path="/scan" element={<QRScanner />} />
        <Route path="/pdf" element={<PdfPreviewer />} />
        <Route path="/not-supported" element={<NotSupported/>}/>
      </Routes>
    </Router>
  );
}
