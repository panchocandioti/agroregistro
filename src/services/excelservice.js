import * as XLSX from "xlsx";

function parseExcelArrayBuffer(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("El Excel no tiene hojas.");

  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, { defval: "" });
}

export const leerExcelDesdeArrayBuffer = async (arrayBuffer) => {
  if (!arrayBuffer) throw new Error("Buffer vacío al leer el Excel.");
  return parseExcelArrayBuffer(arrayBuffer);
};
