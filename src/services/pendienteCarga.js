import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const n = (x) => {
  const v = parseFloat(String(x ?? "").replace(",", "."));
  return Number.isFinite(v) ? v : 0;
};

// Formato: 1 fila x tratamiento x lote x insumo
export function exportPendienteCargaPorAplicacionXlsx({
  aplicacion,          // objeto completo del histórico
  lotesIndex,          // Map(id_lote -> {nombre_lote, ...})  (opcional)
  insumosIndex,        // Map(id_insumo -> {nombre_insumo, ...}) (opcional)
  proveedoresIndex,    // Map(id_proveedor -> {nombre_proveedor, ...}) (opcional)
  nombreArchivo,       // opcional
}) {
  if (!aplicacion) throw new Error("Falta la aplicación.");

  const provServNom =
    proveedoresIndex?.get(aplicacion.id_prov_serv)?.nombre_proveedor ?? aplicacion.id_prov_serv ?? "";
  const provInsNom =
    proveedoresIndex?.get(aplicacion.id_prov_ins)?.nombre_proveedor ?? aplicacion.id_prov_ins ?? "";

  const rows = [];

  const tratamientos = Array.isArray(aplicacion.tratamientos) ? aplicacion.tratamientos : [];

  tratamientos.forEach((t, idxTrat) => {
    const lotes = Array.isArray(t.lotes) ? t.lotes : [];
    const insumos = Array.isArray(t.insumos) ? t.insumos : [];

    lotes.forEach((l) => {
      const haLote = n(l.superficie);

      const loteNom =
        lotesIndex?.get(l.id_lote)?.nombre_lote ?? l.nombre_lote ?? l.id_lote ?? "";

      insumos.forEach((i) => {
        const insNom =
          insumosIndex?.get(i.id_insumo)?.nombre_insumo ?? i.nombre_insumo ?? i.id_insumo ?? "";

        const dosis = n(i.dosis); // puede venir como string
        const cantidadTotalLote =
          haLote > 0 && dosis > 0 ? Number((dosis * haLote).toFixed(2)) : "";

        rows.push({
          id_aplicacion: aplicacion.id_aplicacion,
          fecha_aplicacion: aplicacion.fecha_aplicacion, // YYYY-MM-DD (ideal para sistemas)
          proveedor_servicio: provServNom,
          proveedor_servicio_id: aplicacion.id_prov_serv,
          proveedor_insumos: provInsNom,
          proveedor_insumos_id: aplicacion.id_prov_ins,

          tratamiento_nro: idxTrat + 1,
          observaciones: t.observaciones ?? "",

          lote: loteNom,
          lote_id: l.id_lote,
          hectareas_lote: haLote,

          insumo: insNom,
          insumo_id: i.id_insumo,
          unidad_dosis: i.unidad_dosis ?? "",
          unidad_total: i.unidad_total ?? "",

          dosis: i.dosis ?? "", // dejo string para que no pierdas formato
          cantidad_total_lote: cantidadTotalLote,
        });
      });
    });
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "PENDIENTE_CARGA");

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fname =
    nombreArchivo ||
    `pendiente_carga_${aplicacion.fecha_aplicacion || "sin_fecha"}_${aplicacion.id_aplicacion}.xlsx`;

  saveAs(blob, fname);

  return rows.length; // por si querés mostrar "X filas generadas"
}
