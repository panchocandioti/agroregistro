import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoPng from "../multimedia/Logo_AgroRegistro.png";
import { mayusculaInicial } from "./historicoService";

const toNum = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

const fmt2 = (v) => toNum(v).toFixed(2);
const fmt3 = (v) => toNum(v).toFixed(3);

async function loadImageAsDataUrl(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = src;
  });
}

export async function exportResumenAplicacionPDF({
  ordenCarga,
  fechaAplicacion,
  tamboAplicacion,
  trabajoId,
  trabajos,
  proveedorServiciosId,
  proveedorInsumosId,
  proveedores,
  tambos,
  tratamientos,
  nombreArchivo,
}) {
  const provServ = (proveedores || []).find(
    (p) => String(p.id_proveedor) === String(proveedorServiciosId)
  );

  const provIns = (proveedores || []).find(
    (p) => String(p.id_proveedor) === String(proveedorInsumosId)
  );

  const tamboAplic = (tambos || []).find(
    (t) => String(t.id_tambo) === String(tamboAplicacion)
  );

  const nombreTrabajo =
    (trabajos || []).find(
      (t) => String(t.id_trabajo) === String(trabajoId)
    )?.tipo_trabajo || "";

  const esLabranza = String(trabajoId) === "71";

  const formatFechaHora = (date = new Date()) => {
    const d = new Date(date);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  const superficieTotalAplicacion = (tratamientos || []).reduce((acc, t) => {
    const supTrat = (t.lotes || []).reduce((a, l) => a + toNum(l.superficie), 0);
    return acc + supTrat;
  }, 0);

  const map = new Map();
  (tratamientos || []).forEach((t) => {
    (t.insumos || []).forEach((ins) => {
      const key = String(ins.id_insumo);
      const actual = map.get(key) || {
        id_insumo: ins.id_insumo,
        nombre_insumo: ins.nombre_insumo,
        unidad_total: ins.unidad_total,
        cantidad_total: 0,
      };
      actual.cantidad_total += toNum(ins.cantidad_total);
      if (!actual.unidad_total) actual.unidad_total = ins.unidad_total;
      map.set(key, actual);
    });
  });

  const totalesPorInsumo = Array.from(map.values()).sort((a, b) =>
    (a.nombre_insumo || "").localeCompare(b.nombre_insumo || "", "es", {
      sensitivity: "base",
    })
  );

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 12;

  const logoDataUrl = await loadImageAsDataUrl(logoPng);
  const pageWidth = doc.internal.pageSize.width;

  const logoSize = 10;
  const logoX = pageWidth - marginX - logoSize;
  const logoY = 7;

  doc.addImage(logoDataUrl, "PNG", logoX, logoY, logoSize, logoSize);

  doc.setFontSize(14);
  doc.text(`Resumen del trabajo de ${nombreTrabajo}`, marginX, 14);

  autoTable(doc, {
    startY: 18,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 2 },
    margin: { left: marginX, right: marginX },
    head: [["Orden", "Fecha", "Tambo", "Tipo de trabajo"]],
    body: [[
      ordenCarga || "-",
      fechaAplicacion || "-",
      tamboAplic?.nombre_tambo || "-",
      mayusculaInicial(nombreTrabajo) || "-",
    ]],
  });

  let y = doc.lastAutoTable.finalY + 5;

  if (esLabranza) {
    autoTable(doc, {
      startY: y,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: marginX, right: marginX },
      head: [["Prov. servicios"]],
      body: [[provServ?.nombre_proveedor || "-"]],
    });
  } else {
    autoTable(doc, {
      startY: y,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: marginX, right: marginX },
      head: [["Prov. servicios", "Prov. insumos"]],
      body: [[
        provServ?.nombre_proveedor || "-",
        provIns?.nombre_proveedor || "-",
      ]],
    });
  }

  y = doc.lastAutoTable.finalY + 8;

  (tratamientos || []).forEach((t, idx) => {
    const lotes = t.lotes || [];
    const insumos = t.insumos || [];
    const supTrat = lotes.reduce((a, l) => a + toNum(l.superficie), 0);

    if (y > 265) {
      doc.addPage();
      y = 14;
    }

    doc.setFontSize(12);
    doc.text(mayusculaInicial(
      `${nombreTrabajo || "Trabajo"} ${idx + 1} — ${supTrat.toFixed(2)} ha`),
      marginX,
      y
    );
    y += 5;

    if ((t.observaciones || "").trim()) {
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(`Obs: ${t.observaciones}`, 190);
      doc.text(lines, marginX, y);
      y += lines.length * 4 + 2;
    }

    autoTable(doc, {
      startY: y,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: marginX, right: marginX },
      head: [["Lote", "ha"]],
      body: lotes.map((l) => [l.nombre_lote || "", fmt2(l.superficie)]),
    });

    y = doc.lastAutoTable.finalY + 4;

    if (!esLabranza) {
      autoTable(doc, {
        startY: y,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: marginX, right: marginX },
        head: [["Insumo", "Dosis", "Unidad", "Total", "Unidad"]],
        body: insumos.map((ins) => [
          ins.nombre_insumo || "",
          Number.isFinite(parseFloat(ins.dosis)) ? fmt3(ins.dosis) : "",
          ins.unidad_dosis || "",
          fmt2(ins.cantidad_total),
          ins.unidad_total || "",
        ]),
      });

      y = doc.lastAutoTable.finalY + 8;
    } else {
      y += 6;
    }
  });

  if (y > 250) {
    doc.addPage();
    y = 14;
  }

  doc.setFontSize(13);
  doc.text("TOTALES", marginX, y);
  y += 6;

  doc.setFontSize(11);
  doc.text(
    `Superficie total ${nombreTrabajo || "trabajada"}: ${superficieTotalAplicacion.toFixed(2)} ha`,
    marginX,
    y
  );
  y += 4;

  if (!esLabranza) {
    autoTable(doc, {
      startY: y + 2,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: marginX, right: marginX },
      head: [["Insumo", "Cantidad total", "Unidad"]],
      body: totalesPorInsumo.map((x) => [
        x.nombre_insumo || "",
        toNum(x.cantidad_total).toFixed(2),
        x.unidad_total || "",
      ]),
    });
  }

  const totalPages = doc.getNumberOfPages();
  const fechaEmision = formatFechaHora();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    const pageHeight = doc.internal.pageSize.height;
    const pageWidth2 = doc.internal.pageSize.width;

    doc.setFontSize(8);
    doc.setTextColor(100);

    doc.line(12, pageHeight - 15, pageWidth2 - 12, pageHeight - 15);

    doc.text(
      "AgroRegistro - Registro de trabajos agrícolas",
      12,
      pageHeight - 10
    );

    doc.text(
      `Emitido: ${fechaEmision}  |  Página ${i} de ${totalPages}`,
      pageWidth2 - 12,
      pageHeight - 10,
      { align: "right" }
    );
  }

  const fname =
    nombreArchivo || `resumen_trabajo_${fechaAplicacion || "sin_fecha"}.pdf`;

  doc.save(fname);
}