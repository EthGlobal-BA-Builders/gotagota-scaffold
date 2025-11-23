import deployedContracts from "../../contracts/deployedContracts";
import { Address, createPublicClient, createWalletClient, getContract, http, parseEther, parseEventLogs } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";

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

interface PayrollResult {
  txHash: string;
  payrollId: bigint;
}

export async function executePayrollOnChain(data: PayrollRequest): Promise<PayrollResult> {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    throw new Error("Missing blockchain configuration in environment variables (RPC_URL and PRIVATE_KEY required)");
  }

  // Validate RPC URL doesn't contain placeholder
  if (
    rpcUrl.includes("YOUR_ALCHEMY_API_KEY") ||
    rpcUrl.includes("YOUR_API_KEY") ||
    rpcUrl.includes("YOUR_PROJECT_ID")
  ) {
    throw new Error(
      `Invalid RPC URL: Please replace the placeholder in your .env file with an actual API key. ` +
        `Current URL: ${rpcUrl.replace(/\/v2\/[^/]+/, "/v2/***")}`,
    );
  }

  // Validate private key format
  if (!privateKey.startsWith("0x") || privateKey.length !== 66) {
    throw new Error(
      `Invalid PRIVATE_KEY format. Expected: 0x followed by 64 hex characters. ` +
        `Got: ${privateKey.substring(0, 10)}... (length: ${privateKey.length})`,
    );
  }

  // Get contract address from deployed contracts (Arbitrum Sepolia - chain ID 421614)
  const contractData = deployedContracts[421614]?.Payroll;
  if (!contractData) {
    throw new Error("Payroll contract not found in deployed contracts. Make sure the contract is deployed.");
  }

  const contractAddress = contractData.address as Address;
  const contractABI = contractData.abi;

  // Create wallet client with private key
  let account;
  let walletClient;
  let publicClient;

  try {
    account = privateKeyToAccount(`0x${privateKey.replace(/^0x/, "")}` as `0x${string}`);
    walletClient = createWalletClient({
      account,
      chain: arbitrumSepolia,
      transport: http(rpcUrl),
    });

    // Create public client for reading
    publicClient = createPublicClient({
      chain: arbitrumSepolia,
      transport: http(rpcUrl),
    });

    // Test the RPC connection by getting the chain ID
    const chainId = await publicClient.getChainId();
    console.log(`Connected to chain ID: ${chainId}`);
  } catch (error: any) {
    const errorMessage = error.message || String(error);
    if (errorMessage.includes("JSON") || errorMessage.includes("parse")) {
      throw new Error(
        `Failed to connect to RPC endpoint. The RPC URL may be invalid or require authentication. ` +
          `Error: ${errorMessage}. ` +
          `RPC URL: ${rpcUrl.replace(/\/v2\/[^/]+/, "/v2/***")}`,
      );
    }
    throw error;
  }

  // Get contract instance
  const contract = getContract({
    address: contractAddress,
    abi: contractABI,
    client: {
      wallet: walletClient,
      public: publicClient,
    },
  });

  // Convert expectedTotalAmount from ETH string to wei
  const expectedTotalAmountWei = parseEther(data.expectedTotalAmount);

  console.log(
    `Creating payroll with payment day ${data.paymentDay}, duration ${data.duration} months, total amount: ${data.expectedTotalAmount} ETH`,
  );

  // Step 1: Create the payroll
  const createTxHash = await walletClient.writeContract({
    address: contractAddress,
    abi: contractABI,
    functionName: "createPayroll",
    args: [BigInt(data.paymentDay), BigInt(data.duration), expectedTotalAmountWei],
  });

  console.log(`Create payroll tx sent to mempool: ${createTxHash}`);

  // Wait for transaction receipt
  const createReceipt = await publicClient.waitForTransactionReceipt({
    hash: createTxHash,
  });

  console.log(`Create payroll tx confirmed: ${createTxHash}`);

  // Extract payrollId from the event
  let payrollId: bigint;
  try {
    // Parse events from receipt
    const logs = parseEventLogs({
      abi: contractABI,
      logs: createReceipt.logs,
    });

    const payrollCreatedEvent = logs.find((log: any) => log.eventName === "PayrollCreated");

    if (payrollCreatedEvent && payrollCreatedEvent.args.payrollId !== undefined) {
      payrollId = payrollCreatedEvent.args.payrollId as bigint;
    } else {
      // Fallback: call the contract to get the current payroll counter (payrollId - 1)
      // Since createPayroll increments the counter and returns the new ID
      const currentCounter = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: "payrollCounter",
      });
      payrollId = currentCounter - 1n;
    }
  } catch (error) {
    // Fallback: use the counter
    const currentCounter = await publicClient.readContract({
      address: contractAddress,
      abi: contractABI,
      functionName: "payrollCounter",
    });
    payrollId = currentCounter - 1n;
  }

  console.log(`Payroll created with ID: ${payrollId}`);

  // Step 2: Add each employee
  console.log(`Adding ${data.employees.length} employees to payroll ${payrollId}`);

  for (let i = 0; i < data.employees.length; i++) {
    const employee = data.employees[i];
    const monthlyAmountWei = parseEther(employee.amount.toString());

    console.log(
      `Adding employee ${i + 1}/${data.employees.length}: ${employee.name} (${employee.walletAddress}) - ${employee.amount} ETH/month`,
    );

    const addEmployeeTxHash = await walletClient.writeContract({
      address: contractAddress,
      abi: contractABI,
      functionName: "addEmployee",
      args: [payrollId, employee.walletAddress as Address, monthlyAmountWei],
    });

    console.log(`Add employee tx sent: ${addEmployeeTxHash}`);

    await publicClient.waitForTransactionReceipt({
      hash: addEmployeeTxHash,
    });

    console.log(`Add employee tx confirmed: ${addEmployeeTxHash}`);
  }

  console.log(`Payroll setup complete! Payroll ID: ${payrollId}, Transaction: ${createTxHash}`);

  return {
    txHash: createTxHash,
    payrollId: payrollId,
  };
}
