import { useState } from "react";
import Tratamiento from "./Tratamiento";
import ResumenAplicacion from "./ResumenAplicacion";

function AltaAplicacion({ lotes, insumos, proveedores, onGuardarAplicacion }) {
    const [fechaAplicacion, setFechaAplicacion] = useState("");
    const [proveedorInsumos, setProveedorInsumos] = useState("");
    const [proveedorServicios, setProveedorServicios] = useState("");

    const [mostrarResumenAplicacion, setMostrarResumenAplicacion] = useState(false);

    const [tratamientos, setTratamientos] = useState([
        { lotes: [], insumos: [], observaciones: "" }
    ]);

    const agregarTratamiento = () => {
        setTratamientos(prev => [
            ...prev,
            { lotes: [] }
        ]);
    };

    const quitarTratamiento = index => {
        setTratamientos(prev =>
            prev.filter((_, i) => i !== index)
        );
    };

    const handleMostrarResumen = () => {
        setMostrarResumenAplicacion(!mostrarResumenAplicacion);
    };

    const confirmarGuardar = () => {
        const now = new Date().toISOString();
        const id = `${now}_${Math.random().toString(16).slice(2, 8)}`;

        const aplicacionNueva = {
            id_aplicacion: id,
            created_at: now,
            fecha_aplicacion: fechaAplicacion,
            id_prov_serv: proveedorServicios,
            id_prov_ins: proveedorInsumos,
            tratamientos,
        };

        onGuardarAplicacion(aplicacionNueva);

        alert("Aplicación guardada y archivo actualizado descargado ✅");

        setFechaAplicacion("");
        setProveedorInsumos("");
        setProveedorServicios("");
        setTratamientos([{ lotes: [], insumos: [], observaciones: "" }]);
        handleMostrarResumen();
    };


    return (
        <div style={{ border: "1px solid #ccc", padding: "1rem", marginTop: "1rem" }}>

            <div style={{ border: "2px solid #999", padding: "1rem", marginBottom: "1.5rem" }}>
                <h3>Datos de la aplicación</h3>

                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>

                    {/* Fecha */}
                    <div>
                        <label>Fecha</label><br />
                        <input
                            type="date"
                            value={fechaAplicacion}
                            onChange={e => setFechaAplicacion(e.target.value)}
                        />
                    </div>

                    {/* Proveedor insumos */}
                    <div>
                        <label>Proveedor de insumos</label><br />
                        <select
                            value={proveedorInsumos}
                            onChange={e => setProveedorInsumos(e.target.value)}
                        >
                            <option value="">Seleccionar</option>
                            {proveedores.map(p => (
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
                            onChange={e => setProveedorServicios(e.target.value)}
                        >
                            <option value="">Seleccionar</option>
                            {proveedores.map(p => (
                                <option key={p.id_proveedor} value={p.id_proveedor}>
                                    {p.nombre_proveedor}
                                </option>
                            ))}
                        </select>
                    </div>

                </div>
            </div>

            {fechaAplicacion && proveedorInsumos && proveedorServicios && (<div>
                <h3>Tratamientos</h3>

                {tratamientos.map((tratamiento, index) => (
                    <div key={index}>
                        <Tratamiento
                            key={index}
                            numero={index + 1}
                            tratamiento={tratamiento}
                            setTratamiento={fn =>
                                setTratamientos(prev =>
                                    prev.map((t, i) =>
                                        i === index ? fn(t) : t
                                    )
                                )
                            }
                            lotes={lotes}
                            insumos={insumos}
                        />

                        {tratamientos.length > 1 && (
                            <button onClick={() => quitarTratamiento(index)}>
                                Quitar tratamiento
                            </button>
                        )}
                    </div>
                ))}

                <button onClick={agregarTratamiento}>
                    Agregar otro tratamiento
                </button>
            </div>)}

            <hr />

            <button onClick={handleMostrarResumen}>
                {mostrarResumenAplicacion ? "Ocultar resumen aplicación" : "Mostrar resumen aplicación"}
            </button>

            {mostrarResumenAplicacion && (<ResumenAplicacion
                fechaAplicacion={fechaAplicacion}
                proveedorServiciosId={proveedorServicios}
                proveedorInsumosId={proveedorInsumos}
                proveedores={proveedores}
                tratamientos={tratamientos}
            />)}

            {mostrarResumenAplicacion && (
                <button type="button" onClick={confirmarGuardar}>
                    Guardar aplicación
                </button>

            )}

        </div>
    );
};

export default AltaAplicacion;
