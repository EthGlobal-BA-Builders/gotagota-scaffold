export interface EmployeeData {
  id: string;
  payrollId?: string;
  name: string;
  walletAddress: string; 
  amount: number;
  email: string;
}

export interface PayrollData {
  id: string;
  users: EmployeeData[];
  day: number;
  employerAddress: string; 
}


