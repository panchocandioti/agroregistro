import { useEffect, useState } from "react";
import Tratamiento from "./Tratamiento";
import ResumenAplicacion from "./ResumenAplicacion";
import { mayusculaInicial } from "../services/historicoService";

function AltaAplicacion({
    tambos,
    lotes,
    insumos,
    proveedores,
    trabajos,

    modo = "alta", // "alta" | "edicion"
    aplicacionInicial = null, // objeto completo desde histórico
    onConfirmar, // (aplicacion) => void

    // compatibilidad con implementación anterior
    onGuardarAplicacion, // (aplicacionNueva) => void

    // opcional, para cerrar editor desde histórico
    onCancelar,
}) {
    const [ordenCarga, setOrdenCarga] = useState("");
    const [fechaAplicacion, setFechaAplicacion] = useState("");
    const [tamboAplicacion, setTamboAplicacion] = useState("");
    const [proveedorInsumos, setProveedorInsumos] = useState("");
    const [proveedorServicios, setProveedorServicios] = useState("");
    const [idTrabajo, setIdTrabajo] = useState("");

    const [mostrarResumenAplicacion, setMostrarResumenAplicacion] = useState(false);

    const [tratamientos, setTratamientos] = useState([
        { lotes: [], insumos: [], observaciones: "" },
    ]);

    const [idAplicacion, setIdAplicacion] = useState("");
    const [createdAt, setCreatedAt] = useState("");

    useEffect(() => {
        if (modo !== "edicion" || !aplicacionInicial) return;

        setIdAplicacion(aplicacionInicial.id_aplicacion || "");
        setCreatedAt(aplicacionInicial.created_at || "");
        setOrdenCarga(aplicacionInicial.orden_carga || "");
        setFechaAplicacion(aplicacionInicial.fecha_aplicacion || "");
        setTamboAplicacion(aplicacionInicial.tambo_aplicacion || "");
        setProveedorServicios(aplicacionInicial.id_prov_serv || "");
        setProveedorInsumos(aplicacionInicial.id_prov_ins || "");
        setIdTrabajo(String(aplicacionInicial.id_trabajo || ""));

        setTratamientos(
            Array.isArray(aplicacionInicial.tratamientos) &&
                aplicacionInicial.tratamientos.length > 0
                ? aplicacionInicial.tratamientos
                : [{ lotes: [], insumos: [], observaciones: "" }]
        );

        setMostrarResumenAplicacion(true);
    }, [modo, aplicacionInicial]);

    const agregarTratamiento = () => {
        setTratamientos((prev) => [
            ...prev,
            { lotes: [], insumos: [], observaciones: "" },
        ]);
    };

    const quitarTratamiento = (index) => {
        setTratamientos((prev) => prev.filter((_, i) => i !== index));
    };

    const esLabranza = String(idTrabajo) === "71";

    const handleChangeTipoTrabajo = (nuevoIdTrabajo) => {
        setIdTrabajo(String(nuevoIdTrabajo));

        if (String(nuevoIdTrabajo) === "71") {
            setProveedorInsumos("");
        }
    };

    const tarea =
        trabajos.find((t) => String(t.id_trabajo) === String(idTrabajo))
            ?.tipo_trabajo || "";

    const validarTrabajo = () => {
        if (!ordenCarga) return "Debe ingresar la orden de trabajo.";
        if (!fechaAplicacion) return "Debe ingresar la fecha.";
        if (!tamboAplicacion) return "Debe seleccionar el tambo.";
        if (!idTrabajo) return "Debe seleccionar el tipo de trabajo.";
        if (!proveedorServicios) return "Debe seleccionar el proveedor de servicios.";

        if (!esLabranza && !proveedorInsumos) {
            return "Debe seleccionar el proveedor de insumos.";
        }

        return null;
    };

    const handleMostrarResumen = () => {
        const error = validarTrabajo();
        if (error) {
            alert(error);
            return;
        }
        setMostrarResumenAplicacion((x) => !x);
    };

    const confirmarGuardar = () => {
        const error = validarTrabajo();
        if (error) {
            alert(error);
            return;
        }

        const now = new Date().toISOString();
        const idNuevo = `${now}_${Math.random().toString(16).slice(2, 8)}`;

        const aplicacion = {
            id_aplicacion: modo === "edicion" ? idAplicacion : idNuevo,
            created_at: modo === "edicion" ? createdAt : now,
            orden_carga: ordenCarga.trim(),
            fecha_aplicacion: fechaAplicacion,
            tambo_aplicacion: tamboAplicacion,
            id_trabajo: idTrabajo,
            id_prov_serv: proveedorServicios,
            id_prov_ins: esLabranza ? "" : proveedorInsumos,
            tratamientos,
        };

        const cb = onConfirmar || onGuardarAplicacion;
        if (typeof cb === "function") cb(aplicacion);

        if (modo === "edicion") {
            if (typeof onCancelar === "function") onCancelar();
            return;
        }

        setOrdenCarga("");
        setFechaAplicacion("");
        setTamboAplicacion("");
        setIdTrabajo("");
        setProveedorInsumos("");
        setProveedorServicios("");
        setTratamientos([{ lotes: [], insumos: [], observaciones: "" }]);
        setMostrarResumenAplicacion(false);
    };

    const tratamientosCompletos =
        tratamientos.length > 0 &&
        tratamientos.every((t) =>
            esLabranza
                ? (t.lotes?.length || 0) > 0
                : (t.lotes?.length || 0) > 0 && (t.insumos?.length || 0) > 0
        );

    return (
        <div style={{ border: "1px solid #ccc", padding: "1rem", marginTop: "1rem" }}>
            <div style={{ border: "2px solid #999", padding: "1rem", marginBottom: "1.5rem" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "1rem",
                    }}
                >
                    <h3 style={{ margin: 0 }}>
                        {modo === "edicion" ? "Editar trabajo" : "Datos del trabajo"}
                    </h3>

                    {modo === "edicion" && (
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={onCancelar}
                        >
                            Cancelar edición
                        </button>
                    )}
                </div>

                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
                    <div>
                        <label>Orden de trabajo</label>
                        <br />
                        <input
                            type="text"
                            className="form-control"
                            value={ordenCarga}
                            onChange={(e) => setOrdenCarga(e.target.value)}
                        />
                    </div>

                    <div>
                        <label>Fecha</label>
                        <br />
                        <input
                            type="date"
                            value={fechaAplicacion}
                            onChange={(e) => setFechaAplicacion(e.target.value)}
                        />
                    </div>

                    <div>
                        <label>Tambo</label>
                        <br />
                        <select
                            value={tamboAplicacion}
                            onChange={(e) => setTamboAplicacion(e.target.value)}
                        >
                            <option value="">Seleccionar</option>
                            {tambos.map((t) => (
                                <option key={t.id_tambo} value={t.id_tambo}>
                                    {t.nombre_tambo}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Tipo de trabajo</label>
                        <br />
                        <select
                            value={idTrabajo}
                            onChange={(e) => handleChangeTipoTrabajo(e.target.value)}
                        >
                            <option value="">Seleccionar</option>
                            {trabajos.map((t) => (
                                <option key={t.id_trabajo} value={String(t.id_trabajo)}>
                                    {mayusculaInicial(t.tipo_trabajo)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {tamboAplicacion && fechaAplicacion && idTrabajo && (
                        <div>
                            {!esLabranza && (
                                <div>
                                    <label>Proveedor de insumos</label>
                                    <br />
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
                            )}

                            <div>
                                <label>Proveedor de servicios</label>
                                <br />
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
                    )}
                </div>
            </div>

            {tamboAplicacion && fechaAplicacion && idTrabajo && proveedorServicios && (
                <div>
                    <h3>Trabajos de {tarea}</h3>

                    {tratamientos.map((tratamiento, index) => (
                        <div key={index}>
                            <Tratamiento
                                tarea={tarea}
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
                                    Quitar {tarea}
                                </button>
                            )}
                        </div>
                    ))}

                    <button type="button" onClick={agregarTratamiento}>
                        Agregar {tarea}
                    </button>
                </div>
            )}

            <hr />

            <button type="button" onClick={handleMostrarResumen}>
                {mostrarResumenAplicacion
                    ? "Ocultar resumen del trabajo"
                    : "Mostrar resumen del trabajo"}
            </button>

            {mostrarResumenAplicacion && (
                <ResumenAplicacion
                    ordenCarga={ordenCarga}
                    fechaAplicacion={fechaAplicacion}
                    tamboAplicacion={tamboAplicacion}
                    trabajoId={idTrabajo}
                    trabajos={trabajos}
                    proveedorServiciosId={proveedorServicios}
                    proveedorInsumosId={proveedorInsumos}
                    proveedores={proveedores}
                    tambos={tambos}
                    tratamientos={tratamientos}
                />
            )}

            {mostrarResumenAplicacion && tratamientosCompletos && (
                <div className="text-end">
                    <button
                        type="button"
                        onClick={confirmarGuardar}
                        className="btn btn-success"
                    >
                        {modo === "edicion" ? "Guardar cambios" : "Guardar trabajos"}
                    </button>
                </div>
            )}
        </div>
    );
}

export default AltaAplicacion;