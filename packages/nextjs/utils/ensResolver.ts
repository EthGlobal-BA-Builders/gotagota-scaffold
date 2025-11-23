import { Address, PublicClient } from "viem";
import { normalize } from "viem/ens";

/** Simple check: if a string looks like an ENS domain name */
export function isENS(input: string): boolean {
  if (!input || typeof input !== "string") {
    return false;
  }

  const trimmed = input.trim();

  // Must contain at least one dot (basic ENS format check)
  if (!trimmed.includes(".")) {
    return false;
  }

  const parts = trimmed.split(".");
  if (parts.length < 2) {
    return false;
  }

  // Check that we have at least one non-empty part
  return parts.some(part => part.length > 0);
}

/**
 * Resolves an ENS name to an ethereum address using viem's ENS resolution
 *
 * @param ensName - The ENS domain name (e.g., "vitalik.eth")
 * @param publicClient - Viem public client connected to Ethereum mainnet
 * @returns The resolved Ethereum address or null if not found
 */
export async function resolveENSName(ensName: string, publicClient: PublicClient): Promise<Address | null> {
  try {
    const normalizedName = normalize(ensName);
    const resolvedAddress = await publicClient.getEnsAddress({
      name: normalizedName,
    });

    return resolvedAddress;
  } catch (error: any) {
    console.error(`[ENS Resolver] Error resolving ${ensName}:`, error);

    // If the domain doesn't exist or isn't resolvable, viem returns null
    if (error.message?.includes("execution reverted") || error.message?.includes("not found")) {
      return null;
    }

    // Re-throw other errors
    throw error;
  }
}
