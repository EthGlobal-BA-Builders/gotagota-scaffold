import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { EmployeeData } from '@/types'; 

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'Invalid file uploaded.' },
        { status: 400 }
      );
    }

    // Convert  to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // First sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rawData: unknown[] = XLSX.utils.sheet_to_json(sheet);

    // Map raw data to EmployeeData structure
    const cleanData: EmployeeData[] = rawData.map((row: any) => ({
      id: row.id || row.ID || '',
      name: row.name || row.Name || row.Nombre || '',
      walletAddress: row.walletAddress || row.WalletAddress || row.address || row.Address || row.Direccion || '',
      amount: Number(row.amount || row.Amount || row.Monto || 0),
      email: row.email || row.Email || '',
    }));

    return NextResponse.json({ data: cleanData }, { status: 200 });

  } catch (error) {
    console.error('Error :', error);
    return NextResponse.json(
      { error: 'Internal error processing file.' },
      { status: 500 }
    );
  }
}