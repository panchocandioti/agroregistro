import { useEffect, useState } from "react";
import { leerExcelDesdeArrayBuffer } from "../services/excelservice";
import { fsAccessSupported, loadCatalogosFromDir } from "../utils/fsCatalogos";
import {
  saveCatalogosDirHandle,
  loadCatalogosDirHandle,
  clearCatalogosDirHandle,
} from "../utils/fsHandleStore";

const CargaCatalogos = ({ onCatalogosCargados }) => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [dirHandle, setDirHandle] = useState(null);

  // Al montar: intentar recuperar carpeta guardada
  useEffect(() => {
    (async () => {
      try {
        const saved = await loadCatalogosDirHandle();
        if (saved) setDirHandle(saved);
      } catch {
        // si falla, no pasa nada
      }
    })();
  }, []);

  const elegirCarpetaCatalogos = async () => {
    setError(null);

    if (!fsAccessSupported()) {
      setError("Este navegador no soporta selección de carpeta. Usá Chrome/Edge.");
      return;
    }

    try {
      const handle = await window.showDirectoryPicker({
        id: "agroregistro_catalogos",
        mode: "read",
      });

      setDirHandle(handle);
      await saveCatalogosDirHandle(handle);
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error(err);
        setError("No se pudo seleccionar/guardar la carpeta de catálogos.");
      }
    }
  };

  const cargarCatalogosDesdeCarpeta = async () => {
    setCargando(true);
    setError(null);

    try {
      if (!dirHandle) {
        setError("Primero elegí una carpeta de catálogos.");
        return;
      }

      const data = await loadCatalogosFromDir(dirHandle, leerExcelDesdeArrayBuffer);
      onCatalogosCargados(data);
    } catch (err) {
      console.error(err);
      setError(
        "Error al cargar desde carpeta. Verificá que existan lotes.xlsx, insumos.xlsx y proveedores.xlsx, y que el navegador tenga permiso."
      );
    } finally {
      setCargando(false);
    }
  };

  const olvidarCarpeta = async () => {
    await clearCatalogosDirHandle();
    setDirHandle(null);
    setError(null);
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: "1rem", borderRadius: 8 }}>
      <h3 style={{ marginTop: 0 }}>Carga de catálogos</h3>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={elegirCarpetaCatalogos} disabled={cargando}>
          Elegir carpeta de catálogos
        </button>

        <button onClick={cargarCatalogosDesdeCarpeta} disabled={cargando || !dirHandle}>
          {cargando ? "Cargando..." : "Cargar catálogos"}
        </button>

        {dirHandle && (
          <button onClick={olvidarCarpeta} disabled={cargando}>
            Olvidar carpeta
          </button>
        )}
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
        Carpeta configurada: <b>{dirHandle ? "Sí" : "No"}</b>
      </div>

      {error && <p style={{ color: "red", marginTop: "0.75rem" }}>{error}</p>}
    </div>
  );
};

export default CargaCatalogos;
