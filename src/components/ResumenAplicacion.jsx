import { useMemo } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

const toNum = (v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
};

function ResumenAplicacion({
    fechaAplicacion,
    proveedorServiciosId,
    proveedorInsumosId,
    proveedores,
    tratamientos,
}) {
    const provServ = proveedores?.find(p => String(p.id_proveedor) === String(proveedorServiciosId));
    const provIns = proveedores?.find(p => String(p.id_proveedor) === String(proveedorInsumosId));

    // Superficie total de todos los tratamientos
    const superficieTotalAplicacion = useMemo(() => {
        return (tratamientos || []).reduce((acc, t) => {
            const supTrat = (t.lotes || []).reduce((a, l) => a + toNum(l.superficie), 0);
            return acc + supTrat;
        }, 0);
    }, [tratamientos]);

    // Totales por insumo a nivel aplicación (sumar cantidad_total)
    const totalesPorInsumo = useMemo(() => {
        const map = new Map(); // key: id_insumo

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
                // unidad_total: asumimos consistente; si cambia, más adelante lo manejamos
                map.set(key, actual);
            });
        });

        // ordenar por nombre
        return Array.from(map.values()).sort((a, b) =>
            (a.nombre_insumo || "").localeCompare(b.nombre_insumo || "", "es", { sensitivity: "base" })
        );
    }, [tratamientos]);

    return (
        <div style={{ border: "2px solid #999", padding: "1rem", marginTop: "1rem" }}>
            <h3>Resumen de la aplicación</h3>

            <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                <div><strong>Fecha:</strong> {fechaAplicacion || "-"}</div>
                <div><strong>Prov. servicios:</strong> {provServ?.nombre_proveedor || "-"}</div>
                <div><strong>Prov. insumos:</strong> {provIns?.nombre_proveedor || "-"}</div>
            </div>

            {(tratamientos || []).map((t, idx) => {
                const supTrat = (t.lotes || []).reduce((a, l) => a + toNum(l.superficie), 0);

                return (
                    <div key={idx} style={{ borderTop: "1px solid #ddd", paddingTop: "1rem", marginTop: "1rem" }}>
                        <h5>Tratamiento {idx + 1} — {supTrat.toFixed(2)} ha</h5>

                        {t.observaciones && (
                            <p style={{ marginTop: "0.25rem" }}>
                                <strong>Obs:</strong> {t.observaciones}
                            </p>
                        )}

                        <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
                            {/* Lotes */}
                            <div style={{ minWidth: "280px" }}>
                                <strong>Lotes</strong>
                                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>Lote</th>
                                            <th style={{ textAlign: "right", borderBottom: "1px solid #ccc" }}>ha</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(t.lotes || []).map((l) => (
                                            <tr key={l.id_lote}>
                                                <td>{l.nombre_lote}</td>
                                                <td style={{ textAlign: "right" }}>{toNum(l.superficie).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Insumos */}
                            <div style={{ minWidth: "650px" }}>
                                <strong>Insumos</strong>
                                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>Insumo</th>
                                            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>Dosis</th>
                                            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>Unidad</th>
                                            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>Total</th>
                                            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>Unidad</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(t.insumos || []).map((ins) => (
                                            <tr key={ins.id_insumo}>
                                                <td>{ins.nombre_insumo}</td>
                                                <td style={{ textAlign: "left" }}>{toNum(ins.dosis).toFixed(3) || ""}</td>
                                                <td>{ins.unidad_dosis || ""}</td>
                                                <td style={{ textAlign: "left" }}>{toNum(ins.cantidad_total).toFixed(2)}</td>
                                                <td>{ins.unidad_total || ""}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Totales */}
            <div style={{ borderTop: "2px solid #999", marginTop: "1rem", paddingTop: "1rem" }}>
                <h4>TOTALES</h4>
                <h5><strong>Superficie total aplicada:</strong> {superficieTotalAplicacion.toFixed(2)} ha</h5>

                <h5><strong>Totales por insumo</strong></h5>
                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>Insumo</th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>Cantidad total</th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>Unidad</th>
                        </tr>
                    </thead>
                    <tbody>
                        {totalesPorInsumo.map((x) => (
                            <tr key={x.id_insumo}>
                                <td>{x.nombre_insumo}</td>
                                <td style={{ textAlign: "left" }}>{toNum(x.cantidad_total).toFixed(2)}</td>
                                <td>{x.unidad_total || ""}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ResumenAplicacion;
