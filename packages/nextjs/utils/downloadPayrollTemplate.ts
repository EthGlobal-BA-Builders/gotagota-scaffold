/**
 * Downloads a CSV template file for payroll management
 * The template includes the required fields for adding employees to a payroll
 */
export function downloadPayrollTemplate() {
  // CSV headers matching the contract requirements
  const headers = ["name", "email", "employee_address", "amount"];

  // Example rows to guide users
  const exampleRows = [
    ["John Doe", "john.doe@example.com", "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", "1.5"],
    ["Jane Smith", "jane.smith@example.com", "0x8ba1f109551bD432803012645ac136c22C9299", "2.0"],
    ["Bob Johnson", "bob.johnson@example.com", "0x1234567890123456789012345678901234567890", "0.5"],
  ];

  // Create CSV content
  const csvContent = [headers.join(","), ...exampleRows.map(row => row.join(","))].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", "payroll_template.csv");
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL object
  URL.revokeObjectURL(url);
}
