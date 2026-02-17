import { useMemo, useState } from "react";
import { formatFecha, aplanarAplicaciones, filtrar } from "../services/historicoService";
import ResumenAplicacion from "./ResumenAplicacion";
import AltaAplicacion from "./AltaAplicacion";

export default function HistoricoAplicaciones({
  historico,
  tambos,
  lotes,
  insumos,
  proveedores,
  onBorrarAplicacion,
  onEditarAplicacion,
}) {
  const [filtros, setFiltros] = useState({
    orden_carga: "todos",
    fechaDesde: "",
    fechaHasta: "",
    id_tambo: "todos",
    id_lote: "todos",
    id_insumo: "todos",
    id_prov_serv: "todos",
    id_prov_ins: "todos",
    texto: "",
  });

  const [idAplicacionSeleccionada, setIdAplicacionSeleccionada] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [borrador, setBorrador] = useState(null);

  // Índices de catálogos
  const idxTambos = useMemo(
    () => new Map((tambos ?? []).map((t) => [String(t.id_tambo), t])),
    [tambos]
  );
  const idxLotes = useMemo(
    () => new Map((lotes ?? []).map((l) => [String(l.id_lote), l])),
    [lotes]
  );
  const idxInsumos = useMemo(
    () => new Map((insumos ?? []).map((i) => [String(i.id_insumo), i])),
    [insumos]
  );
  const idxProveedores = useMemo(
    () => new Map((proveedores ?? []).map((p) => [String(p.id_proveedor), p])),
    [proveedores]
  );

  const nombreTambo = (id_tambo, fallback) =>
    idxTambos.get(String(id_tambo))?.nombre_tambo ?? fallback ?? id_tambo ?? "";
  const nombreLote = (id_lote, fallback) =>
    idxLotes.get(String(id_lote))?.nombre_lote ?? fallback ?? id_lote ?? "";
  const nombreInsumo = (id_insumo, fallback) =>
    idxInsumos.get(String(id_insumo))?.nombre_insumo ?? fallback ?? id_insumo ?? "";
  const nombreProveedor = (id_proveedor) =>
    idxProveedores.get(String(id_proveedor))?.nombre_proveedor ?? id_proveedor ?? "";

  // ✅ Índices: id_aplicacion -> campos reales (salen del JSON)
  const tamboPorAplicacion = useMemo(() => {
    const m = new Map();
    (historico?.aplicaciones ?? []).forEach((a) => {
      m.set(String(a.id_aplicacion), a.tambo_aplicacion ?? "");
    });
    return m;
  }, [historico]);

  const ordenPorAplicacion = useMemo(() => {
    const m = new Map();
    (historico?.aplicaciones ?? []).forEach((a) => {
      m.set(String(a.id_aplicacion), a.orden_carga ?? "");
    });
    return m;
  }, [historico]);

  // ✅ Registros aplanados + enriquecidos (tambo_aplicacion, orden_carga, fecha)
  const registros = useMemo(() => {
    const arr = aplanarAplicaciones(historico) ?? [];

    return arr.map((r) => {
      const idApp = String(r.id_aplicacion ?? "");

      const tamboA =
        r.tambo_aplicacion ?? tamboPorAplicacion.get(idApp) ?? "";

      const orden =
        r.orden_carga ?? ordenPorAplicacion.get(idApp) ?? "";

      // Normalizo fecha por si el aplanado no usa "fecha"
      const fecha = r.fecha ?? r.fecha_aplicacion ?? "";

      return {
        ...r,
        tambo_aplicacion: tamboA,
        orden_carga: orden,
        fecha,
      };
    });
  }, [historico, tamboPorAplicacion, ordenPorAplicacion]);

  // Opciones (solo valores presentes en el histórico)
  const opciones = useMemo(() => {
    // ===== Órdenes presentes =====
    const ordenSet = new Set(
      registros
        .map((r) => r.orden_carga)
        .filter((v) => v != null && String(v).trim() !== "")
        .map((v) => String(v).trim())
    );

    // Ordeno “inteligente”: primero numéricas, luego texto, dentro de cada grupo ascendente
    const ordenesOpc = Array.from(ordenSet).sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      const aNum = Number.isFinite(na) && String(na) === String(Number(a)); // heurística simple
      const bNum = Number.isFinite(nb) && String(nb) === String(Number(b));
      if (aNum && bNum) return na - nb;
      if (aNum && !bNum) return -1;
      if (!aNum && bNum) return 1;
      return a.localeCompare(b, "es");
    });

    // ===== Tambos presentes =====
    const tambosSet = new Set(
      registros
        .map((r) => r.tambo_aplicacion)
        .filter((id) => id != null && String(id).trim() !== "")
        .map((id) => String(id))
    );

    const tambosOpc = Array.from(tambosSet)
      .map((id) => ({
        id_tambo: id,
        nombre_tambo: idxTambos.get(id)?.nombre_tambo ?? id,
      }))
      .sort((a, b) => (a.nombre_tambo ?? "").localeCompare(b.nombre_tambo ?? "", "es"));

    // ===== Lotes presentes =====
    const lotesMap = new Map();
    registros.forEach((r) => {
      (r.lotes ?? []).forEach((l) => {
        const id = l?.id_lote ? String(l.id_lote) : "";
        if (!id) return;
        if (!lotesMap.has(id)) {
          const cat = idxLotes.get(id);
          lotesMap.set(id, {
            id_lote: id,
            nombre_lote: cat?.nombre_lote ?? l.nombre_lote ?? id,
          });
        }
      });
    });
    const lotesOpc = Array.from(lotesMap.values()).sort((a, b) =>
      (a.nombre_lote ?? "").localeCompare(b.nombre_lote ?? "", "es")
    );

    // ===== Insumos presentes =====
    const insumosMap = new Map();
    registros.forEach((r) => {
      (r.insumos ?? []).forEach((i) => {
        const id = i?.id_insumo ? String(i.id_insumo) : "";
        if (!id) return;
        if (!insumosMap.has(id)) {
          const cat = idxInsumos.get(id);
          insumosMap.set(id, {
            id_insumo: id,
            nombre_insumo: cat?.nombre_insumo ?? i.nombre_insumo ?? id,
          });
        }
      });
    });
    const insumosOpc = Array.from(insumosMap.values()).sort((a, b) =>
      (a.nombre_insumo ?? "").localeCompare(b.nombre_insumo ?? "", "es")
    );

    // ===== Proveedores presentes =====
    const provServSet = new Set(registros.map((r) => r.id_prov_serv).filter(Boolean).map(String));
    const provInsSet = new Set(registros.map((r) => r.id_prov_ins).filter(Boolean).map(String));

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

    return { ordenesOpc, tambosOpc, lotesOpc, insumosOpc, provServOpc, provInsOpc };
  }, [registros, idxTambos, idxLotes, idxInsumos, idxProveedores]);

  const norm = (s) =>
    (s ?? "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const resultados = useMemo(() => {
    // Primero aplico lo que tengas en filtrar (fechas, lote, insumo, proveedores, etc.)
    let filtrados = filtrar(registros, filtros);

    // Búsqueda libre
    const q = norm(filtros.texto).trim();
    if (q) {
      filtrados = filtrados.filter((r) => {
        const texto = [
          r.observaciones,
          r.orden_carga,
          r.tambo_aplicacion,
          nombreTambo(r.tambo_aplicacion),
          nombreProveedor(r.id_prov_serv),
          nombreProveedor(r.id_prov_ins),
          ...(r.lotes ?? []).flatMap((l) => [l.id_lote, nombreLote(l.id_lote, l.nombre_lote)]),
          ...(r.insumos ?? []).flatMap((i) => [i.id_insumo, nombreInsumo(i.id_insumo, i.nombre_insumo)]),
        ].join(" ");

        return norm(texto).includes(q);
      });
    }

    return [...filtrados].sort((a, b) =>
      a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0
    );
  }, [registros, filtros, idxTambos, idxLotes, idxInsumos, idxProveedores]);

  const limpiarFiltros = () => {
    setFiltros({
      orden_carga: "todos",
      fechaDesde: "",
      fechaHasta: "",
      id_tambo: "todos",
      id_lote: "todos",
      id_insumo: "todos",
      id_prov_serv: "todos",
      id_prov_ins: "todos",
      texto: "",
    });
  };

  const totalHectareas = useMemo(() => {
    return resultados.reduce((total, r) => {
      const sumaLotes = (r.lotes ?? []).reduce(
        (acc, lote) => acc + (Number(lote.superficie) || 0),
        0
      );
      return total + sumaLotes;
    }, 0);
  }, [resultados]);

  const resumenInsumoSeleccionado = useMemo(() => {
    if (filtros.id_insumo === "todos") return null;
    const id = String(filtros.id_insumo);
    const nombre = idxInsumos.get(id)?.nombre_insumo ?? id;

    let total = 0;
    let unidadTotal = "";

    for (const r of resultados) {
      const item = (r.insumos ?? []).find((i) => String(i.id_insumo) === id);
      if (!item) continue;
      total += parseFloat(item.cantidad_total) || 0;
      unidadTotal = item.unidad_total || unidadTotal;
    }

    const dosisMedia = totalHectareas > 0 ? total / totalHectareas : 0;
    return { id, nombre, total, unidadTotal, dosisMedia };
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
      {!aplicacionSeleccionada && (
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
              {/* ✅ Orden de carga */}
              <div className="col-12 col-md-3">
                <label className="form-label"><b>Orden de carga</b></label>
                <select
                  className="form-select"
                  value={filtros.orden_carga}
                  onChange={(e) => setFiltros((f) => ({ ...f, orden_carga: e.target.value }))}
                >
                  <option value="todos">Todas</option>
                  {opciones.ordenesOpc.map((ord) => (
                    <option key={ord} value={ord}>{ord}</option>
                  ))}
                </select>
              </div>

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
                <label className="form-label"><b>Tambo</b></label>
                <select
                  className="form-select"
                  value={filtros.id_tambo}
                  onChange={(e) => setFiltros((f) => ({ ...f, id_tambo: e.target.value }))}
                >
                  <option value="todos">Todos</option>
                  {opciones.tambosOpc.map((t) => (
                    <option key={t.id_tambo} value={t.id_tambo}>
                      {t.nombre_tambo}
                    </option>
                  ))}
                </select>
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
                    <option key={l.id_lote} value={l.id_lote}>{l.nombre_lote}</option>
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
                    <option key={i.id_insumo} value={i.id_insumo}>{i.nombre_insumo}</option>
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
                    <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre_proveedor}</option>
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
                    <option key={p.id_proveedor} value={p.id_proveedor}>{p.nombre_proveedor}</option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label"><b>Buscar (obs / nombres)</b></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: barbecho, glifosato, nro. orden de carga, T01/L01..."
                  value={filtros.texto}
                  onChange={(e) => setFiltros((f) => ({ ...f, texto: e.target.value }))}
                />
              </div>

              <div className="col-12 col-md-2 d-flex align-items-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  onClick={limpiarFiltros}
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        {!aplicacionSeleccionada && (
          <div className="card-body">
            {resultados.length === 0 ? (
              <div className="alert alert-warning m-0">No hay resultados con esos filtros.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm align-middle">
                  <thead>
                    <tr>
                      <th>Orden</th>
                      <th>Fecha</th>
                      <th>Tambo</th>
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
                      <tr key={`${r.id_aplicacion}_${r.idx_tratamiento ?? 0}`}>
                        <td style={{ whiteSpace: "nowrap" }}>{r.orden_carga ?? ""}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{formatFecha(r.fecha)}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{nombreTambo(r.tambo_aplicacion)}</td>

                        <td>
                          {(r.lotes ?? []).map((l) => (
                            <div key={l.id_lote}>{nombreLote(l.id_lote, l.nombre_lote)}</div>
                          ))}
                        </td>

                        <td>
                          {(r.insumos ?? []).map((i) => (
                            <div key={i.id_insumo} className="mb-2">
                              <div>{nombreInsumo(i.id_insumo, i.nombre_insumo)}</div>
                              <div className="text-muted">
                                Dosis: {i.dosis} · Total: {i.cantidad_total} {i.unidad_total}
                              </div>
                            </div>
                          ))}
                        </td>

                        <td style={{ whiteSpace: "nowrap" }}>{nombreProveedor(r.id_prov_serv)}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{nombreProveedor(r.id_prov_ins)}</td>

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
              <h5 style={{ color: "red" }}>
                <strong>Total hectáreas: {totalHectareas.toFixed(1)} ha</strong>
              </h5>

              <div className="mt-3 d-flex justify-content-end">
                <div className="text-end">
                  {resumenInsumoSeleccionado && (
                    <>
                      <div className="mt-2">
                        <span className="fw-bold">{resumenInsumoSeleccionado.nombre}</span>:{" "}
                        {resumenInsumoSeleccionado.total.toFixed(2)}{" "}
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
          </div>
        )}

        {aplicacionSeleccionada && (
          <div className="card mt-3">
            <div className="card-body">
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => {
                    const copia =
                      typeof structuredClone === "function"
                        ? structuredClone(aplicacionSeleccionada)
                        : JSON.parse(JSON.stringify(aplicacionSeleccionada));
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

              {!modoEdicion ? (
                <ResumenAplicacion
                  ordenCarga={aplicacionSeleccionada.orden_carga}
                  fechaAplicacion={aplicacionSeleccionada.fecha_aplicacion}
                  tamboAplicacion={aplicacionSeleccionada.tambo_aplicacion}
                  tambos={tambos}
                  proveedorServiciosId={aplicacionSeleccionada.id_prov_serv}
                  proveedorInsumosId={aplicacionSeleccionada.id_prov_ins}
                  proveedores={proveedores}
                  tratamientos={aplicacionSeleccionada.tratamientos}
                />
              ) : (
                <AltaAplicacion
                  modo="edicion"
                  aplicacionInicial={aplicacionSeleccionada}
                  tambos={tambos}
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
