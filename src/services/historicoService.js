export const parseYMD = (ymd) => {
    if (!ymd) return null;
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(y, m - 1, d);
};

export const formatFecha = (ymd) => {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
};

export const aplanarAplicaciones = (historico) => {
    const apps = historico?.aplicaciones ?? [];
    const out = [];

    for (const app of apps) {
        const tratamientos = app.tratamientos ?? [];
        tratamientos.forEach((t, idxTrat) => {
            out.push({
                id_aplicacion: app.id_aplicacion,
                created_at: app.created_at,
                fecha: app.fecha_aplicacion,
                id_prov_serv: app.id_prov_serv,
                id_prov_ins: app.id_prov_ins,
                idx_tratamiento: idxTrat,
                lotes: t.lotes ?? [],
                insumos: t.insumos ?? [],
                observaciones: t.observaciones ?? "",
            });
        });
    }

    return out;
};

export const filtrar = (registros, filtros) => {
    const dDesde = parseYMD(filtros.fechaDesde);
    const dHasta = parseYMD(filtros.fechaHasta);

    return registros.filter((r) => {
        if (dDesde || dHasta) {
            const fr = parseYMD(r.fecha);
            if (!fr) return false;
            if (dDesde && fr < dDesde) return false;
            if (dHasta && fr > dHasta) return false;
        }

        if (filtros.id_prov_serv !== "todos" && r.id_prov_serv !== filtros.id_prov_serv) return false;
        if (filtros.id_prov_ins !== "todos" && r.id_prov_ins !== filtros.id_prov_ins) return false;

        if (filtros.id_lote !== "todos") {
            const ok = r.lotes.some((l) => l.id_lote === filtros.id_lote);
            if (!ok) return false;
        }

        if (filtros.id_insumo !== "todos") {
            const ok = r.insumos.some((i) => i.id_insumo === filtros.id_insumo);
            if (!ok) return false;
        }

        return true;
    });
};
