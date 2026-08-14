/**
 * Runtime environment validation.
 * Call this at app startup to ensure all required env vars are set.
 */

const requiredEnvVars = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
] as const;

const blockchainEnvVars = [
  "HARDHAT_NETWORK_URL",
  "ADMIN_PRIVATE_KEY",
  "WALLET_ENCRYPTION_KEY",
] as const;

export function validateEnv() {
  const missing: string[] = [];

  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}.\n` +
        `Copy .env.example to .env.local and fill in the values.`
    );
  }
}

export function validateBlockchainEnv() {
  const missing: string[] = [];

  for (const key of blockchainEnvVars) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `Blockchain environment variables not configured: ${missing.join(", ")}.\n` +
        `Blockchain features will not work until these are set.`
    );
    return false;
  }

  return true;
}
