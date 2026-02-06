import { useState } from "react";
import CargaCatalogos from "./components/CargaCatalogos";

function App() {
  const [lotes, setLotes] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [proveedores, setProveedores] = useState([]);

  const handleCatalogosCargados = ({ lotes, insumos, proveedores }) => {
    setLotes(lotes);
    setInsumos(insumos);
    setProveedores(proveedores);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h1>AgroRegistro</h1>

      <CargaCatalogos onCatalogosCargados={handleCatalogosCargados} />

      <hr />

      <p>Lotes cargados: {lotes.length}</p>
      <p>Insumos cargados: {insumos.length}</p>
      <p>Proveedores cargados: {proveedores.length}</p>
    </div>
  );
}

export default App;
