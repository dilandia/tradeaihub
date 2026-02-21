/**
 * TDR-09: Password encryption with key versioning
 * Allows safe key rotation without breaking existing data
 */

import crypto from "crypto";

// Key version mapping - add new keys here, keep old ones for decryption
const ENCRYPTION_KEYS: Record<number, string> = {
  1: process.env.ENCRYPTION_KEY || "",
  // Future keys:
  // 2: process.env.ENCRYPTION_KEY_V2 || "",
};

// Current version to use for new encryptions
const CURRENT_KEY_VERSION = 1;

interface EncryptedData {
  version: number;
  iv: string; // base64 encoded
  data: string; // base64 encoded
}

/**
 * Encrypt password with current key version
 */
export function encryptPassword(password: string): EncryptedData {
  if (!ENCRYPTION_KEYS[CURRENT_KEY_VERSION]) {
    throw new Error(`Encryption key version ${CURRENT_KEY_VERSION} not configured`);
  }

  const key = Buffer.from(ENCRYPTION_KEYS[CURRENT_KEY_VERSION], "hex");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");

  return {
    version: CURRENT_KEY_VERSION,
    iv: iv.toString("base64"),
    data: Buffer.from(encrypted, "hex").toString("base64"),
  };
}

/**
 * Decrypt password using stored key version
 */
export function decryptPassword(encrypted: EncryptedData | string): string {
  let data: EncryptedData;

  // Handle legacy plain string format (if any)
  if (typeof encrypted === "string") {
    try {
      data = JSON.parse(encrypted) as EncryptedData;
    } catch {
      throw new Error("Invalid encrypted password format");
    }
  } else {
    data = encrypted;
  }

  if (!data.version || !data.iv || !data.data) {
    throw new Error("Invalid encrypted password structure");
  }

  const keyVersion = data.version;
  if (!ENCRYPTION_KEYS[keyVersion]) {
    throw new Error(`Encryption key version ${keyVersion} not available`);
  }

  const key = Buffer.from(ENCRYPTION_KEYS[keyVersion], "hex");
  const iv = Buffer.from(data.iv, "base64");
  const encryptedData = Buffer.from(data.data, "base64").toString("hex");

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Re-encrypt password with current key (for key rotation)
 */
export function reencryptPassword(encrypted: EncryptedData | string): EncryptedData {
  const decrypted = decryptPassword(encrypted);
  return encryptPassword(decrypted);
}

/**
 * Check if password needs re-encryption (uses old key version)
 */
export function needsReencryption(encrypted: EncryptedData | string): boolean {
  let data: EncryptedData;

  if (typeof encrypted === "string") {
    try {
      data = JSON.parse(encrypted) as EncryptedData;
    } catch {
      return false;
    }
  } else {
    data = encrypted;
  }

  return data.version !== CURRENT_KEY_VERSION;
}
