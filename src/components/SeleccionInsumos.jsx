import { useState } from "react";
import { unidadTotalDesdeUnidadDosis } from "../utils/unidades";

function SeleccionInsumos({
    insumos,
    insumosSeleccionados,
    superficieTotalHa,
    onAgregarInsumo,
    onQuitarInsumo,
    onCambiarDosis,
    onCambiarCantidadTotal,
}) {

    const insumosArr = Array.isArray(insumos) ? insumos : [];
    const seleccionadosArr = Array.isArray(insumosSeleccionados) ? insumosSeleccionados : [];
    const [insumoIdSeleccionado, setInsumoIdSeleccionado] = useState("");

    const idsSeleccionados = seleccionadosArr.map((i) => i.id_insumo);
    const insumosDisponibles = (insumos || [])
        .filter(i => !idsSeleccionados.includes(i.id_insumo))
        .sort((a, b) =>
            a.nombre_insumo.localeCompare(b.nombre_insumo, "es", {
                sensitivity: "base"
            })
        );

    const handleAgregar = () => {
        const insumo = insumosArr.find(
            (i) => String(i.id_insumo) === String(insumoIdSeleccionado)
        );
        if (!insumo) return;

        // Unidad de dosis: si en tu excel se llama distinto, ajustalo acá.
        const unidadDosis =
            insumo.unidad_dosis ||
            insumo.unidadDosis ||
            (insumo.unidad_base ? `${insumo.unidad_base}/ha` : "");

        const unidadTotal = unidadTotalDesdeUnidadDosis(unidadDosis);

        onAgregarInsumo({
            id_insumo: insumo.id_insumo,
            nombre_insumo: insumo.nombre_insumo,
            unidad_dosis: unidadDosis,
            unidad_total: unidadTotal,
            dosis: "",
            cantidad_total: "",
        });

        setInsumoIdSeleccionado("");
    };

    return (
        <div style={{ marginTop: "1rem" }}>
            <h5>Insumos del tratamiento</h5>

            {/* Selector + agregar */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <select
                    value={insumoIdSeleccionado}
                    onChange={(e) => setInsumoIdSeleccionado(e.target.value)}
                >
                    <option value="">Seleccionar insumo</option>
                    {insumosDisponibles.map((i) => (
                        <option key={i.id_insumo} value={i.id_insumo}>
                            {i.nombre_insumo}
                        </option>
                    ))}
                </select>

                <button onClick={handleAgregar} disabled={!insumoIdSeleccionado}>
                    Agregar insumo
                </button>
            </div>

            {/* Lista de insumos agregados */}
            {seleccionadosArr.length > 0 && (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                    {seleccionadosArr.map((ins) => (
                        <div
                            key={ins.id_insumo}
                            style={{ border: "1px solid #ddd", padding: "0.75rem" }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <strong>{ins.nombre_insumo}</strong>
                                <button onClick={() => onQuitarInsumo(ins.id_insumo)}>✕</button>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: "1rem",
                                    flexWrap: "wrap",
                                    marginTop: "0.5rem",
                                    alignItems: "center",
                                }}
                            >
                                {/* Dosis */}
                                <div>
                                    <label>Dosis</label>
                                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                        <input
                                            type="number"
                                            value={ins.dosis}
                                            onChange={(e) =>
                                                onCambiarDosis(ins.id_insumo, e.target.value, superficieTotalHa)
                                            }
                                            style={{ width: "120px" }}
                                        />
                                        <span>{ins.unidad_dosis}</span>
                                    </div>
                                </div>

                                {/* Cantidad total */}
                                <div>
                                    <label>Cantidad total</label>
                                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                        <input
                                            type="number"
                                            value={ins.cantidad_total}
                                            onChange={(e) =>
                                                onCambiarCantidadTotal(
                                                    ins.id_insumo,
                                                    e.target.value,
                                                    superficieTotalHa
                                                )
                                            }
                                            style={{ width: "140px" }}
                                        />
                                        <span>{ins.unidad_total}</span>
                                    </div>
                                </div>

                                {/* Info útil */}
                                <div style={{ fontSize: "0.9rem", opacity: 0.75 }}>
                                    Superficie: <strong>{Number(superficieTotalHa || 0).toFixed(2)}</strong> ha
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SeleccionInsumos;
