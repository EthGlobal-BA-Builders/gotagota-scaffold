import { NextRequest, NextResponse } from 'next/server';
import { executePayrollOnChain } from '../../services/blockchain';
import { savePayrollToDb } from '../../services/db';
import { PayrollData } from '../../../types/data/data';

export async function POST(req: NextRequest) {
  try {
    const body: PayrollData = await req.json();

    if (!body.users || body.users.length === 0) {
      return NextResponse.json(
        { error: 'Empty user list' },
        { status: 400 }
      );
    }

    if (!body.employerAddress) {
       return NextResponse.json(
        { error: 'Missing employerAddress' },
        { status: 400 }
      );
    }

    // Execute payroll on blockchain
    // const txHash = await executePayrollOnChain(body);
    const txHash = "0x1234567890abcdef"; // Placeholder for testing

    // Save payroll record to DB
    await savePayrollToDb(body, txHash);

    return NextResponse.json({ 
      success: true, 
      message: 'Payroll minted successfully',
      txHash: txHash,
      payrollId: body.id
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error in endpoint /payroll:', error);
    
    return NextResponse.json(
        { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}