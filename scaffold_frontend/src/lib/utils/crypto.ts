import forge from 'node-forge';
import { Buffer } from 'buffer';

/**
 * Generate a Key ID ('kid') for a given RSA public key in PEM format.
 * The 'kid' is computed as the SHA-256 hash of the DER-encoded public key.
 * @param publicKeyPem - The RSA public key in PEM format.
 * @returns The 'kid' as a base64url-encoded string.
 */
export function generateKidFromPublicKey(publicKeyPem: string) {
  // Convert PEM to Forge's publicKey object
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  // Convert Forge publicKey object to RSA publicKeyInfo ASN.1 structure
  const publicKeyAsn1 = forge.pki.publicKeyToAsn1(publicKey);
  // Serialize ASN.1 structure to DER format
  const publicKeyDer = forge.asn1.toDer(publicKeyAsn1).getBytes();
  // Compute KID as SHA-256 hash of DER format
  const sha256 = forge.md.sha256.create();
  sha256.update(publicKeyDer);
  const digest = sha256.digest().getBytes();
  // Use base64url encoding
  return Buffer.from(digest, 'binary')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generates a SHA-256 hash and returns it as a hex string
 * @param input - The string to hash
 * @returns The hash as a hex string
 */
export async function sha256Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
