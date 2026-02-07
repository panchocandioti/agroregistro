import { useMemo, useState } from "react";
import { aplanarAplicaciones, filtrar } from "../services/historicoService";

export default function HistoricoAplicaciones({ historico, lotes, insumos, proveedores }) {
  const [filtros, setFiltros] = useState({
    fechaDesde: "",
    fechaHasta: "",
    id_lote: "todos",
    id_insumo: "todos",
    id_prov_serv: "todos",
    id_prov_ins: "todos",
    texto: "",
  });

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
    const lotesOpc = (lotes ?? []).slice().sort((a, b) => (a.nombre_lote ?? "").localeCompare(b.nombre_lote ?? "", "es"));
    const insumosOpc = (insumos ?? []).slice().sort((a, b) => (a.nombre_insumo ?? "").localeCompare(b.nombre_insumo ?? "", "es"));
    const provOpc = (proveedores ?? []).slice().sort((a, b) => (a.nombre_proveedor ?? "").localeCompare(b.nombre_proveedor ?? "", "es"));
    return { lotesOpc, insumosOpc, provOpc };
  }, [lotes, insumos, proveedores]);

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

  return (
    <div className="container-fluid p-0">
      <div className="card mb-3">
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
              <label className="form-label">Fecha desde</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaDesde}
                onChange={(e) => setFiltros((f) => ({ ...f, fechaDesde: e.target.value }))}
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label">Fecha hasta</label>
              <input
                type="date"
                className="form-control"
                value={filtros.fechaHasta}
                onChange={(e) => setFiltros((f) => ({ ...f, fechaHasta: e.target.value }))}
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label">Lote</label>
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
              <label className="form-label">Insumo</label>
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
              <label className="form-label">Proveedor de servicio</label>
              <select
                className="form-select"
                value={filtros.id_prov_serv}
                onChange={(e) => setFiltros((f) => ({ ...f, id_prov_serv: e.target.value }))}
              >
                <option value="todos">Todos</option>
                {opciones.provOpc.map((p) => (
                  <option key={p.id_proveedor} value={p.id_proveedor}>
                    {p.nombre_proveedor} ({p.id_proveedor})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label">Proveedor de insumos</label>
              <select
                className="form-select"
                value={filtros.id_prov_ins}
                onChange={(e) => setFiltros((f) => ({ ...f, id_prov_ins: e.target.value }))}
              >
                <option value="todos">Todos</option>
                {opciones.provOpc.map((p) => (
                  <option key={p.id_proveedor} value={p.id_proveedor}>
                    {p.nombre_proveedor} ({p.id_proveedor})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Buscar (obs / nombres)</label>
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
      </div>

      <div className="card">
        <div className="card-body">
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
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((r) => (
                    <tr key={`${r.id_aplicacion}_${r.idx_tratamiento}`}>
                      <td style={{ whiteSpace: "nowrap" }}>{r.fecha}</td>

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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
