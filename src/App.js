import { useEffect, useState } from "react";
import CargaCatalogos from "./components/CargaCatalogos";
import AltaAplicacion from "./components/AltaAplicacion";
import { readJsonFile } from "./utils/readJsonFile";
import { downloadJson } from "./utils/downloadJson";
import HistoricoAplicaciones from "./components/HistoricoAplicaciones";

function App() {
  const [lotes, setLotes] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [historico, setHistorico] = useState({ version: 1, updated_at: "", aplicaciones: [] });
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  const handleCatalogosCargados = ({ lotes, insumos, proveedores }) => {
    setLotes(lotes);
    setInsumos(insumos);
    setProveedores(proveedores);
  };

  const onGuardarAplicacion = (aplicacionNueva) => {
    const aplicacionesPrev = Array.isArray(historico?.aplicaciones) ? historico.aplicaciones : [];

    const nuevoHistorico = {
      version: 1,
      updated_at: new Date().toISOString(),
      aplicaciones: [aplicacionNueva, ...aplicacionesPrev],
    };

    setHistorico(nuevoHistorico);
    downloadJson(nuevoHistorico, "historico_agroregistro.json");
  };

  const handleMostrarHistorico = () => {
    setMostrarHistorico(!mostrarHistorico);
  }

  return (
    <div className="App" style={{ padding: "1rem" }}>
      <h1>AgroRegistro</h1>
      <p><i>Registro de aplicaciones agrícolas</i></p>

      <input
        type="file"
        accept="application/json"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          try {
            const data = await readJsonFile(file);
            // tolerante: si viene como array, lo envolvemos
            const normalizado = Array.isArray(data)
              ? { version: 1, updated_at: new Date().toISOString(), aplicaciones: data }
              : { version: 1, updated_at: data.updated_at || "", aplicaciones: data.aplicaciones || [] };

            setHistorico(normalizado);
            alert("Histórico cargado ✅");
          } catch (err) {
            alert(err.message);
          }
        }}
      />

      <hr />

      {!mostrarHistorico && (<div>
        <CargaCatalogos onCatalogosCargados={handleCatalogosCargados} />

        <hr />

        <p>Lotes cargados: {lotes.length}</p>
        <p>Insumos cargados: {insumos.length}</p>
        <p>Proveedores cargados: {proveedores.length}</p>

        <hr />

        {lotes.length > 0 && (
          <AltaAplicacion
            lotes={lotes}
            insumos={insumos}
            proveedores={proveedores}
            onGuardarAplicacion={onGuardarAplicacion}
          />
        )}
      </div>)}

      <button onClick={handleMostrarHistorico}>
        {mostrarHistorico ? "Ocultar registro de aplicaciones" : "Consultar registro de aplicaciones"}
      </button>

      {mostrarHistorico && (<HistoricoAplicaciones
        historico={historico}
        lotes={lotes}
        proveedores={proveedores}
        insumos={insumos}
      />)}

    </div>
  );
}

export default App;
