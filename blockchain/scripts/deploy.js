const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying VotingContract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const VotingContract = await hre.ethers.getContractFactory("VotingContract");
  const votingContract = await VotingContract.deploy();

  await votingContract.waitForDeployment();

  const contractAddress = await votingContract.getAddress();
  console.log("VotingContract deployed to:", contractAddress);

  // Save deployment info
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const artifact = require("../artifacts/contracts/VotingContract.sol/VotingContract.json");
  const deploymentInfo = {
    address: contractAddress,
    deployer: deployer.address,
    network: "localhost",
    chainId: 31337,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  const deploymentPath = path.join(deploymentsDir, "localhost.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to:", deploymentPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
