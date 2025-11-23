import { PayrollData } from "../../types/data/data";
import { Pool } from "@neondatabase/serverless";

export async function savePayrollToDb(data: PayrollData, txHash: string): Promise<string> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const insertPayrollQuery = `
      INSERT INTO payrolls (day, employer_address, tx_hash)
      VALUES ($1, $2, $3)
      RETURNING id; -- <--- Esto nos devuelve el UUID creado
    `;

    const res = await client.query(insertPayrollQuery, [data.day, data.employerAddress, txHash]);

    const newPayrollId = res.rows[0].id;

    const insertEmployeeQuery = `
      INSERT INTO employees (payroll_id, employee_id, name, wallet_address, amount, email)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    for (const user of data.users) {
      await client.query(insertEmployeeQuery, [
        newPayrollId,
        user.id,
        user.name,
        user.walletAddress,
        user.amount,
        user.email,
      ]);
    }

    await client.query("COMMIT");
    console.log(`Payroll guardado con ID autogenerado: ${newPayrollId}`);

    return newPayrollId;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error guardando en DB:", error);
    throw error;
  } finally {
    client.release();
  }
}

export async function getPayrollsByDay(day: number): Promise<PayrollData[] | null> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const payrollQuery = `
      SELECT id, employer_address
      FROM payrolls
      WHERE day = $1
    `;

    const payrollRes = await client.query(payrollQuery, [day]);

    if (payrollRes.rows.length === 0) {
      return null;
    }

    const payrolls = [];

    for (const payrollRow of payrollRes.rows) {
      const employeesQuery = `
        SELECT employee_id AS id, name, wallet_address AS "walletAddress", amount, email
        FROM employees
        WHERE payroll_id = $1
      `;
      const employeesRes = await client.query(employeesQuery, [payrollRow.id]);

      const payrollData: PayrollData = {
        id: payrollRow.id,
        users: employeesRes.rows,
        day: day,
        employerAddress: payrollRow.employer_address,
      };
      payrolls.push(payrollData);
    }

    return payrolls;
  } catch (error) {
    console.error("Error fetching payrolls by day:", error);
    throw error;
  } finally {
    client.release();
  }
}
