import { ethers } from 'ethers';
import { PayrollData } from '../../types/data/data';

const CONTRACT_ABI = [
    "function mintPayroll(uint256 payrollId, uint256 day, address[] recipients, uint256[] amounts) external returns (bool)"
];

export async function executePayrollOnChain(data: PayrollData): Promise<string> {
    const rpcUrl = process.env.RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!rpcUrl || !privateKey || !contractAddress) {
        throw new Error("Missing blockchain configuration in environment variables");
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, wallet);

    const recipients = data.users.map(u => u.walletAddress);

    const amounts = data.users.map(u => ethers.parseUnits(u.amount.toString(), 18));

    console.log(`Sending payroll ${data.id} for day ${data.day} to ${recipients.length} recipients`);

    const tx = await contract.mintPayroll(data.id, data.day, recipients, amounts);

    console.log(`Tx sent to mempool: ${tx.hash}`);

    await tx.wait();

    console.log(`Tx confirmed: ${tx.hash}`);

    return tx.hash;
}