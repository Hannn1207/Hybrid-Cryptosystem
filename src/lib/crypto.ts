/**
 * Hybrid Cryptosystem Implementation
 * AES-256-CBC for file encryption + RSA-2048 for AES key protection
 *
 * Algorithm Flow:
 *   ENCRYPT: File → AES-256-CBC(random key) → EncryptedFile
 *            AES Key → RSA-2048-OAEP(publicKey) → EncryptedAESKey
 *
 *   DECRYPT: EncryptedAESKey → RSA-2048-OAEP(privateKey) → AES Key
 *            EncryptedFile → AES-256-CBC(AES Key) → File
 */

import forge from "node-forge";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RsaKeyPairResult {
  publicKey: string;   // PEM
  privateKey: string;  // PEM
  keySize: number;
}

export interface EncryptionResult {
  encryptedData: string;   // base64
  encryptedAesKey: string; // base64
  aesIv: string;           // base64
  originalSize: number;
  encryptedSize: number;
}

export interface DecryptionResult {
  decryptedData: string;   // base64
  originalSize: number;
}

// ─── RSA Key Generation ───────────────────────────────────────────────────────

/**
 * Generate RSA-2048 key pair
 */
export function generateRsaKeyPair(keySize: number = 2048): RsaKeyPairResult {
  const keypair = forge.pki.rsa.generateKeyPair({ bits: keySize, e: 0x10001 });

  return {
    publicKey: forge.pki.publicKeyToPem(keypair.publicKey),
    privateKey: forge.pki.privateKeyToPem(keypair.privateKey),
    keySize,
  };
}

// ─── AES-256 Encryption ───────────────────────────────────────────────────────

/**
 * Encrypt file data using AES-256-CBC
 * @param fileDataBase64 - file content as base64
 * @param publicKeyPem   - RSA public key (PEM) to encrypt the AES key
 */
export function encryptFile(
  fileDataBase64: string,
  publicKeyPem: string
): EncryptionResult {
  // 1. Generate random AES-256 key (32 bytes) and IV (16 bytes)
  const aesKey = forge.random.getBytesSync(32); // 256 bits
  const aesIv = forge.random.getBytesSync(16);  // 128 bits

  // 2. Convert base64 file data to bytes
  const fileBytes = forge.util.decode64(fileDataBase64);

  // 3. Encrypt file with AES-256-CBC
  const cipher = forge.cipher.createCipher("AES-CBC", aesKey);
  cipher.start({ iv: aesIv });
  cipher.update(forge.util.createBuffer(fileBytes));
  cipher.finish();

  const encryptedBytes = cipher.output.getBytes();

  // 4. Encrypt AES key with RSA-2048-OAEP
  const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
  const encryptedAesKey = publicKey.encrypt(aesKey, "RSA-OAEP", {
    md: forge.md.sha256.create(),
    mgf1: { md: forge.md.sha256.create() },
  });

  return {
    encryptedData: forge.util.encode64(encryptedBytes),
    encryptedAesKey: forge.util.encode64(encryptedAesKey),
    aesIv: forge.util.encode64(aesIv),
    originalSize: fileBytes.length,
    encryptedSize: encryptedBytes.length,
  };
}

/**
 * Decrypt file data using AES-256-CBC + RSA-2048-OAEP
 * @param encryptedDataBase64   - encrypted file as base64
 * @param encryptedAesKeyBase64 - RSA-encrypted AES key as base64
 * @param aesIvBase64           - AES IV as base64
 * @param privateKeyPem         - RSA private key (PEM)
 */
export function decryptFile(
  encryptedDataBase64: string,
  encryptedAesKeyBase64: string,
  aesIvBase64: string,
  privateKeyPem: string
): DecryptionResult {
  // 1. Decrypt AES key using RSA private key
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const encryptedAesKeyBytes = forge.util.decode64(encryptedAesKeyBase64);
  const aesKey = privateKey.decrypt(encryptedAesKeyBytes, "RSA-OAEP", {
    md: forge.md.sha256.create(),
    mgf1: { md: forge.md.sha256.create() },
  });

  // 2. Decrypt file using AES-256-CBC
  const aesIv = forge.util.decode64(aesIvBase64);
  const encryptedBytes = forge.util.decode64(encryptedDataBase64);

  const decipher = forge.cipher.createDecipher("AES-CBC", aesKey);
  decipher.start({ iv: aesIv });
  decipher.update(forge.util.createBuffer(encryptedBytes));
  const success = decipher.finish();

  if (!success) {
    throw new Error("Decryption failed: invalid key or corrupted data");
  }

  const decryptedBytes = decipher.output.getBytes();

  return {
    decryptedData: forge.util.encode64(decryptedBytes),
    originalSize: decryptedBytes.length,
  };
}

// ─── Utility Helpers ──────────────────────────────────────────────────────────

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Get file type enum from MIME type
 */
export function getDocumentType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    "application/pdf": "PDF",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
    "application/msword": "DOC",
    "text/plain": "TXT",
  };
  return mimeMap[mimeType] || "OTHER";
}

/**
 * Validate file type
 */
export function isValidFileType(mimeType: string): boolean {
  const allowed = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
  ];
  return allowed.includes(mimeType);
}
