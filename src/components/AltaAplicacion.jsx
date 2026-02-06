import { useState } from "react";
import Tratamiento from "./Tratamiento";
import ResumenAplicacion from "./ResumenAplicacion";

const AltaAplicacion = ({ lotes, proveedores, insumos }) => {
    const [fechaAplicacion, setFechaAplicacion] = useState("");
    const [proveedorInsumos, setProveedorInsumos] = useState("");
    const [proveedorServicios, setProveedorServicios] = useState("");


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

            <ResumenAplicacion
                fechaAplicacion={fechaAplicacion}
                proveedorServiciosId={proveedorServicios}
                proveedorInsumosId={proveedorInsumos}
                proveedores={proveedores}
                tratamientos={tratamientos}
            />

        </div>
    );
};

export default AltaAplicacion;
