export const unidadTotalDesdeUnidadDosis = (unidadDosis = "") => {
  const u = String(unidadDosis).trim();

  // Casos comunes: "L/ha", "kg/ha", "cc/ha"
  let out = u.replace(/\/\s*ha$/i, "").trim();

  // Casos comunes en castellano: "L x hectárea", "L por hectárea", etc.
  out = out
    .replace(/\s*x\s*hect[aá]rea$/i, "")
    .replace(/\s*por\s*hect[aá]rea$/i, "")
    .replace(/\s*x\s*ha$/i, "")
    .replace(/\s*por\s*ha$/i, "")
    .trim();

  return out || u; // fallback: si no pudo limpiar nada, devolvemos lo original
};
