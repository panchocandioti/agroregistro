import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const toNum = (x) => {
  if (x == null) return 0;
  const v = parseFloat(String(x).replace(",", "."));
  return Number.isFinite(v) ? v : 0;
};

const resolverTrabajo = ({ idTrabajo, trabajosIndex, trabajos }) => {
  if (idTrabajo == null || idTrabajo === "") return null;

  // 1) Intento por índice, con varias formas de clave
  const desdeIndex =
    trabajosIndex?.get(idTrabajo) ??
    trabajosIndex?.get(String(idTrabajo)) ??
    trabajosIndex?.get(Number(idTrabajo));

  if (desdeIndex) return desdeIndex;

  // 2) Fallback por array, por si el índice vino mal armado
  const desdeArray = (trabajos || []).find(
    (t) =>
      String(t.id_trabajo) === String(idTrabajo) ||
      Number(t.id_trabajo) === Number(idTrabajo)
  );

  return desdeArray || null;
};

// Formato: 1 fila x tratamiento x lote x insumo
export function exportPendienteCargaPorAplicacionXlsx({
  aplicacion,
  tambosIndex,
  lotesIndex,
  insumosIndex,
  proveedoresIndex,
  trabajosIndex,
  trabajos, // <-- NUEVO fallback opcional
  nombreArchivo,
}) {
  if (!aplicacion) throw new Error("Falta la aplicación.");

  const idProvServ = String(aplicacion.id_prov_serv ?? "");
  const idProvIns = String(aplicacion.id_prov_ins ?? "");
  const idTrabajo = aplicacion.id_trabajo ?? "";

  // Proveedores
  const nombre_prov_serv =
    proveedoresIndex?.get(idProvServ)?.nombre_proveedor ??
    aplicacion.id_prov_serv ??
    "";

  const nombre_prov_ins =
    proveedoresIndex?.get(idProvIns)?.nombre_proveedor ??
    aplicacion.id_prov_ins ??
    "";

  // Tambo
  const id_tambo = String(aplicacion.tambo_aplicacion ?? "");
  const tamboCat = tambosIndex?.get(id_tambo);
  const nombre_tambo = tamboCat?.nombre_tambo ?? id_tambo ?? "";
  const codigo_tambo = tamboCat?.codigo_tambo ?? "";

  // Trabajo
  const trabajoCat = resolverTrabajo({
    idTrabajo,
    trabajosIndex,
    trabajos,
  });

  const tipo_trabajo = trabajoCat?.tipo_trabajo ?? "";

  const rows = [];
  const tratamientos = Array.isArray(aplicacion.tratamientos)
    ? aplicacion.tratamientos
    : [];

  tratamientos.forEach((t, idxTrat) => {
    const lotes = Array.isArray(t.lotes) ? t.lotes : [];
    const insumos = Array.isArray(t.insumos) ? t.insumos : [];

    const lotesIter = lotes.length ? lotes : [null];
    const insumosIter = insumos.length ? insumos : [null];

    lotesIter.forEach((l) => {
      const id_lote = String(l?.id_lote ?? "");
      const loteCat = lotesIndex?.get(id_lote);

      const nombre_lote =
        loteCat?.nombre_lote ?? l?.nombre_lote ?? id_lote ?? "";

      const cultivo = loteCat?.cultivo ?? "";
      const id_cultivo = loteCat?.id_cultivo ?? "";

      const tratamiento_superficie_lote = l ? toNum(l.superficie) : 0;

      insumosIter.forEach((i) => {
        const id_insumo = String(i?.id_insumo ?? "");
        const insCat = insumosIndex?.get(id_insumo);

        const nombre_insumo =
          insCat?.nombre_insumo ?? i?.nombre_insumo ?? id_insumo ?? "";

        const tratamiento_insumo_dosis = i ? toNum(i.dosis) : 0;

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
          id_prov_ins: idProvIns,

          nombre_prov_serv,
          id_prov_serv: idProvServ,

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

          tratamiento_superficie_lote,
          tratamiento_insumo_dosis,
          tratamiento_insumo_cantidad_lote,

          unidad_dosis: i?.unidad_dosis ?? "",
          unidad_total: i?.unidad_total ?? "",

          tipo_trabajo,
          id_trabajo: idTrabajo === "" ? "" : Number(idTrabajo),
        });
      });
    });
  });

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
    "tipo_trabajo",
    "id_trabajo",
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header });

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