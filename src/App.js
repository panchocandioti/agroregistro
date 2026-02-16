import { useState } from "react";
import CargaCatalogos from "./components/CargaCatalogos";
import AltaAplicacion from "./components/AltaAplicacion";
import { readJsonFile } from "./utils/readJsonFile";
import { downloadJson } from "./utils/downloadJson";
import HistoricoAplicaciones from "./components/HistoricoAplicaciones";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import { exportPendienteCargaPorAplicacionXlsx } from "./services/pendienteCarga";
import logo from "./multimedia/Logo_AgroRegistro.png";

function App() {
  const [tambos, setTambos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [historico, setHistorico] = useState({ version: 1, updated_at: "", aplicaciones: [] });
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  const handleCatalogosCargados = ({ lotes, insumos, proveedores, tambos }) => {
    setTambos(tambos);
    setLotes(lotes);
    setInsumos(insumos);
    setProveedores(proveedores);
  };

  const onGuardarAplicacion = (aplicacionNueva) => {
    const aplicacionesPrev = Array.isArray(historico?.aplicaciones)
      ? historico.aplicaciones
      : [];

    const nuevoHistorico = {
      version: 1,
      updated_at: new Date().toISOString(),
      aplicaciones: [aplicacionNueva, ...aplicacionesPrev],
    };

    // 1️⃣ Actualiza estado
    setHistorico(nuevoHistorico);

    // 2️⃣ Descarga JSON actualizado
    downloadJson(nuevoHistorico, "historico_agroregistro.json");

    // 3️⃣ Genera Excel pendiente de carga (por esa aplicación)
    const proveedoresIndex = new Map(
      proveedores.map((p) => [p.id_proveedor, p])
    );

    const insumosIndex = new Map(
      insumos.map((i) => [i.id_insumo, i])
    );

    const lotesIndex = new Map(
      lotes.map((l) => [l.id_lote, l])
    );

    const tambosIndex = new Map(
      tambos.map((t) => [t.id_tambo, t])
    );

    exportPendienteCargaPorAplicacionXlsx({
      aplicacion: aplicacionNueva,
      tambosIndex,
      lotesIndex,
      insumosIndex,
      proveedoresIndex,
      nombreArchivo: `pendiente_${aplicacionNueva.fecha_aplicacion}_${aplicacionNueva.id_aplicacion}.xlsx`,
    });
    setTimeout(() => {
      alert("Aplicación guardada ✅ Se descargaron histórico + pendiente de carga");
    }, 200);
  };

  const handleMostrarHistorico = () => {
    setMostrarHistorico(!mostrarHistorico);
  }

  const onBorrarAplicacion = (id_aplicacion) => {
    const ok = window.confirm("¿Borrar esta aplicación del histórico? Esta acción no se puede deshacer.");
    if (!ok) return;

    const aplicacionesPrev = Array.isArray(historico?.aplicaciones) ? historico.aplicaciones : [];

    const nuevoHistorico = {
      ...historico,
      updated_at: new Date().toISOString(),
      aplicaciones: aplicacionesPrev.filter((a) => a.id_aplicacion !== id_aplicacion),
    };

    setHistorico(nuevoHistorico);
    downloadJson(nuevoHistorico, "historico_agroregistro.json");
  };

  const onEditarAplicacion = (aplicacionEditada) => {
    const aplicacionesPrev = Array.isArray(historico?.aplicaciones)
      ? historico.aplicaciones
      : [];

    const nuevoHistorico = {
      ...historico,
      updated_at: new Date().toISOString(),
      aplicaciones: aplicacionesPrev.map((a) =>
        a.id_aplicacion === aplicacionEditada.id_aplicacion
          ? aplicacionEditada
          : a
      ),
    };

    setHistorico(nuevoHistorico);

    // 1️⃣ descarga JSON actualizado
    downloadJson(nuevoHistorico, "historico_agroregistro.json");

    // 2️⃣ genera nuevamente pendiente de carga
    const proveedoresIndex = new Map(
      proveedores.map((p) => [p.id_proveedor, p])
    );

    const insumosIndex = new Map(
      insumos.map((i) => [i.id_insumo, i])
    );

    const lotesIndex = new Map(
      lotes.map((l) => [l.id_lote, l])
    );

    const tambosIndex = new Map(
      tambos.map((t) => [t.id_tambo, t])
    );

    exportPendienteCargaPorAplicacionXlsx({
      aplicacion: aplicacionEditada,
      tambosIndex,
      lotesIndex,
      insumosIndex,
      proveedoresIndex,
      nombreArchivo: `pendiente_EDITADO_${aplicacionEditada.fecha_aplicacion}_${aplicacionEditada.id_aplicacion}.xlsx`,
    });
    setTimeout(() => {
      alert("Cambios guardados ✅ Se descargaron histórico + pendiente de carga");
    }, 200);
  };

  return (
    <div className="App" style={{ padding: "1rem" }}>
      <div style={{
        padding: "20px", display: "flex", flexDirection: "row", justifyContent: "left",
        border: "solid 5px darkblue", borderRadius: "10px"
      }}>
        <div style={{ alignContent: "center" }}>
          <h1>AgroRegistro</h1>
          <p><i>Registro de aplicaciones agrícolas</i></p>
        </div>
        <div>
          <img src={logo} style={{ width: "110px", marginLeft: "20px" }} />
        </div>
      </div>

      <hr />

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

        <p>Tambos cargados: {tambos.length}</p>
        <p>Lotes cargados: {lotes.length}</p>
        <p>Insumos cargados: {insumos.length}</p>
        <p>Proveedores cargados: {proveedores.length}</p>

        <hr />

        {lotes.length > 0 && (
          <AltaAplicacion
            tambos={tambos}
            lotes={lotes}
            insumos={insumos}
            proveedores={proveedores}
            onGuardarAplicacion={onGuardarAplicacion}
          />
        )}
      </div>)}

      <button onClick={handleMostrarHistorico} className="btn btn-info" id="historico">
        {mostrarHistorico ? "Ocultar registro de aplicaciones" : "Consultar registro de aplicaciones"}
      </button>

      {mostrarHistorico && (<HistoricoAplicaciones
        historico={historico}
        tambos={tambos}
        lotes={lotes}
        proveedores={proveedores}
        insumos={insumos}
        onBorrarAplicacion={onBorrarAplicacion}
        onEditarAplicacion={onEditarAplicacion}
      />)}

    </div>
  );
}

export default App;
