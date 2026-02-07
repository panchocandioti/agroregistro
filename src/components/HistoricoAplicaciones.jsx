import { useMemo, useState } from "react";
import { formatFecha, aplanarAplicaciones, filtrar } from "../services/historicoService";
import ResumenAplicacion from "./ResumenAplicacion";
import AltaAplicacion from "./AltaAplicacion";

export default function HistoricoAplicaciones({ historico, lotes, insumos, proveedores, onBorrarAplicacion,
  onEditarAplicacion }) {
  const [filtros, setFiltros] = useState({
    fechaDesde: "",
    fechaHasta: "",
    id_lote: "todos",
    id_insumo: "todos",
    id_prov_serv: "todos",
    id_prov_ins: "todos",
    texto: "",
  });

  const [idAplicacionSeleccionada, setIdAplicacionSeleccionada] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [borrador, setBorrador] = useState(null); // copia editable

  // índices para resolver nombres rápido
  const idxLotes = useMemo(() => new Map((lotes ?? []).map((l) => [l.id_lote, l])), [lotes]);
  const idxInsumos = useMemo(() => new Map((insumos ?? []).map((i) => [i.id_insumo, i])), [insumos]);

  // ⛳️ IMPORTANTE: ajustá estas 2 claves si tu proveedor se llama distinto
  const idxProveedores = useMemo(
    () => new Map((proveedores ?? []).map((p) => [p.id_proveedor, p])),
    [proveedores]
  );

  const nombreLote = (id_lote, fallback) => idxLotes.get(id_lote)?.nombre_lote ?? fallback ?? id_lote ?? "";
  const nombreInsumo = (id_insumo, fallback) => idxInsumos.get(id_insumo)?.nombre_insumo ?? fallback ?? id_insumo ?? "";
  const nombreProveedor = (id_proveedor) =>
    idxProveedores.get(id_proveedor)?.nombre_proveedor ?? id_proveedor ?? "";

  const registros = useMemo(() => aplanarAplicaciones(historico), [historico]);

  // opciones de filtros desde catálogos (mejor que desde histórico)
  const opciones = useMemo(() => {
    // ===== Lotes presentes en el histórico =====
    const lotesMap = new Map();
    registros.forEach((r) => {
      (r.lotes ?? []).forEach((l) => {
        if (!l?.id_lote) return;
        if (!lotesMap.has(l.id_lote)) {
          const cat = idxLotes.get(l.id_lote);
          lotesMap.set(l.id_lote, {
            id_lote: l.id_lote,
            nombre_lote: cat?.nombre_lote ?? l.nombre_lote ?? l.id_lote,
          });
        }
      });
    });
    const lotesOpc = Array.from(lotesMap.values()).sort((a, b) =>
      (a.nombre_lote ?? "").localeCompare(b.nombre_lote ?? "", "es")
    );

    // ===== Insumos presentes en el histórico =====
    const insumosMap = new Map();
    registros.forEach((r) => {
      (r.insumos ?? []).forEach((i) => {
        if (!i?.id_insumo) return;
        if (!insumosMap.has(i.id_insumo)) {
          const cat = idxInsumos.get(i.id_insumo);
          insumosMap.set(i.id_insumo, {
            id_insumo: i.id_insumo,
            nombre_insumo: cat?.nombre_insumo ?? i.nombre_insumo ?? i.id_insumo,
          });
        }
      });
    });
    const insumosOpc = Array.from(insumosMap.values()).sort((a, b) =>
      (a.nombre_insumo ?? "").localeCompare(b.nombre_insumo ?? "", "es")
    );

    // ===== Proveedores presentes (servicio e insumos) =====
    const provServSet = new Set(registros.map((r) => r.id_prov_serv).filter(Boolean));
    const provInsSet = new Set(registros.map((r) => r.id_prov_ins).filter(Boolean));

    const provServOpc = Array.from(provServSet)
      .map((id) => ({
        id_proveedor: id,
        nombre_proveedor: idxProveedores.get(id)?.nombre_proveedor ?? id,
      }))
      .sort((a, b) => (a.nombre_proveedor ?? "").localeCompare(b.nombre_proveedor ?? "", "es"));

    const provInsOpc = Array.from(provInsSet)
      .map((id) => ({
        id_proveedor: id,
        nombre_proveedor: idxProveedores.get(id)?.nombre_proveedor ?? id,
      }))
      .sort((a, b) => (a.nombre_proveedor ?? "").localeCompare(b.nombre_proveedor ?? "", "es"));

    return { lotesOpc, insumosOpc, provServOpc, provInsOpc };
  }, [registros, idxLotes, idxInsumos, idxProveedores]);


  const resultados = useMemo(() => {
    // si querés “lo más nuevo arriba”
    const filtrados = filtrar(registros, filtros);
    return filtrados.sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
  }, [registros, filtros]);

  const limpiarFiltros = () => {
    setFiltros({
      fechaDesde: "",
      fechaHasta: "",
      id_lote: "todos",
      id_insumo: "todos",
      id_prov_serv: "todos",
      id_prov_ins: "todos",
      texto: "",
    });
  };

  const totalHectareas = useMemo(() => {
    return resultados.reduce((total, r) => {
      const sumaLotes = (r.lotes ?? []).reduce((acc, lote) => {
        const sup = Number(lote.superficie) || 0;
        return acc + sup;
      }, 0);

      return total + sumaLotes;
    }, 0);
  }, [resultados]);

  const resumenInsumoSeleccionado = useMemo(() => {
    if (filtros.id_insumo === "todos") return null;

    const id = filtros.id_insumo;

    // nombre desde catálogo (ajustá según tu helper actual)
    const nombre = idxInsumos.get(id)?.nombre_insumo ?? id;

    let total = 0;
    let unidadTotal = ""; // Litros, Kg, etc. (tomamos la última encontrada)

    for (const r of resultados) {
      const item = (r.insumos ?? []).find((i) => i.id_insumo === id);
      if (!item) continue;

      total += parseFloat(item.cantidad_total) || 0;
      unidadTotal = item.unidad_total || unidadTotal;
    }

    const dosisMedia = totalHectareas > 0 ? total / totalHectareas : 0;

    return {
      id,
      nombre,
      total,
      unidadTotal,
      dosisMedia,
    };
  }, [filtros.id_insumo, resultados, totalHectareas, idxInsumos]);

  const aplicacionSeleccionada = useMemo(() => {
    if (!idAplicacionSeleccionada) return null;
    return (historico?.aplicaciones ?? []).find(
      (a) => a.id_aplicacion === idAplicacionSeleccionada
    ) || null;
  }, [historico, idAplicacionSeleccionada]);

  const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

  return (
    <div className="container-fluid p-0">
      {!aplicacionSeleccionada && (<div className="card mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <h5 className="m-0">Histórico de aplicaciones</h5>
            <div className="text-muted">
              {resultados.length} resultado{resultados.length === 1 ? "" : "s"}
            </div>
          </div>

          <hr />

          <div className="row g-2">
            <div className="col-12 col-md-3">
              <label className="form-label"><b>Fecha desde</b></label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaDesde}
                onChange={(e) => setFiltros((f) => ({ ...f, fechaDesde: e.target.value }))}
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label"><b>Fecha hasta</b></label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaHasta}
                onChange={(e) => setFiltros((f) => ({ ...f, fechaHasta: e.target.value }))}
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label"><b>Lote</b></label>
              <select
                className="form-select"
                value={filtros.id_lote}
                onChange={(e) => setFiltros((f) => ({ ...f, id_lote: e.target.value }))}
              >
                <option value="todos">Todos</option>
                {opciones.lotesOpc.map((l) => (
                  <option key={l.id_lote} value={l.id_lote}>
                    {l.nombre_lote} ({l.id_lote})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label"><b>Insumo</b></label>
              <select
                className="form-select"
                value={filtros.id_insumo}
                onChange={(e) => setFiltros((f) => ({ ...f, id_insumo: e.target.value }))}
              >
                <option value="todos">Todos</option>
                {opciones.insumosOpc.map((i) => (
                  <option key={i.id_insumo} value={i.id_insumo}>
                    {i.nombre_insumo} ({i.id_insumo})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label"><b>Proveedor de servicio</b></label>
              <select
                className="form-select"
                value={filtros.id_prov_serv}
                onChange={(e) => setFiltros((f) => ({ ...f, id_prov_serv: e.target.value }))}
              >
                <option value="todos">Todos</option>
                {opciones.provServOpc.map((p) => (
                  <option key={p.id_proveedor} value={p.id_proveedor}>
                    {p.nombre_proveedor} ({p.id_proveedor})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label"><b>Proveedor de insumos</b></label>
              <select
                className="form-select"
                value={filtros.id_prov_ins}
                onChange={(e) => setFiltros((f) => ({ ...f, id_prov_ins: e.target.value }))}
              >
                <option value="todos">Todos</option>
                {opciones.provInsOpc.map((p) => (
                  <option key={p.id_proveedor} value={p.id_proveedor}>
                    {p.nombre_proveedor} ({p.id_proveedor})
                  </option>
                ))}

              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label"><b>Buscar (obs / nombres)</b></label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: barbecho, glifosato, T01/L01..."
                value={filtros.texto}
                onChange={(e) => setFiltros((f) => ({ ...f, texto: e.target.value }))}
              />
            </div>

            <div className="col-12 col-md-2 d-flex align-items-end">
              <button type="button" className="btn btn-outline-secondary w-100" onClick={limpiarFiltros}>
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>)}

      <div className="card">
        {!aplicacionSeleccionada && (<div className="card-body">
          {resultados.length === 0 ? (
            <div className="alert alert-warning m-0">No hay resultados con esos filtros.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Lotes</th>
                    <th>Insumos</th>
                    <th>Prov. Serv.</th>
                    <th>Prov. Ins.</th>
                    <th>Obs.</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((r) => (
                    <tr key={`${r.id_aplicacion}_${r.idx_tratamiento}`}>
                      <td style={{ whiteSpace: "nowrap" }}>{formatFecha(r.fecha)}</td>

                      <td>
                        {(r.lotes ?? []).map((l) => (
                          <div key={l.id_lote}>
                            {nombreLote(l.id_lote, l.nombre_lote)}{" "}
                            <span className="text-muted">({l.id_lote})</span>
                          </div>
                        ))}
                      </td>

                      <td>
                        {(r.insumos ?? []).map((i) => (
                          <div key={i.id_insumo} className="mb-2">
                            <div>
                              {nombreInsumo(i.id_insumo, i.nombre_insumo)}{" "}
                              <span className="text-muted">({i.id_insumo})</span>
                            </div>
                            <div className="text-muted">
                              Dosis: {i.dosis} · Total: {i.cantidad_total} {i.unidad_total}
                            </div>
                          </div>
                        ))}
                      </td>

                      <td style={{ whiteSpace: "nowrap" }}>
                        {nombreProveedor(r.id_prov_serv)}{" "}
                        <span className="text-muted">({r.id_prov_serv})</span>
                      </td>

                      <td style={{ whiteSpace: "nowrap" }}>
                        {nombreProveedor(r.id_prov_ins)}{" "}
                        <span className="text-muted">({r.id_prov_ins})</span>
                      </td>

                      <td>{r.observaciones}</td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setIdAplicacionSeleccionada(r.id_aplicacion)}
                        >
                          Ver resumen
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3 text-end fw-bold">
            <h5 style={{ color: "red" }}><strong>Total hectáreas: {totalHectareas.toFixed(1)} ha</strong></h5>
            <div className="mt-3 d-flex justify-content-end">
              <div className="text-end">
                {resumenInsumoSeleccionado && (
                  <>
                    <div className="mt-2">
                      <span className="fw-bold">{resumenInsumoSeleccionado.nombre}</span>:{" "}
                      {resumenInsumoSeleccionado.total.toFixed(1)}{" "}
                      {resumenInsumoSeleccionado.unidadTotal || ""}
                    </div>
                    <div className="text-muted">
                      Dosis media: {resumenInsumoSeleccionado.dosisMedia.toFixed(2)}{" "}
                      {resumenInsumoSeleccionado.unidadTotal
                        ? `${resumenInsumoSeleccionado.unidadTotal}/ha`
                        : "/ha"}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>)}
        {aplicacionSeleccionada && (
          <div className="card mt-3">
            <div className="card-body">
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => {
                    const copia = (typeof structuredClone === "function")
                      ? structuredClone(aplicacionSeleccionada)
                      : deepClone(aplicacionSeleccionada);

                    setBorrador(copia);
                    setModoEdicion(true);
                  }}
                >
                  Editar
                </button>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => {
                    onBorrarAplicacion(aplicacionSeleccionada.id_aplicacion);
                    setIdAplicacionSeleccionada(null);
                  }}
                >
                  Borrar
                </button>


                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setIdAplicacionSeleccionada(null)}
                >
                  Cerrar
                </button>
              </div>

              <hr />

              {!modoEdicion ? (<ResumenAplicacion
                fechaAplicacion={aplicacionSeleccionada.fecha_aplicacion}
                proveedorServiciosId={aplicacionSeleccionada.id_prov_serv}
                proveedorInsumosId={aplicacionSeleccionada.id_prov_ins}
                proveedores={proveedores}
                tratamientos={aplicacionSeleccionada.tratamientos}
              />) : (
                <AltaAplicacion
                  modo="edicion"
                  aplicacionInicial={aplicacionSeleccionada}
                  lotes={lotes}
                  insumos={insumos}
                  proveedores={proveedores}
                  onConfirmar={(apEditada) => {
                    onEditarAplicacion(apEditada);
                    setModoEdicion(false);
                  }}
                  onCancelar={() => setModoEdicion(false)}
                />
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
