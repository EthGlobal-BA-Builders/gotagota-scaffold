import { NextRequest, NextResponse } from 'next/server';
import { getPayrollsByDay } from '../../services/db'; // Importamos la función

export const dynamic = 'force-dynamic'; // Para evitar cacheo estático en build

export async function POST(req: NextRequest) {
    try {
        // Get current day
        const today = new Date();
        const currentDay = today.getDate();

        console.log(`\n[JOB START] Searching emails for day: ${currentDay}`);

        // Get payrolls for the current day
        const payrolls = (await getPayrollsByDay(currentDay)) ?? [];

        if (payrolls.length === 0) {
            return NextResponse.json({ message: 'No payrolls found for today' });
        }


        // Send emails
        let emailCount = 0;


        for (const payroll of payrolls) {

            for (const emp of payroll.users) {
                if (emp.email) {
                    emailCount++;
                    // Simulated by now -- TODO: Integrate email service
                    console.log(`Sending email to: ${emp.email} | Name: ${emp.name} | Amount: ${emp.amount}`);
                }
            }
        }

        console.log(`[JOB END] ${emailCount} emails processed.\n`);

        return NextResponse.json({
            success: true,
            day: currentDay,
            emailsProcessed: emailCount
        });

    } catch (error) {
        console.error('Error on send-mail:', error);
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}