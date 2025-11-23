"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface ClaimStatus {
  type: "idle" | "loading" | "success" | "error";
  message?: string;
  txHash?: string;
}

export default function ClaimPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>({ type: "idle" });

  // Get query parameters
  const payrollId = searchParams.get("payrollId");
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  // Read employee payment data
  const { data: employeePayment, isLoading: isLoadingPayment } = useScaffoldReadContract({
    contractName: "Payroll",
    functionName: "getEmployeePayment",
    args: payrollId && address ? [BigInt(payrollId), address] : ([undefined, undefined] as any),
  } as any);

  // Read if month is claimable
  const { data: isClaimable } = useScaffoldReadContract({
    contractName: "Payroll",
    functionName: "isMonthClaimable",
    args:
      payrollId && month && year
        ? [BigInt(payrollId), BigInt(month), BigInt(year)]
        : ([undefined, undefined, undefined] as any),
  } as any);

  // Write contract hook for claiming
  const { writeContractAsync, isMining } = useScaffoldWriteContract({
    contractName: "Payroll",
  });

  // Validate query params
  useEffect(() => {
    if (!payrollId || !month || !year) {
      setClaimStatus({
        type: "error",
        message: "Missing required parameters. Please check your claim link.",
      });
    }
  }, [payrollId, month, year]);

  // Check wallet connection
  useEffect(() => {
    if (!isConnected && payrollId && month && year) {
      notification.warning("Please connect your wallet to claim your salary");
    }
  }, [isConnected, payrollId, month, year]);

  const handleClaim = async () => {
    if (!payrollId || !month || !year || !address) {
      setClaimStatus({
        type: "error",
        message: "Missing required information. Please check your claim link and wallet connection.",
      });
      return;
    }

    if (!isClaimable) {
      setClaimStatus({
        type: "error",
        message: "This month is not yet claimable. Please wait until the payment day.",
      });
      return;
    }

    setClaimStatus({ type: "loading", message: "Processing your claim..." });

    try {
      const txHash = await writeContractAsync({
        functionName: "claimPayroll",
        args: [BigInt(payrollId), BigInt(month), BigInt(year)],
      });

      if (txHash) {
        setClaimStatus({
          type: "success",
          message: "Your salary has been claimed successfully!",
          txHash: txHash,
        });
        notification.success("Salary claimed successfully!");
      }
    } catch (error: any) {
      console.error("Error claiming payroll:", error);
      let errorMessage = "Failed to claim salary. Please try again.";

      // Parse common error messages
      if (error.message) {
        if (error.message.includes("Not eligible")) {
          errorMessage = "You are not eligible for this payroll.";
        } else if (error.message.includes("Already claimed")) {
          errorMessage = "You have already claimed this month's salary.";
        } else if (error.message.includes("not claimable")) {
          errorMessage = "This month is not yet claimable. Please wait until the payment day.";
        } else if (error.message.includes("Insufficient contract balance")) {
          errorMessage = "The payroll contract has insufficient funds. Please contact your employer.";
        } else if (error.message.includes("User rejected")) {
          errorMessage = "Transaction was rejected.";
        } else {
          errorMessage = error.message;
        }
      }

      setClaimStatus({
        type: "error",
        message: errorMessage,
      });
    }
  };

  const handleBackHome = () => {
    // Reload the page
    window.location.reload();
  };

  // Format month name
  const getMonthName = (monthNum: string) => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthIndex = parseInt(monthNum) - 1;
    return monthIndex >= 0 && monthIndex < 12 ? monthNames[monthIndex] : monthNum;
  };

  // Calculate amount in ETH
  // getEmployeePayment returns a struct: { employee: address, monthlyAmount: uint256, totalMonths: uint256 }
  const employeePaymentData = employeePayment as
    | { employee: string; monthlyAmount: bigint; totalMonths: bigint }
    | undefined;
  const monthlyAmount = employeePaymentData?.monthlyAmount
    ? parseFloat(formatEther(employeePaymentData.monthlyAmount))
    : 0;

  // Format amount as USD (assuming 1 ETH = $3000 for display, adjust as needed)
  const ETH_TO_USD = 3000;
  const amountUSD = monthlyAmount * ETH_TO_USD;

  return (
    <div className="flex items-center justify-center min-h-screen py-10 bg-gray-50">
      <div className="w-full max-w-2xl px-5 flex flex-col items-center space-y-8">
        {/* Logo */}
        <div className="flex relative w-40 h-20">
          <Image alt="Logo" className="cursor-pointer" fill src="/logo.png" onClick={handleBackHome} />
        </div>

        {/* Main Content */}
        {isLoadingPayment ? (
          <div className="text-center space-y-4">
            <div className="loading loading-spinner loading-lg"></div>
            <p className="text-gray-700">Loading payroll information...</p>
          </div>
        ) : claimStatus.type === "success" ? (
          // Success State
          <div className="text-center space-y-8 w-full">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-gray-800">SUCCESS!</h1>
              <p className="text-xl text-gray-700">Your salary has been claimed</p>
            </div>

            {claimStatus.txHash && (
              <div className="bg-gray-100 rounded-lg p-4 text-sm">
                <p className="text-gray-600">Transaction Hash:</p>
                <p className="text-gray-800 font-mono break-all">{claimStatus.txHash}</p>
              </div>
            )}

            <button
              onClick={handleBackHome}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white py-6 text-lg font-semibold rounded-2xl btn"
            >
              Back Home
            </button>
          </div>
        ) : claimStatus.type === "error" ? (
          // Error State
          <div className="text-center space-y-8 w-full">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-red-600">Error</h1>
              <p className="text-lg text-gray-700">{claimStatus.message}</p>
            </div>

            <button
              onClick={handleBackHome}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-6 text-lg font-semibold rounded-2xl btn"
            >
              Refresh
            </button>
          </div>
        ) : (
          // Claim Ready State
          <div className="text-center space-y-8 w-full">
            {/* Title */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800">Your salary is ready</h1>
            </div>

            {/* Payroll Details Box */}
            <div className="bg-gray-100 rounded-xl p-6 space-y-4 w-full">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Amount available:</span>
                <span className="text-gray-800 font-bold text-xl">
                  ${amountUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Pay period:</span>
                <span className="text-gray-800 font-semibold">
                  {month && year ? `${getMonthName(month)} ${year}` : "N/A"}
                </span>
              </div>
              {monthlyAmount > 0 && (
                <div className="pt-2 border-t border-gray-300">
                  <p className="text-sm text-gray-600">{monthlyAmount.toFixed(6)} ETH</p>
                </div>
              )}
            </div>

            {/* Status Messages */}
            {!isConnected && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 w-full">
                <p className="text-yellow-800 text-sm">Please connect your wallet to claim your salary.</p>
              </div>
            )}

            {isConnected && !isClaimable && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
                <p className="text-blue-800 text-sm">
                  This month is not yet claimable. Please wait until the payment day.
                </p>
              </div>
            )}

            {claimStatus.type === "loading" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
                <div className="flex items-center justify-center space-x-2">
                  <div className="loading loading-spinner loading-sm"></div>
                  <p className="text-blue-800 text-sm">{claimStatus.message}</p>
                </div>
              </div>
            )}

            {/* Claim Button */}
            <button
              onClick={handleClaim}
              disabled={!isConnected || !isClaimable || isMining || claimStatus.type === "loading"}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white py-6 text-lg font-semibold rounded-2xl btn disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
            >
              {isMining || claimStatus.type === "loading" ? "Processing..." : "Claim"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
