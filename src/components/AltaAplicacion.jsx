import { useState } from "react";

const AltaAplicacion = ({ lotes }) => {
  const [fechaAplicacion, setFechaAplicacion] = useState("");
  const [idLote, setIdLote] = useState("");
  const [superficieHa, setSuperficieHa] = useState("");

  const loteSeleccionado = lotes.find(
    (l) => l.id_lote === idLote
  );

  const handleLoteChange = (e) => {
    const selectedId = e.target.value;
    setIdLote(selectedId);

    const lote = lotes.find((l) => l.id_lote === selectedId);
    setSuperficieHa(lote ? lote.superficie_ha : "");
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem", marginTop: "1rem" }}>
      <h2>Nueva aplicación</h2>

      {/* Fecha */}
      <div>
        <label>Fecha de aplicación</label><br />
        <input
          type="date"
          value={fechaAplicacion}
          onChange={(e) => setFechaAplicacion(e.target.value)}
        />
      </div>

      {/* Lote */}
      <div style={{ marginTop: "0.5rem" }}>
        <label>Lote</label><br />
        <select value={idLote} onChange={handleLoteChange}>
          <option value="">Seleccionar lote</option>
          {lotes
            .filter(l => l.activo)
            .map((lote) => (
              <option key={lote.id_lote} value={lote.id_lote}>
                {lote.nombre_lote}
              </option>
            ))}
        </select>
      </div>

      {/* Superficie */}
      <div style={{ marginTop: "0.5rem" }}>
        <label>Superficie (ha)</label><br />
        <input type="number" value={superficieHa} disabled />
      </div>

      {/* Debug visual */}
      {loteSeleccionado && (
        <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#555" }}>
          Cultivo: {loteSeleccionado.cultivo}
        </p>
      )}
    </div>
  );
};

export default AltaAplicacion;
