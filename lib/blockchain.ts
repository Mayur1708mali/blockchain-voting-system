import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

interface DeploymentInfo {
  address: string;
  abi: any[];
  deployer: string;
  network: string;
  chainId: number;
  deployedAt: string;
}

function getDeploymentInfo(): DeploymentInfo {
  const deploymentPath = path.join(
    process.cwd(),
    "blockchain/deployments/localhost.json"
  );

  if (!fs.existsSync(deploymentPath)) {
    throw new Error(
      "Contract not deployed. Run: cd blockchain && npx hardhat run scripts/deploy.ts --network localhost"
    );
  }

  const data = fs.readFileSync(deploymentPath, "utf-8");
  return JSON.parse(data);
}

export function getProvider(): ethers.JsonRpcProvider {
  const url = process.env.HARDHAT_NETWORK_URL || "http://127.0.0.1:8545";
  return new ethers.JsonRpcProvider(url);
}

export function getContract(
  signerOrProvider?: ethers.Signer | ethers.Provider
): ethers.Contract {
  const deployment = getDeploymentInfo();
  const provider = signerOrProvider || getProvider();
  return new ethers.Contract(deployment.address, deployment.abi, provider);
}

export function getAdminWallet(): ethers.Wallet {
  const privateKey = process.env.ADMIN_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("ADMIN_PRIVATE_KEY environment variable is not set");
  }
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}

export function generateVoterWallet(): { address: string; privateKey: string } {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

export async function fundWallet(
  address: string,
  amountInEth: string = "0.1"
): Promise<string> {
  const adminWallet = getAdminWallet();
  const tx = await adminWallet.sendTransaction({
    to: address,
    value: ethers.parseEther(amountInEth),
  });
  await tx.wait();
  return tx.hash;
}

export function getContractAddress(): string {
  const deployment = getDeploymentInfo();
  return deployment.address;
}

export function getVoterWallet(privateKey: string): ethers.Wallet {
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}
