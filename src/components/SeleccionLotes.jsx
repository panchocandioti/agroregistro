import { useState } from "react";

function SeleccionLotes({ lotes, lotesSeleccionados, onAgregarLote, onQuitarLote, onCambiarSuperficie }) {

    const [loteIdSeleccionado, setLoteIdSeleccionado] = useState("");

    const idsSeleccionados = lotesSeleccionados.map(l => l.id_lote);

    const lotesDisponibles = (lotes || [])
        .filter(l => !idsSeleccionados.includes(l.id_lote))
        .sort((a, b) =>
            a.nombre_lote.localeCompare(b.nombre_lote, "es", {
                sensitivity: "base"
            })
        );

    const handleAgregar = () => {
        const lote = lotes.find(l => l.id_lote === loteIdSeleccionado);
        if (!lote) return;

        onAgregarLote({
            id_lote: lote.id_lote,
            nombre_lote: lote.nombre_lote,
            superficie: lote.superficie_ha
        });

        setLoteIdSeleccionado("");
    };

    return (
        <div>
            {/* Selector */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <select
                    value={loteIdSeleccionado}
                    onChange={e => setLoteIdSeleccionado(e.target.value)}
                >
                    <option value="">Seleccionar lote</option>
                    {lotesDisponibles.map(l => (
                        <option key={l.id_lote} value={l.id_lote}>
                            {l.nombre_lote}
                        </option>
                    ))}
                </select>

                <button
                    onClick={handleAgregar}
                    disabled={!loteIdSeleccionado}
                >
                    Agregar lote
                </button>
            </div>

            {/* Lotes seleccionados */}
            {lotesSeleccionados.length > 0 && (
                <ul style={{ paddingLeft: "1rem" }}>
                    {lotesSeleccionados.map(l => (
                        <li key={l.id_lote}>
                            <strong>{l.nombre_lote}</strong>{" "}
                            <input
                                type="number"
                                style={{ width: "110px", marginLeft: "0.5rem" }}
                                value={l.superficie}
                                onChange={(e) => onCambiarSuperficie(l.id_lote, e.target.value)}
                            />{" "}
                            ha

                            <button
                                style={{ marginLeft: "0.5rem" }}
                                onClick={() => onQuitarLote(l.id_lote)}
                            >
                                ✕
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default SeleccionLotes;
