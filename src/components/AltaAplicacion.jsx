import { useEffect, useState } from "react";
import Tratamiento from "./Tratamiento";
import ResumenAplicacion from "./ResumenAplicacion";

function AltaAplicacion({
    lotes,
    insumos,
    proveedores,

    // ✅ nuevo
    modo = "alta", // "alta" | "edicion"
    aplicacionInicial = null, // objeto completo desde histórico
    onConfirmar, // (aplicacion) => void

    // ✅ compatibilidad con tu implementación actual
    onGuardarAplicacion, // (aplicacionNueva) => void

    // opcional, para cerrar editor desde histórico
    onCancelar,
}) {
    const [fechaAplicacion, setFechaAplicacion] = useState("");
    const [proveedorInsumos, setProveedorInsumos] = useState("");
    const [proveedorServicios, setProveedorServicios] = useState("");

    const [mostrarResumenAplicacion, setMostrarResumenAplicacion] = useState(false);

    const [tratamientos, setTratamientos] = useState([
        { lotes: [], insumos: [], observaciones: "" },
    ]);

    // ✅ para edición: mantener identidad
    const [idAplicacion, setIdAplicacion] = useState("");
    const [createdAt, setCreatedAt] = useState("");

    // ✅ Precarga cuando abrís en modo edición
    useEffect(() => {
        if (modo !== "edicion" || !aplicacionInicial) return;

        setIdAplicacion(aplicacionInicial.id_aplicacion || "");
        setCreatedAt(aplicacionInicial.created_at || "");

        setFechaAplicacion(aplicacionInicial.fecha_aplicacion || "");
        setProveedorServicios(aplicacionInicial.id_prov_serv || "");
        setProveedorInsumos(aplicacionInicial.id_prov_ins || "");

        setTratamientos(
            Array.isArray(aplicacionInicial.tratamientos) && aplicacionInicial.tratamientos.length > 0
                ? aplicacionInicial.tratamientos
                : [{ lotes: [], insumos: [], observaciones: "" }]
        );

        // opcional: abrir resumen al entrar
        setMostrarResumenAplicacion(true);
    }, [modo, aplicacionInicial]);

    const agregarTratamiento = () => {
        setTratamientos((prev) => [
            ...prev,
            { lotes: [], insumos: [], observaciones: "" }, // ✅ consistente
        ]);
    };

    const quitarTratamiento = (index) => {
        setTratamientos((prev) => prev.filter((_, i) => i !== index));
    };

    const handleMostrarResumen = () => {
        setMostrarResumenAplicacion((x) => !x);
    };

    const confirmarGuardar = () => {
        const now = new Date().toISOString();
        const idNuevo = `${now}_${Math.random().toString(16).slice(2, 8)}`;

        const aplicacion = {
            // ✅ si es edición, mantenemos id/created_at
            id_aplicacion: modo === "edicion" ? idAplicacion : idNuevo,
            created_at: modo === "edicion" ? createdAt : now,

            fecha_aplicacion: fechaAplicacion,
            id_prov_serv: proveedorServicios,
            id_prov_ins: proveedorInsumos,
            tratamientos,
        };

        const cb = onConfirmar || onGuardarAplicacion;
        if (typeof cb === "function") cb(aplicacion);

        if (modo === "edicion") {
            alert("Cambios guardados y archivo actualizado descargado ✅");
            // cerrar editor si lo estás usando desde histórico
            if (typeof onCancelar === "function") onCancelar();
            return;
        }

        // modo alta (como hoy)
        alert("Aplicación guardada y archivo actualizado descargado ✅");
        setFechaAplicacion("");
        setProveedorInsumos("");
        setProveedorServicios("");
        setTratamientos([{ lotes: [], insumos: [], observaciones: "" }]);
        handleMostrarResumen();
    };

    const tratamientosCompletos = tratamientos.length > 0 && tratamientos.every(t =>
        (t.lotes?.length || 0) > 0 && (t.insumos?.length || 0) > 0
    );

    return (
        <div style={{ border: "1px solid #ccc", padding: "1rem", marginTop: "1rem" }}>
            <div style={{ border: "2px solid #999", padding: "1rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                    <h3 style={{ margin: 0 }}>
                        {modo === "edicion" ? "Editar aplicación" : "Datos de la aplicación"}
                    </h3>

                    {modo === "edicion" && (
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onCancelar}>
                            Cancelar edición
                        </button>
                    )}
                </div>

                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
                    {/* Fecha */}
                    <div>
                        <label>Fecha</label><br />
                        <input
                            type="date"
                            value={fechaAplicacion}
                            onChange={(e) => setFechaAplicacion(e.target.value)}
                        />
                    </div>

                    {/* Proveedor insumos */}
                    <div>
                        <label>Proveedor de insumos</label><br />
                        <select
                            value={proveedorInsumos}
                            onChange={(e) => setProveedorInsumos(e.target.value)}
                        >
                            <option value="">Seleccionar</option>
                            {proveedores.map((p) => (
                                <option key={p.id_proveedor} value={p.id_proveedor}>
                                    {p.nombre_proveedor}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Proveedor servicios */}
                    <div>
                        <label>Proveedor de servicios</label><br />
                        <select
                            value={proveedorServicios}
                            onChange={(e) => setProveedorServicios(e.target.value)}
                        >
                            <option value="">Seleccionar</option>
                            {proveedores.map((p) => (
                                <option key={p.id_proveedor} value={p.id_proveedor}>
                                    {p.nombre_proveedor}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {fechaAplicacion && proveedorInsumos && proveedorServicios && (
                <div>
                    <h3>Tratamientos</h3>

                    {tratamientos.map((tratamiento, index) => (
                        <div key={index}>
                            <Tratamiento
                                numero={index + 1}
                                tratamiento={tratamiento}
                                setTratamiento={(fn) =>
                                    setTratamientos((prev) =>
                                        prev.map((t, i) => (i === index ? fn(t) : t))
                                    )
                                }
                                lotes={lotes}
                                insumos={insumos}
                            />

                            {tratamientos.length > 1 && (
                                <button type="button" onClick={() => quitarTratamiento(index)}>
                                    Quitar tratamiento
                                </button>
                            )}
                        </div>
                    ))}

                    <button type="button" onClick={agregarTratamiento}>
                        Agregar otro tratamiento
                    </button>
                </div>
            )}

            <hr />

            <button type="button" onClick={handleMostrarResumen}>
                {mostrarResumenAplicacion ? "Ocultar resumen aplicación" : "Mostrar resumen aplicación"}
            </button>

            {mostrarResumenAplicacion && (
                <ResumenAplicacion
                    fechaAplicacion={fechaAplicacion}
                    proveedorServiciosId={proveedorServicios}
                    proveedorInsumosId={proveedorInsumos}
                    proveedores={proveedores}
                    tratamientos={tratamientos}
                />
            )}

            {mostrarResumenAplicacion && tratamientosCompletos && (
                <div className="text-end">
                    <button type="button" onClick={confirmarGuardar} className="btn btn-success">
                        {modo === "edicion" ? "Guardar cambios" : "Guardar aplicación"}
                    </button>
                </div>
            )}

        </div>
    );
}

export default AltaAplicacion;
