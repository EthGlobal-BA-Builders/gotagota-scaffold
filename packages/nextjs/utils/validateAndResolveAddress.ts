import { isENS, resolveENSName } from "./ensResolver";
import { PublicClient, isAddress } from "viem";

interface ValidationResult {
  isValid: boolean;
  address: string | null;
  isENS: boolean;
  error: string | null;
}

/**
 * Validates and resolves an address or ENS domain
 * Uses our custom ENS resolver implementation that directly calls ENS contracts
 * @param input - The input string (could be an address or ENS domain)
 * @param publicClient - Viem public client (must be connected to mainnet for ENS resolution)
 * @returns Object with validation result and resolved address
 */
export async function validateAndResolveAddress(
  input: string,
  publicClient?: PublicClient | null,
): Promise<ValidationResult> {
  if (!input || input.trim() === "") {
    return { isValid: false, address: null, isENS: false, error: "Empty input" };
  }

  const trimmedInput = input.trim();

  // Check if it's a valid Ethereum address
  if (isAddress(trimmedInput)) {
    return { isValid: true, address: trimmedInput, isENS: false, error: null };
  }

  // Check if it looks like an ENS domain
  if (isENS(trimmedInput)) {
    if (!publicClient) {
      return {
        isValid: false,
        address: null,
        isENS: true,
        error: "Public client not available for ENS resolution",
      };
    }

    try {
      const resolvedAddress = await resolveENSName(trimmedInput, publicClient);

      if (resolvedAddress) {
        return { isValid: true, address: resolvedAddress, isENS: true, error: null };
      } else {
        return {
          isValid: false,
          address: null,
          isENS: true,
          error: "ENS domain not found or not resolvable",
        };
      }
    } catch (error: any) {
      console.error("Error resolving ENS domain:", error);
      return {
        isValid: false,
        address: null,
        isENS: true,
        error: error.message || "Failed to resolve ENS domain",
      };
    }
  }

  // Not a valid address and not an ENS domain
  return { isValid: false, address: null, isENS: false, error: "Invalid address or ENS domain" };
}
