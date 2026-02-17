import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const toNum = (x) => {
  if (x == null) return 0;
  const v = parseFloat(String(x).replace(",", "."));
  return Number.isFinite(v) ? v : 0;
};

// Formato: 1 fila x tratamiento x lote x insumo
export function exportPendienteCargaPorAplicacionXlsx({
  aplicacion,
  tambosIndex,
  lotesIndex,
  insumosIndex,
  proveedoresIndex,
  nombreArchivo,
}) {
  if (!aplicacion) throw new Error("Falta la aplicación.");

  // Proveedores
  const nombre_prov_serv =
    proveedoresIndex?.get(aplicacion.id_prov_serv)?.nombre_proveedor ??
    aplicacion.id_prov_serv ??
    "";

  const nombre_prov_ins =
    proveedoresIndex?.get(aplicacion.id_prov_ins)?.nombre_proveedor ??
    aplicacion.id_prov_ins ??
    "";

  // Tambo (en JSON: tambo_aplicacion es el ID)
  const id_tambo = aplicacion.tambo_aplicacion ?? "";
  const tamboCat = tambosIndex?.get(id_tambo);
  const nombre_tambo = tamboCat?.nombre_tambo ?? id_tambo ?? "";
  const codigo_tambo = tamboCat?.codigo_tambo ?? "";

  const rows = [];
  const tratamientos = Array.isArray(aplicacion.tratamientos) ? aplicacion.tratamientos : [];

  tratamientos.forEach((t, idxTrat) => {
    const lotes = Array.isArray(t.lotes) ? t.lotes : [];
    const insumos = Array.isArray(t.insumos) ? t.insumos : [];

    // Si faltan lotes o insumos, genero filas “vacías” para no perder el tratamiento
    const lotesIter = lotes.length ? lotes : [null];
    const insumosIter = insumos.length ? insumos : [null];

    lotesIter.forEach((l) => {
      const id_lote = l?.id_lote ?? "";
      const loteCat = lotesIndex?.get(id_lote);

      const nombre_lote =
        loteCat?.nombre_lote ?? l?.nombre_lote ?? id_lote ?? "";

      // cultivo / id_cultivo del catálogo de lotes
      const cultivo = loteCat?.cultivo ?? "";
      const id_cultivo = loteCat?.id_cultivo ?? "";

      // ✅ 1) Superficie por lote + nuevo encabezado
      const tratamiento_superficie_lote = l ? toNum(l.superficie) : 0;

      insumosIter.forEach((i) => {
        const id_insumo = i?.id_insumo ?? "";
        const insCat = insumosIndex?.get(id_insumo);

        const nombre_insumo =
          insCat?.nombre_insumo ?? i?.nombre_insumo ?? id_insumo ?? "";

        // Dosis numérica
        const tratamiento_insumo_dosis = i ? toNum(i.dosis) : 0;

        // ✅ 2) Cantidad aplicada al lote (dosis * superficie_lote) + nuevo encabezado
        const bruto =
          Number(tratamiento_insumo_dosis * tratamiento_superficie_lote);

        const tratamiento_insumo_cantidad_lote =
          tratamiento_superficie_lote > 0 && tratamiento_insumo_dosis > 0
            ? Math.round(bruto * 10) / 10
            : 0;

        rows.push({
          id_aplicacion: aplicacion.id_aplicacion,
          idx_tratamiento: idxTrat,

          orden_carga: aplicacion.orden_carga ?? "",
          fecha_aplicacion: aplicacion.fecha_aplicacion ?? "",

          nombre_prov_ins,
          id_prov_ins: aplicacion.id_prov_ins ?? "",

          nombre_prov_serv,
          id_prov_serv: aplicacion.id_prov_serv ?? "",

          observaciones_aplicacion: t?.observaciones ?? "",

          nombre_tambo,
          id_tambo,
          codigo_tambo,

          nombre_lote,
          id_lote,
          cultivo,
          id_cultivo,

          nombre_insumo,
          id_insumo,

          // ✅ nuevos nombres
          tratamiento_superficie_lote,
          tratamiento_insumo_dosis,
          tratamiento_insumo_cantidad_lote,

          unidad_dosis: i?.unidad_dosis ?? "",
          unidad_total: i?.unidad_total ?? "",
        });
      });
    });
  });

  // ✅ Header en el orden exacto con los nuevos nombres
  const header = [
    "id_aplicacion",
    "idx_tratamiento",
    "orden_carga",
    "fecha_aplicacion",
    "nombre_prov_ins",
    "id_prov_ins",
    "nombre_prov_serv",
    "id_prov_serv",
    "observaciones_aplicacion",
    "nombre_tambo",
    "id_tambo",
    "codigo_tambo",
    "nombre_lote",
    "id_lote",
    "cultivo",
    "id_cultivo",
    "nombre_insumo",
    "id_insumo",
    "tratamiento_superficie_lote",
    "tratamiento_insumo_dosis",
    "tratamiento_insumo_cantidad_lote",
    "unidad_dosis",
    "unidad_total",
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header });

  // (opcional) autoajuste de columnas (si lo estabas usando)
  const colWidths = header.map((col) => {
    let maxLen = col.length;
    rows.forEach((row) => {
      const val = row[col];
      const len = val == null ? 0 : String(val).length;
      if (len > maxLen) maxLen = len;
    });
    return { wch: Math.min(maxLen + 2, 60) };
  });
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "PENDIENTE_CARGA");

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fname =
    nombreArchivo ||
    `pendiente_carga_${aplicacion.fecha_aplicacion || "sin_fecha"}_${aplicacion.id_aplicacion}.xlsx`;

  saveAs(blob, fname);

  return rows.length;
}
