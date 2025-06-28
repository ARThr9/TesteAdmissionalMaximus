// src/utils/exportUtils.js
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable"; // Esta linha é crucial para o plugin

export const exportToExcel = (data, fileName, headers) => {
  const mappedData = data.map((item) =>
    headers.reduce((obj, key) => {
      obj[key] = item[key];
      return obj;
    }, {})
  );

  const ws = XLSX.utils.json_to_sheet(mappedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, fileName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const exportToPDF = (headers, data, fileName) => {
  const doc = new jsPDF();
  doc.autoTable({
    // Agora doc.autoTable deve ser uma função
    head: headers,
    body: data,
    startY: 20,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      valign: "middle",
      halign: "left",
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 40 },
      3: { cellWidth: "auto" },
      4: { cellWidth: 40 },
    },
    didDrawPage: function (data) {
      let str = "Página " + doc.internal.getNumberOfPages();
      doc.setFontSize(10);
      doc.text(
        str,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      );
    },
  });
  doc.save(`${fileName}.pdf`);
};
