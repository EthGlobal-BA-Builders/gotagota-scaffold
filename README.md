# 💰 Payroll App

A decentralized payroll management system built on Ethereum, allowing employers to set up recurring payroll schedules and employees to claim their monthly payments in native ETH.

## 🎯 Mission

This project provides a trustless, automated payroll system on the blockchain where:

- **Employers** can create payroll schedules, add employees, and deposit funds
- **Employees** can claim their monthly payments on designated payment days
- All transactions are transparent, verifiable, and executed on-chain using native ETH.

<img width="2560" height="1137" alt="image" src="https://github.com/user-attachments/assets/44fd83f4-57c7-4bc7-88fa-a2813fc24a97" />

## 🔧 Contract Functions

### For Employers

- `createPayroll(paymentDay, months, expectedTotalAmount)` - Create a new payroll schedule
- `addEmployee(payrollId, employee, monthlyAmount)` - Add an employee to a payroll
- `depositFunds(payrollId)` - Deposit ETH to fund the payroll

### For Employees

- `claimPayroll(payrollId, month, year)` - Claim monthly payment for a specific month
- `isMonthClaimable(payrollId, month, year)` - Check if a month is claimable
- `getEmployeePayment(payrollId, employee)` - Get employee payment details

## 🚀 Quick Start

### Prerequisites

- Node.js (>= v20.18.3)
- Yarn (v1 or v2+)
- Git

### Installation

```bash
# Install dependencies
yarn install
```

### Local Development

1. **Start local blockchain** (Terminal 1):

   ```bash
   yarn chain
   ```

2. **Deploy contracts** (Terminal 2):

   ```bash
   yarn deploy
   ```

3. **Start frontend** (Terminal 3):
   ```bash
   yarn start
   ```

Visit `http://localhost:3000` to interact with the app.

### Deploy to Arbitrum Sepolia

```bash
# Deploy to Arbitrum Sepolia testnet
yarn deploy --network arbitrumSepolia

# Verify contract (automatic after deployment)
# Or manually: yarn hardhat verify --network arbitrumSepolia <CONTRACT_ADDRESS>
```

## 📁 Project Structure

```
payroll-app/
├── packages/
│   ├── hardhat/              # Smart contract development
│   │   ├── contracts/
│   │   │   └── Payroll.sol   # Main payroll contract
│   │   ├── deploy/
│   │   │   └── 00_deploy_your_contract.ts  # Deployment script
│   │   └── hardhat.config.ts # Hardhat configuration
│   │
│   └── nextjs/               # Frontend application
│       ├── app/              # Next.js app router pages
│       ├── components/       # React components
└── package.json              # Root workspace configuration
```

## 📚 Useful Links

- **Scaffold-ETH 2 Docs**: https://docs.scaffoldeth.io
- **Scaffold-ETH 2 Website**: https://scaffoldeth.io
- **Hardhat Documentation**: https://hardhat.org/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **Wagmi Documentation**: https://wagmi.sh
- **Arbitrum Sepolia Explorer**: https://sepolia.arbiscan.io

## 🛠️ Development Commands

```bash
# Compile contracts
yarn hardhat:compile

# Run tests
yarn hardhat:test

# Check account balance
yarn account

# Generate new account
yarn account:generate

# Format code
yarn format

# Lint code
yarn lint
```

## 📝 License

See [LICENCE](LICENCE) file for details.
