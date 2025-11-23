"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EmployeeData } from "../types/data/data";
import { downloadPayrollTemplate } from "~~/utils/downloadPayrollTemplate";

export function PayrollForm() {
  const [duration, setDuration] = useState("");
  const [paymentDay, setPaymentDay] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Aquí se enviará el archivo al backend cuando esté disponible
      handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/decode", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error uploading file:", errorData.error);
        alert(`Error: ${errorData.error || "Failed to process file"}`);
        return;
      }

      const data = await response.json();
      console.log("File processed successfully:", data);
      // Store the decoded employee data
      if (data.data && Array.isArray(data.data)) {
        setEmployees(data.data);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("An error occurred while processing the file. Please try again.");
    }
  };

  const handleVerify = () => {
    // Validate required fields
    if (!duration || !paymentDay) {
      alert("Please fill in all required fields (Duration and Payment Day)");
      return;
    }

    if (employees.length === 0) {
      alert("Please upload a payroll file with employee data");
      return;
    }

    // Calculate end date based on duration
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + parseInt(duration));

    // Store payroll data in localStorage to pass to summary page
    const payrollInfo = {
      uploadedFile: selectedFile?.name || "payroll_file",
      employees: employees.length,
      paymentDay: parseInt(paymentDay),
      duration: parseInt(duration),
      startDate: startDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      endDate: endDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };

    localStorage.setItem("payrollInfo", JSON.stringify(payrollInfo));
    localStorage.setItem("payrollEmployees", JSON.stringify(employees));

    router.push("/summary");
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-pink-50 rounded-lg p-6 border border-pink-100 space-y-4">
        <h2 className="text-2xl font-bold text-pink-600 text-center">Upload the payroll file</h2>

        <div className="flex flex-col items-center space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".xlsx,.xls,.csv"
            className="hidden"
            id="file-upload"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-semibold btn"
          >
            Choose Excel or CSV File
          </button>
          {selectedFile && (
            <p className="text-sm text-gray-700">
              Selected: <span className="font-semibold">{selectedFile.name}</span>
            </p>
          )}
        </div>

        <p className="text-center">
          <button
            onClick={downloadPayrollTemplate}
            type="button"
            className="text-gray-600 hover:text-gray-800 text-sm underline cursor-pointer bg-transparent border-none p-0 font-inherit"
          >
            Download the payroll template
          </button>
        </p>
      </div>

      {/* Duration Input */}
      <div className="space-y-2">
        <label className="block text-gray-700 font-medium text-sm">Duration (in months):</label>
        <input
          type="number"
          placeholder="Enter duration"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          className="w-full input input-bordered border-gray-200 focus:border-blue-500 focus:ring-blue-500 px-5"
        />
      </div>

      {/* Payment Day Input */}
      <div className="space-y-2">
        <label className="block text-gray-700 font-medium text-sm">Payment day of month (1-31):</label>
        <select
          value={paymentDay}
          onChange={e => setPaymentDay(e.target.value)}
          className="w-full select select-bordered border-blue-400 focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="">Select day</option>
          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">Employees can claim their payment on this day each month</p>
      </div>

      {/* Verify Button */}
      <button
        onClick={handleVerify}
        disabled={!duration || !paymentDay || employees.length === 0}
        className="w-full bg-pink-600 hover:bg-pink-700 text-white py-6 text-lg font-semibold rounded-2xl mt-8 btn disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Verify Payroll Information
      </button>
      {employees.length > 0 && (
        <p className="text-sm text-green-600 text-center mt-2">✓ {employees.length} employee(s) loaded from file</p>
      )}
    </div>
  );
}
