import SeleccionLotes from "./SeleccionLotes";
import SeleccionInsumos from "./SeleccionInsumos";

function Tratamiento({ numero, tratamiento, setTratamiento, lotes, insumos }) {

    const setObservaciones = (texto) => {
        setTratamiento(prev => ({
            ...prev,
            observaciones: texto
        }));
    };

    const agregarLote = (loteTratamiento) => {
        setTratamiento(prev => ({
            ...prev,
            lotes: [
                ...(Array.isArray(prev.lotes) ? prev.lotes : []),
                loteTratamiento
            ]
        }));
    };

    const quitarLote = (idLote) => {
        setTratamiento(prev => ({
            ...prev,
            lotes: prev.lotes.filter(l => l.id_lote !== idLote)
        }));
    };

    const lotesTratamiento = Array.isArray(tratamiento.lotes)
        ? tratamiento.lotes
        : [];

    const superficieTotal = lotesTratamiento.reduce(
        (acc, l) => acc + (parseFloat(l.superficie) || 0),
        0
    );

    const cambiarSuperficieLote = (idLote, nuevaSuperficie) => {
        setTratamiento(prev => ({
            ...prev,
            lotes: (prev.lotes || []).map(l =>
                l.id_lote === idLote ? { ...l, superficie: nuevaSuperficie } : l
            )
        }));
    };

    const agregarInsumo = (nuevo) => {
        setTratamiento((prev) => ({
            ...prev,
            insumos: [...(prev.insumos || []), nuevo],
        }));
    };

    const quitarInsumo = (idInsumo) => {
        setTratamiento((prev) => ({
            ...prev,
            insumos: (prev.insumos || []).filter((i) => i.id_insumo !== idInsumo),
        }));
    };

    const cambiarDosis = (idInsumo, dosisStr, ha) => {
        const dosis = parseFloat(dosisStr);
        const hectareas = parseFloat(ha) || 0;

        setTratamiento((prev) => ({
            ...prev,
            insumos: (prev.insumos || []).map((i) => {
                if (i.id_insumo !== idInsumo) return i;

                const cantidadTotal =
                    hectareas > 0 && !Number.isNaN(dosis) ? (dosis * hectareas).toFixed(2) : "";

                return {
                    ...i,
                    dosis: dosisStr,
                    cantidad_total: cantidadTotal === "" ? "" : String(cantidadTotal),
                };
            }),
        }));
    };

    const cambiarCantidadTotal = (idInsumo, totalStr, ha) => {
        const total = parseFloat(totalStr);
        const hectareas = parseFloat(ha) || 0;

        setTratamiento((prev) => ({
            ...prev,
            insumos: (prev.insumos || []).map((i) => {
                if (i.id_insumo !== idInsumo) return i;

                const dosis =
                    hectareas > 0 && !Number.isNaN(total) ? (total / hectareas).toFixed(3) : "";

                return {
                    ...i,
                    cantidad_total: totalStr,
                    dosis: dosis === "" ? "" : String(dosis),
                };
            }),
        }));
    };

    return (
        <div style={{ border: "1px solid #ccc", padding: "1rem", marginBottom: "1rem" }}>
            <h4>Tratamiento {numero}</h4>

            <div style={{ marginTop: "0.75rem" }}>
                <label>Observaciones</label><br />
                <textarea
                    rows={3}
                    style={{ width: "100%" }}
                    value={tratamiento.observaciones || ""}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Ej: Objetivo del tratamiento, condiciones de aplicación, otras..."
                />
            </div>

            <SeleccionLotes
                lotes={lotes}
                lotesSeleccionados={lotesTratamiento}
                onAgregarLote={agregarLote}
                onQuitarLote={quitarLote}
                onCambiarSuperficie={cambiarSuperficieLote}
            />

            {lotesTratamiento.length > 0 && (
                <div style={{ marginTop: "1rem", fontWeight: "bold" }}>
                    Superficie total: {superficieTotal.toFixed(2)} ha
                </div>
            )}

            <SeleccionInsumos
                insumos={insumos}                // catálogo de insumos
                insumosSeleccionados={tratamiento.insumos || []}
                superficieTotalHa={superficieTotal}
                onAgregarInsumo={agregarInsumo}
                onQuitarInsumo={quitarInsumo}
                onCambiarDosis={cambiarDosis}
                onCambiarCantidadTotal={cambiarCantidadTotal}
            />

        </div>
    );
}

export default Tratamiento;
