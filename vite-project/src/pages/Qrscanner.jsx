import React, { useState } from "react";
import { QrReader } from "react-qr-reader";

export default function QRScanner() {
  const [result, setResult] = useState("");

  const handleScan = async (data) => {
    if (data) {
      const id = data.split("/verify/")[1];
      const res = await fetch(`http://localhost:5000/api/validate/${id}`);
      const json = await res.json();
      setResult(json.valid ? `✅ Welcome ${json.name}` : `❌ ${json.message}`);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>QR Ticket Scanner</h2>
      <QrReader delay={300} onScan={handleScan} onError={console.error} />
      <p>{result}</p>
    </div>
  );
}
