"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Address } from "@scaffold-ui/components";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";

// Mock data para simular el excel cargado
const mockPayrollData = [
  { id: 1, employee: "John Doe", wallet: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", salary: 5000 },
  { id: 2, employee: "Jane Smith", wallet: "0x8ba1f109551bD432803012645Hac136c22C929", salary: 4500 },
  { id: 3, employee: "Bob Johnson", wallet: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", salary: 6000 },
  { id: 4, employee: "Alice Williams", wallet: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", salary: 5200 },
  { id: 5, employee: "Charlie Brown", wallet: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", salary: 4000 },
];

// Mock data del payroll info que vendrá del backend
const mockPayrollInfo = {
  uploadedFile: "payroll_feb.xlsx",
  employees: 24,
  startDate: "February 1, 2025",
  duration: 12,
  endDate: "January, 2026",
};

export default function SummaryPage() {
  const [payrollData] = useState(mockPayrollData);
  const [payrollInfo] = useState(mockPayrollInfo);
  const router = useRouter();
  const { targetNetwork } = useTargetNetwork();

  const handleCreatePayrollRun = async () => {
    // Esta función estará lista para cuando el backend esté disponible
    // try {
    //   const response = await fetch("/api/create-payroll-run", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ payrollData, payrollInfo }),
    //   })
    //   const data = await response.json()
    //   // Manejar la respuesta del backend
    // } catch (error) {
    //   console.error("Error creating payroll run:", error)
    // }

    // Por ahora, navegar a la página de éxito
    router.push("/success");
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="flex items-center justify-center min-h-screen py-10 bg-gray-50">
      <div className="w-full max-w-6xl px-5 space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">Payroll Summary</h1>

        {/* Información del Payroll */}
        <div className="bg-base-100 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Payroll Information</h2>
          <div className="space-y-2">
            <p className="text-gray-700">
              <span className="font-semibold">Uploaded file:</span> {payrollInfo.uploadedFile}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Employees:</span> {payrollInfo.employees}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Start date:</span> {payrollInfo.startDate}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Duration:</span> {payrollInfo.duration} months
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">End date:</span> {payrollInfo.endDate}
            </p>
          </div>
        </div>

        {/* Vista del Excel Cargado */}
        <div className="bg-base-100 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Payroll Data</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Wallet</th>
                  <th>Salary</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map(row => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.employee}</td>
                    <td>
                      <Address address={row.wallet as `0x${string}`} chain={targetNetwork} />
                    </td>
                    <td>${row.salary.toLocaleString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botón Create Payroll Run */}
        <button
          onClick={handleCreatePayrollRun}
          className="w-full bg-pink-600 hover:bg-pink-700 text-white py-6 text-lg font-semibold rounded-2xl btn"
        >
          Create Payroll Run
        </button>

        {/* Botón Back */}
        <div className="flex justify-center">
          <button onClick={handleBack} className="btn btn-ghost btn-sm text-gray-600 hover:text-gray-800">
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
