// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const PROVIDER_ADDRESS = "0xBA6378f1c1D046e9EB0F538560BA7558546edF3C";
  const Arbitrage = await ethers.getContractFactory("FlashLoanArbitrage");
  const arbitrage = await Arbitrage.deploy(PROVIDER_ADDRESS);
  await arbitrage.deployed();

  console.log("Arbitrage deployed to:", arbitrage.address);
  console.log("Pool address:", await arbitrage.getPool());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
