import { useState } from "react";
import { leerExcelDesdeUrl } from "../services/excelservice";

const CargaCatalogos = ({ onCatalogosCargados }) => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const cargarCatalogos = async () => {
    setCargando(true);
    setError(null);

    try {
      const baseUrl = process.env.PUBLIC_URL;

      const urlLotes = `${baseUrl}/lotes.xlsx`;
      const urlInsumos = `${baseUrl}/insumos.xlsx`;
      const urlProveedores = `${baseUrl}/proveedores.xlsx`;

      console.log(urlLotes, urlInsumos, urlProveedores);

      const [lotes, insumos, proveedores] = await Promise.all([
        leerExcelDesdeUrl(urlLotes),
        leerExcelDesdeUrl(urlInsumos),
        leerExcelDesdeUrl(urlProveedores),
      ]);

      onCatalogosCargados({
        lotes,
        insumos,
        proveedores,
      });
    } catch (err) {
      console.error(err);
      setError("Error al cargar los catálogos. Verificá los archivos.");
    } finally {
      setCargando(false);
    }
  };



  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem" }}>
      <h2>Carga de catálogos</h2>

      <button onClick={cargarCatalogos} disabled={cargando}>
        {cargando ? "Cargando..." : "Cargar catálogos"}
      </button>

      {error && (
        <p style={{ color: "red", marginTop: "0.5rem" }}>{error}</p>
      )}
    </div>
  );
};

export default CargaCatalogos;
