import { Pool } from '@neondatabase/serverless';
import { PayrollData } from '../../types/data/data';

export async function savePayrollToDb(data: PayrollData, txHash: string): Promise<string> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const insertPayrollQuery = `
      INSERT INTO payrolls (day, employer_address, tx_hash)
      VALUES ($1, $2, $3)
      RETURNING id; -- <--- Esto nos devuelve el UUID creado
    `;
    
    const res = await client.query(insertPayrollQuery, [
      data.day,
      data.employerAddress,
      txHash
    ]);

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
        user.email
      ]);
    }

    await client.query('COMMIT');
    console.log(`Payroll guardado con ID autogenerado: ${newPayrollId}`);

    return newPayrollId;

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error guardando en DB:', error);
    throw error;
  } finally {
    client.release();
  }
}