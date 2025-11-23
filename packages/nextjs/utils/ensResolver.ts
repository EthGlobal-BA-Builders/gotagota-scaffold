import { Address, PublicClient, namehash, toHex } from "viem";

/**
 * ENS Registry contract address on Ethereum mainnet
 * This is the official ENS Registry contract
 */
const ENS_REGISTRY_ADDRESS: Address = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";

/**
 * ENS Registry ABI - minimal ABI for resolver lookup
 */
const ENS_REGISTRY_ABI = [
  {
    inputs: [{ internalType: "bytes32", name: "node", type: "bytes32" }],
    name: "resolver",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Public Resolver ABI - minimal ABI for address resolution
 * This is the standard resolver interface used by most ENS domains
 */
const PUBLIC_RESOLVER_ABI = [
  {
    inputs: [{ internalType: "bytes32", name: "node", type: "bytes32" }],
    name: "addr",
    outputs: [{ internalType: "address payable", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Normalizes an ENS name according to ENSIP-1
 * Converts to lowercase and removes any whitespace
 */
function normalizeENSName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Validates that an ENS name follows the proper format
 * ENS names must:
 * - Not be empty
 * - Not start or end with a dot
 * - Not have consecutive dots
 * - Have at least one label (part before or after a dot)
 */
function validateENSName(name: string): boolean {
  const normalized = normalizeENSName(name);

  if (!normalized || normalized.length === 0) {
    return false;
  }

  // Must contain at least one dot
  if (!normalized.includes(".")) {
    return false;
  }

  // Cannot start or end with a dot
  if (normalized.startsWith(".") || normalized.endsWith(".")) {
    return false;
  }

  // Cannot have consecutive dots
  if (normalized.includes("..")) {
    return false;
  }

  // Split by dots and validate each label
  const labels = normalized.split(".");
  for (const label of labels) {
    // Each label must not be empty
    if (label.length === 0) {
      return false;
    }
    // Labels should only contain alphanumeric characters and hyphens
    // (simplified validation - ENS allows more characters but this covers most cases)
    if (!/^[a-z0-9-]+$/.test(label)) {
      return false;
    }
  }

  return true;
}

/**
 * Custom ENS resolver implementation
 * This directly interacts with ENS contracts instead of using viem's built-in method
 *
 * Process:
 * 1. Normalize and validate the ENS name
 * 2. Compute the namehash of the domain
 * 3. Query the ENS Registry to get the resolver address
 * 4. Query the resolver contract to get the Ethereum address
 *
 * @param ensName - The ENS domain name (e.g., "vitalik.eth")
 * @param publicClient - Viem public client connected to Ethereum mainnet
 * @returns The resolved Ethereum address or null if not found
 */
export async function resolveENSName(ensName: string, publicClient: PublicClient): Promise<Address | null> {
  try {
    // Normalize the ENS name
    const normalizedName = normalizeENSName(ensName);

    // Validate the ENS name format
    if (!validateENSName(normalizedName)) {
      throw new Error(`Invalid ENS name format: ${ensName}`);
    }

    // Compute the namehash of the domain
    // namehash is the standard way ENS represents domain names as bytes32
    const node = namehash(normalizedName);

    console.log(`[ENS Resolver] Resolving ${normalizedName} (node: ${node})`);

    // Step 1: Query the ENS Registry to get the resolver address
    const resolverAddress = await publicClient.readContract({
      address: ENS_REGISTRY_ADDRESS,
      abi: ENS_REGISTRY_ABI,
      functionName: "resolver",
      args: [node],
    });

    // If no resolver is set, the domain doesn't exist or isn't configured
    if (!resolverAddress || resolverAddress === "0x0000000000000000000000000000000000000000") {
      console.log(`[ENS Resolver] No resolver found for ${normalizedName}`);
      return null;
    }

    console.log(`[ENS Resolver] Resolver address: ${resolverAddress}`);

    // Step 2: Query the resolver contract to get the Ethereum address
    // We use the standard Public Resolver interface which has an `addr(bytes32)` function
    const resolvedAddress = await publicClient.readContract({
      address: resolverAddress,
      abi: PUBLIC_RESOLVER_ABI,
      functionName: "addr",
      args: [node],
    });

    // If the address is zero, the domain exists but has no address set
    if (!resolvedAddress || resolvedAddress === "0x0000000000000000000000000000000000000000") {
      console.log(`[ENS Resolver] No address set for ${normalizedName}`);
      return null;
    }

    console.log(`[ENS Resolver] Resolved ${normalizedName} to ${resolvedAddress}`);

    return resolvedAddress as Address;
  } catch (error: any) {
    console.error(`[ENS Resolver] Error resolving ${ensName}:`, error);

    // Provide more specific error messages
    if (error.message?.includes("execution reverted")) {
      throw new Error(`ENS domain not found or not configured: ${ensName}`);
    }

    throw error;
  }
}

/**
 * Batch resolve multiple ENS names
 * @param ensNames - Array of ENS domain names
 * @param publicClient - Viem public client connected to Ethereum mainnet
 * @returns Map of ENS name to resolved address (or null if not found)
 */
export async function batchResolveENS(
  ensNames: string[],
  publicClient: PublicClient,
): Promise<Map<string, Address | null>> {
  const results = new Map<string, Address | null>();

  // Resolve all names in parallel
  const promises = ensNames.map(async name => {
    try {
      const address = await resolveENSName(name, publicClient);
      return { name, address };
    } catch (error) {
      console.error(`[ENS Resolver] Failed to resolve ${name}:`, error);
      return { name, address: null };
    }
  });

  const resolved = await Promise.all(promises);

  for (const { name, address } of resolved) {
    results.set(name, address);
  }

  return results;
}
