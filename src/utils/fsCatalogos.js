export function fsAccessSupported() {
    return !!window.showDirectoryPicker;
}

async function ensurePermission(handle) {
    const q = await handle.queryPermission({ mode: "read" });
    if (q === "granted") return true;

    const r = await handle.requestPermission({ mode: "read" });
    return r === "granted";
}

async function readFileArrayBufferFromDir(dirHandle, filename) {
    const ok = await ensurePermission(dirHandle);
    if (!ok) throw new Error("Permiso denegado para leer la carpeta seleccionada.");

    const fileHandle = await dirHandle.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return await file.arrayBuffer();
}

export async function loadCatalogosFromDir(dirHandle, leerExcelDesdeArrayBuffer) {
    const [bufLotes, bufInsumos, bufProveedores] = await Promise.all([
        readFileArrayBufferFromDir(dirHandle, "lotes.xlsx"),
        readFileArrayBufferFromDir(dirHandle, "insumos.xlsx"),
        readFileArrayBufferFromDir(dirHandle, "proveedores.xlsx"),
    ]);

    const [lotes, insumos, proveedores] = await Promise.all([
        leerExcelDesdeArrayBuffer(bufLotes),
        leerExcelDesdeArrayBuffer(bufInsumos),
        leerExcelDesdeArrayBuffer(bufProveedores),
    ]);

    return { lotes, insumos, proveedores };
}
