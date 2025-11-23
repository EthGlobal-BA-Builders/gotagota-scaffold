"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EmployeeData } from "../../types/data/data";
import { Address } from "@scaffold-ui/components";
import { isAddress } from "viem";
import { mainnet } from "viem/chains";
import { useAccount, usePublicClient } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { validateAndResolveAddress } from "~~/utils/validateAndResolveAddress";

interface PayrollInfo {
  uploadedFile: string;
  employees: number;
  paymentDay: number;
  duration: number;
  startDate: string;
  endDate: string;
}

interface WalletValidation {
  original: string;
  resolvedAddress: string | null;
  isValid: boolean;
  isENS: boolean;
  error: string | null;
  isLoading: boolean;
}

export default function SummaryPage() {
  const [payrollData, setPayrollData] = useState<
    Array<{ id: string; employee: string; email: string; wallet: string; salary: number }>
  >([]);
  const [payrollInfo, setPayrollInfo] = useState<PayrollInfo | null>(null);
  const [walletValidations, setWalletValidations] = useState<Record<string, WalletValidation>>({});
  const router = useRouter();
  const { targetNetwork } = useTargetNetwork();
  const { address } = useAccount();
  // Use mainnet public client for ENS resolution (ENS only works on mainnet)
  const mainnetPublicClient = usePublicClient({ chainId: mainnet.id });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Load data from localStorage
    const storedInfo = localStorage.getItem("payrollInfo");
    const storedEmployees = localStorage.getItem("payrollEmployees");

    if (storedInfo && storedEmployees) {
      try {
        const info: PayrollInfo = JSON.parse(storedInfo);
        const employees: EmployeeData[] = JSON.parse(storedEmployees);

        setPayrollInfo(info);

        // Transform EmployeeData to the format expected by the table
        const transformedData = employees.map((emp, index) => ({
          id: emp.id || String(index + 1),
          employee: emp.name || "Unknown",
          email: emp.email || "",
          wallet: emp.walletAddress || "",
          salary: emp.amount || 0,
        }));

        setPayrollData(transformedData);

        // Validate and resolve all wallet addresses/ENS domains
        const validateWallets = async () => {
          if (!mainnetPublicClient) {
            // If no mainnet client, mark all as loading (will show as invalid later)
            const loadingMap: Record<string, WalletValidation> = {};
            transformedData.forEach(row => {
              loadingMap[row.id] = {
                original: row.wallet || "",
                resolvedAddress: null,
                isValid: false,
                isENS: false,
                error: "ENS resolution unavailable",
                isLoading: false,
              };
            });
            setWalletValidations(loadingMap);
            return;
          }

          // Set loading state initially
          const loadingMap: Record<string, WalletValidation> = {};
          transformedData.forEach(row => {
            if (row.wallet) {
              loadingMap[row.id] = {
                original: row.wallet,
                resolvedAddress: null,
                isValid: false,
                isENS: false,
                error: null,
                isLoading: true,
              };
            }
          });
          setWalletValidations(loadingMap);

          const validationPromises = transformedData.map(async row => {
            if (!row.wallet) {
              return {
                key: row.id,
                validation: {
                  original: "",
                  resolvedAddress: null,
                  isValid: false,
                  isENS: false,
                  error: "No address provided",
                  isLoading: false,
                },
              };
            }

            const validation = await validateAndResolveAddress(row.wallet, mainnetPublicClient);
            return {
              key: row.id,
              validation: {
                original: row.wallet,
                resolvedAddress: validation.address,
                isValid: validation.isValid,
                isENS: validation.isENS,
                error: validation.error,
                isLoading: false,
              },
            };
          });

          const validations = await Promise.all(validationPromises);
          const validationMap: Record<string, WalletValidation> = {};
          validations.forEach(({ key, validation }) => {
            validationMap[key] = validation;
          });
          setWalletValidations(validationMap);
        };

        validateWallets();
      } catch (error) {
        console.error("Error parsing stored payroll data:", error);
        // If there's an error, redirect back to home
        router.push("/");
      }
    } else {
      // If no data found, redirect back to home
      router.push("/");
    }
  }, [router, mainnetPublicClient]);

  const handleCreatePayrollRun = async () => {
    if (!address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!payrollInfo || payrollData.length === 0) {
      alert("Missing payroll data");
      return;
    }

    // Validate all addresses are valid
    const invalidAddresses = payrollData.filter(
      row =>
        !walletValidations[row.id] || !walletValidations[row.id].isValid || !walletValidations[row.id].resolvedAddress,
    );

    if (invalidAddresses.length > 0) {
      alert(
        `Please fix invalid addresses before creating payroll. Found ${invalidAddresses.length} invalid address(es).`,
      );
      return;
    }

    setIsCreating(true);

    try {
      // Calculate total amount (sum of all monthly amounts * duration)
      const totalMonthlyAmount = payrollData.reduce((sum, row) => sum + row.salary, 0);
      const expectedTotalAmount = totalMonthlyAmount * payrollInfo.duration;

      // Prepare employees data with resolved addresses
      const employees = payrollData.map(row => ({
        name: row.employee,
        email: row.email,
        walletAddress: walletValidations[row.id].resolvedAddress!,
        amount: row.salary,
      }));

      const response = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentDay: payrollInfo.paymentDay,
          duration: payrollInfo.duration,
          expectedTotalAmount: expectedTotalAmount.toString(),
          employees: employees,
          employerAddress: address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payroll");
      }

      // Store the payroll ID and transaction hash
      localStorage.setItem("payrollTxHash", data.txHash);
      localStorage.setItem("payrollId", data.payrollId.toString());

      // Navigate to success page
      router.push("/success");
    } catch (error: any) {
      console.error("Error creating payroll run:", error);
      alert(`Error creating payroll: ${error.message || "Unknown error"}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (!payrollInfo || payrollData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-600">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen py-10 bg-gray-50">
      <div className="w-full max-w-6xl px-5 space-y-8">
        <h1 className="text-3xl font-bold text-center mb-8">Payroll Summary</h1>

        {/* Información del Payroll */}
        <div className="bg-base-100 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-white">Payroll Information</h2>
          <div className="space-y-2">
            <p className="text-white">
              <span className="font-semibold">Uploaded file:</span> {payrollInfo.uploadedFile}
            </p>
            <p className="text-white">
              <span className="font-semibold">Employees:</span> {payrollInfo.employees}
            </p>
            <p className="text-white">
              <span className="font-semibold">Payment day:</span> Day {payrollInfo.paymentDay} of each month
            </p>
            <p className="text-white">
              <span className="font-semibold">Start date:</span> {payrollInfo.startDate}
            </p>
            <p className="text-white">
              <span className="font-semibold">Duration:</span> {payrollInfo.duration} months
            </p>
            <p className="text-white">
              <span className="font-semibold">End date:</span> {payrollInfo.endDate}
            </p>
          </div>
        </div>

        {/* Vista del Excel Cargado */}
        <div className="bg-base-100 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-white">Payroll Data</h2>
            <div className="text-right">
              <p className="text-sm text-white">Total Monthly Amount</p>
              <p className="text-lg font-bold text-pink-600">
                {payrollData
                  .reduce((sum, row) => sum + row.salary, 0)
                  .toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  })}{" "}
                ETH
              </p>
              <p className="text-xs text-white">
                Total for {payrollInfo.duration} months:{" "}
                {(payrollData.reduce((sum, row) => sum + row.salary, 0) * payrollInfo.duration).toLocaleString(
                  "en-US",
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6,
                  },
                )}{" "}
                ETH
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-white">
              <thead>
                <tr className="text-white">
                  <th className="text-white">ID</th>
                  <th className="text-white">Employee</th>
                  <th className="text-white">Email</th>
                  <th className="text-white">Wallet</th>
                  <th className="text-white">Monthly Amount (ETH)</th>
                </tr>
              </thead>
              <tbody>
                {payrollData.map(row => (
                  <tr key={row.id} className="text-white">
                    <td className="text-white">{row.id}</td>
                    <td className="text-white">{row.employee}</td>
                    <td className="text-white">{row.email || "-"}</td>
                    <td>
                      {(() => {
                        const validation = walletValidations[row.id];
                        if (!row.wallet) {
                          return <span className="text-white">No address</span>;
                        }

                        if (!validation || validation.isLoading) {
                          return <span className="text-white">Validating...</span>;
                        }

                        if (validation.isValid && validation.resolvedAddress) {
                          // Show the resolved address (or original if it was already an address)
                          const displayAddress = isAddress(validation.original)
                            ? validation.original
                            : validation.resolvedAddress;
                          return (
                            <div className="flex flex-col gap-1">
                              <Address address={displayAddress as `0x${string}`} chain={targetNetwork} />
                            </div>
                          );
                        }

                        // Invalid address or ENS domain
                        return (
                          <span className="text-red-400 font-semibold">
                            Invalid address
                            {validation.isENS && ` (${validation.original} not found)`}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="text-white">
                      {row.salary.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} ETH
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Botón Create Payroll Run */}
        <button
          onClick={handleCreatePayrollRun}
          disabled={isCreating}
          className="w-full bg-pink-600 hover:bg-pink-700 text-white py-6 text-lg font-semibold rounded-2xl btn disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? "Creating Payroll..." : "Create Payroll Run"}
        </button>

        {/* Botón Back */}
        <div className="flex justify-center">
          <button onClick={handleBack} className="btn btn-ghost btn-sm text-gray-600 hover:!text-white">
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
