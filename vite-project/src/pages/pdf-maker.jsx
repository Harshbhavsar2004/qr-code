import React from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const PdfPreviewer = () => {
  const generatePdfPreview = async () => {
    const templateBytes = await fetch("/Music Festival.pdf").then(res => res.arrayBuffer());
    const templatePdf = await PDFDocument.load(templateBytes);
    const font = await templatePdf.embedFont(StandardFonts.Helvetica);
    const pages = templatePdf.getPages();
    const page = pages[0];

    // Add sample data
    page.drawText("Name: Harshal Bhavsar ", { x: 20, y: 90, size: 15, font, color: rgb(0, 0, 0) });
    page.drawText("500", { x: 65, y: 35, size: 12, font, color: rgb(0, 0, 0) });

    const pdfBytes = await templatePdf.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <div>
      <button onClick={generatePdfPreview}>Preview PDF</button>
    </div>
  );
};

export default PdfPreviewer;