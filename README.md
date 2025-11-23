# 💰 GotaGota — Web3 Payroll with Inflation Shield

GotaGota is a decentralized payroll protocol that lets employers set recurring payment schedules and employees claim monthly wages on-chain in minutes. Built during EthGlobal BA, it targets real needs in Argentina: instant access to funds, near‑zero fees, and protection against inflation via stablecoins.


<img width="1083" height="808" alt="image" src="https://github.com/user-attachments/assets/0a7e2cf0-effa-49c2-9179-ee78aff4dff8" />


#### Deployed on Arbitrum Sepolia at: [0x6c15EE71395dc2C4dfa58ff1Ca0334fbC2F8e959](https://sepolia.arbiscan.io/address/0x6c15EE71395dc2C4dfa58ff1Ca0334fbC2F8e959)

Find it on explorer: [https://sepolia.arbiscan.io/address/0x6c15EE71395dc2C4dfa58ff1Ca0334fbC2F8e959](https://sepolia.arbiscan.io/address/0x6c15EE71395dc2C4dfa58ff1Ca0334fbC2F8e959)

**Live demo Employer** (create payroll): https://gotagota-scaffold-nextjs.vercel.app/

**Live demo Employee** (claim salary): https://gotagota-scaffold-nextjs.vercel.app/claim?payrollId=1&month=11&year=2025

## 🎯 Why GotaGota

Argentina faces persistent inflation and volatility, eroding savings overnight and delaying access to earnings via traditional rails. GotaGota delivers:

- Instant settlement: Employees claim funds the moment they’re eligible—no banking delays.

- Near‑zero fees: Only network gas; no hidden withdrawal or spread charges.

- Inflation Shield: Designed for stablecoin payroll so purchasing power stays protected.

- Transparency: All schedules, deposits, and claims are verifiable on-chain.

## What We Built (Hackathon MVP)
A trustless, automated payroll system in stablecoin, where:

- Employers create payroll schedules, add employees, and deposit funds.

- Employees claim monthly payments on designated payment days.

- Each transaction is executed and recorded on-chain.

<img width="2560" height="1137" alt="image" src="https://github.com/user-attachments/assets/44fd83f4-57c7-4bc7-88fa-a2813fc24a97" />


## Key Properties

- Non-custodial: Employers deposit directly into the payroll contract.

- Deterministic claims: Time-based eligibility guards double-spend.

- Transparent state: Schedules and balances are queryable on-chain.

## Competitive Positioning

Compared to incumbents (Deel, Ontop, Bitwage, Rise), GotaGota focuses on:

- Model: Non‑custodial protocol (vs EOR/custodial platforms).

- Fees: No platform withdrawal fees; network gas only.

- Speed: Instant claim at block time (no T+1/T+3 banking delay).

- Crypto support: Built for stablecoins; MVP in stablecoin.

## Market Opportunity

- Target: Knowledge‑service exports and contractor payments in Argentina.

- Estimated Addressable Payroll Volume: ~$1B–$1.5B USD.

- Pain points: Inflation, high fees, slow settlement.

- Beachhead: Freelancers and software contractors paid in stablecoins via employer‑funded schedules.

## Architecture Overview

- Smart contracts (Arbitrum Sepolia): Payroll schedule registry, employee mapping, claim logic, and deposit handling.

- App scaffold: Local dev environment to create schedules, add employees, and claim payouts.

- Time checks and guards: Claimable months enforced via ‎`isMonthClaimable`.

Planned next:

- ETH support via token-based deposits and claims.

- Role-based access (multisig/Org admin).

- Oracles/robust timekeeping to prevent edge-case drift.

- Off-chain indexer for dashboards and analytics.



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
- **ENS Docs**: https://docs.ens.domains/web/resolution

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
## Team

- Product: Bala Chen https://github.com/Agyness0410
- Smart Contracts: Rocío https://github.com/RocioCM
- Frontend:Paola Crispin https://github.com/paolacrispin
- Backend: Nahuel Arrieta https://github.com/NahuelArrieta

## License

MIT 

## Disclaimers

- Testnet deployment; not for production use.

- More Chain features are planned; current MVP pays usdc on Arbitrum.

- Always verify addresses and code before use.
- 
## 📝 License

See [LICENCE](LICENCE) file for details.
