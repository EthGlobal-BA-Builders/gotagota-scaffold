import { NextRequest, NextResponse } from "next/server";
import { EmployeeData } from "../../../types/data/data";
import * as XLSX from "xlsx";

/**
 * Parse CSV file content into array of objects
 * Handles quoted fields and various CSV formats
 */
function parseCSV(csvText: string): any[] {
  // Normalize line endings and split into lines
  const normalizedText = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalizedText.split("\n").filter(line => line.trim() !== "");

  if (lines.length === 0) return [];

  // Parse CSV line handling quoted fields
  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current.trim());
    return result;
  }

  // Parse header
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/^"|"$/g, ""));

  // Parse data rows
  const data: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, "").trim());

    // Skip empty rows
    if (values.length === 0 || values.every(v => v === "")) continue;

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    data.push(row);
  }

  return data;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Invalid file uploaded." }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const isCSV = fileName.endsWith(".csv");
    const isExcel = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");

    if (!isCSV && !isExcel) {
      return NextResponse.json({ error: "Unsupported file type. Please upload a CSV or Excel file." }, { status: 400 });
    }

    let rawData: unknown[];

    if (isCSV) {
      // Parse CSV file
      const text = await file.text();
      rawData = parseCSV(text);
    } else {
      // Parse Excel file
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rawData = XLSX.utils.sheet_to_json(sheet);
    }

    // Map raw data to EmployeeData structure
    // Support both CSV template format (employee_address) and Excel format variations
    const cleanData: EmployeeData[] = rawData
      .map((row: any, index: number) => {
        // Generate ID if not present
        const id = row.id || row.ID || String(index + 1);

        // Map name field (various formats)
        const name = row.name || row.Name || row.Nombre || "";

        // Map wallet address (CSV uses employee_address, Excel uses various formats)
        const walletAddress =
          row.employee_address ||
          row.employeeAddress ||
          row.walletAddress ||
          row.WalletAddress ||
          row.address ||
          row.Address ||
          row.Direccion ||
          "";

        // Map amount (CSV uses amount, Excel uses various formats)
        const amount = Number(row.amount || row.Amount || row.Monto || 0);

        // Map email
        const email = row.email || row.Email || "";

        return {
          id,
          name,
          walletAddress,
          amount,
          email,
        };
      })
      .filter((employee: EmployeeData) => {
        // Filter out empty rows
        return employee.name && employee.walletAddress && employee.amount > 0;
      });

    return NextResponse.json({ data: cleanData }, { status: 200 });
  } catch (error) {
    console.error("Error processing file:", error);
    return NextResponse.json({ error: "Internal error processing file." }, { status: 500 });
  }
}
