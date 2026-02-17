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

                // (si querés que el histórico pueda filtrar sin “inyectar”)
                orden_carga: app.orden_carga ?? "",
                tambo_aplicacion: app.tambo_aplicacion ?? "",

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

    return (registros ?? []).filter((r) => {
        // ===== FECHAS =====
        if (dDesde || dHasta) {
            const fr = parseYMD(r.fecha);
            if (!fr) return false;
            if (dDesde && fr < dDesde) return false;
            if (dHasta && fr > dHasta) return false;
        }

        // ===== ORDEN DE CARGA (NUEVO) =====
        if (filtros.orden_carga !== "todos") {
            // comparo como string para tolerar números/strings
            if (String(r.orden_carga ?? "") !== String(filtros.orden_carga ?? "")) return false;
        }

        // ===== TAMBO (NUEVO) =====
        // El filtro viene como id_tambo, el dato real en el registro es tambo_aplicacion
        if (filtros.id_tambo !== "todos") {
            if (String(r.tambo_aplicacion ?? "") !== String(filtros.id_tambo ?? "")) return false;
        }

        // ===== PROVEEDORES =====
        if (filtros.id_prov_serv !== "todos" && r.id_prov_serv !== filtros.id_prov_serv) return false;
        if (filtros.id_prov_ins !== "todos" && r.id_prov_ins !== filtros.id_prov_ins) return false;

        // ===== LOTE =====
        if (filtros.id_lote !== "todos") {
            const ok = (r.lotes ?? []).some((l) => String(l.id_lote) === String(filtros.id_lote));
            if (!ok) return false;
        }

        // ===== INSUMO =====
        if (filtros.id_insumo !== "todos") {
            const ok = (r.insumos ?? []).some((i) => String(i.id_insumo) === String(filtros.id_insumo));
            if (!ok) return false;
        }

        return true;
    });
};
