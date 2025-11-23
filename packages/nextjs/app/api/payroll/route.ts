import { NextRequest, NextResponse } from "next/server";
import { executePayrollOnChain } from "../../services/blockchain";

interface PayrollRequest {
  paymentDay: number;
  duration: number;
  expectedTotalAmount: string;
  employees: Array<{
    name: string;
    email: string;
    walletAddress: string;
    amount: number;
  }>;
  employerAddress: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: PayrollRequest = await req.json();

    if (!body.employees || body.employees.length === 0) {
      return NextResponse.json({ error: "Empty employee list" }, { status: 400 });
    }

    if (!body.employerAddress) {
      return NextResponse.json({ error: "Missing employerAddress" }, { status: 400 });
    }

    if (!body.paymentDay || body.paymentDay < 1 || body.paymentDay > 31) {
      return NextResponse.json({ error: "Invalid payment day (must be 1-31)" }, { status: 400 });
    }

    if (!body.duration || body.duration < 1 || body.duration > 60) {
      return NextResponse.json({ error: "Invalid duration (must be 1-60 months)" }, { status: 400 });
    }

    // Execute payroll on blockchain
    const result = await executePayrollOnChain({
      paymentDay: body.paymentDay,
      duration: body.duration,
      expectedTotalAmount: body.expectedTotalAmount,
      employees: body.employees,
      employerAddress: body.employerAddress,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Payroll created successfully",
        txHash: result.txHash,
        payrollId: result.payrollId.toString(),
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error in endpoint /payroll:", error);

    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
