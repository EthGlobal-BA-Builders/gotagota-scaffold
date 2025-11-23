import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the Payroll contract using native ETH
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployPayroll: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network arbitrumSepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` or `yarn account:import` to import your
    existing PK which will fill DEPLOYER_PRIVATE_KEY_ENCRYPTED in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("Payroll", {
    from: deployer,
    // Contract constructor arguments (none needed - uses native ETH)
    args: [],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const payrollContract = await hre.ethers.getContract<Contract>("Payroll", deployer);
  const contractAddress = await payrollContract.getAddress();
  console.log("✅ Payroll contract deployed at:", contractAddress);

  // Verify contract on block explorer (skip on local networks)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("⏳ Waiting for block confirmations before verification...");
    await payrollContract.waitForDeployment();

    // Wait a bit for the block explorer to index the contract
    console.log("⏳ Waiting for block explorer to index the contract...");
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay

    try {
      console.log("🔍 Verifying contract on block explorer...");
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [], // No constructor arguments for Payroll contract
      });
      console.log("✅ Contract verified successfully!");
    } catch (error: any) {
      if (error.message && error.message.includes("Already Verified")) {
        console.log("✅ Contract already verified");
      } else {
        console.error("❌ Verification failed:", error.message);
        console.log("💡 You can verify manually by running:");
        console.log(`   cd packages/hardhat && yarn hardhat verify --network ${hre.network.name} ${contractAddress}`);
        console.log(`   Or use hardhat-deploy (auto-detects from deployments):`);
        console.log(`   yarn workspace @se-2/hardhat etherscan-verify --network ${hre.network.name}`);
      }
    }
  } else {
    console.log("⏭️  Skipping verification on local network");
  }
};

export default deployPayroll;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags Payroll
deployPayroll.tags = ["Payroll"];
