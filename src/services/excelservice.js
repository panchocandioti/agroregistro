import * as XLSX from "xlsx";

export const leerExcelDesdeUrl = async (url) => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();

  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  return XLSX.utils.sheet_to_json(worksheet, { defval: "" });
};