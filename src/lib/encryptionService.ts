// Encryption service for secure local storage
// Uses Web Crypto API for AES-256-GCM encryption

interface EncryptedPayload {
  ciphertext: string // Base64 encoded encrypted data
  iv: string // Base64 encoded initialization vector
  salt: string // Base64 encoded salt for key derivation
  version: string // Encryption version for future compatibility
}

const ENCRYPTION_VERSION = "v1"
const PBKDF2_ITERATIONS = 100000
const KEY_LENGTH = 256

/**
 * Generate a random salt
 */
async function generateSalt(): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(16))
}

/**
 * Generate a random IV (Initialization Vector)
 */
async function generateIV(): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(12))
}

/**
 * Derive encryption key from password using PBKDF2
 */
async function deriveKey(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  )

  // Derive actual encryption key
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  )

  return key
}

/**
 * Convert Uint8Array to Base64 string
 */
function arrayBufferToBase64(buffer: Uint8Array): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Convert Base64 string to Uint8Array
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Encrypt data using AES-256-GCM
 * @param data - Data to encrypt (will be JSON stringified)
 * @param password - Password/key to use for encryption
 * @returns Encrypted payload with IV and salt
 */
export async function encrypt(
  data: any,
  password: string
): Promise<EncryptedPayload> {
  try {
    // Generate salt and IV
    const salt = await generateSalt()
    const iv = await generateIV()

    // Derive key from password
    const key = await deriveKey(password, salt)

    // Convert data to string and then to array buffer
    const encoder = new TextEncoder()
    const dataString = JSON.stringify(data)
    const dataBuffer = encoder.encode(dataString)

    // Encrypt data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv as BufferSource
      },
      key,
      dataBuffer
    )

    // Convert to base64 for storage
    return {
      ciphertext: arrayBufferToBase64(new Uint8Array(encryptedBuffer)),
      iv: arrayBufferToBase64(iv),
      salt: arrayBufferToBase64(salt),
      version: ENCRYPTION_VERSION
    }
  } catch (error) {
    console.error("Encryption error:", error)
    throw new Error("Failed to encrypt data")
  }
}

/**
 * Decrypt data using AES-256-GCM
 * @param payload - Encrypted payload with IV and salt
 * @param password - Password/key used for encryption
 * @returns Decrypted data (parsed from JSON)
 */
export async function decrypt(
  payload: EncryptedPayload,
  password: string
): Promise<any> {
  try {
    // Convert base64 back to array buffers
    const salt = base64ToArrayBuffer(payload.salt)
    const iv = base64ToArrayBuffer(payload.iv)
    const ciphertext = base64ToArrayBuffer(payload.ciphertext)

    // Derive key from password
    const key = await deriveKey(password, salt)

    // Decrypt data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv as BufferSource
      },
      key,
      ciphertext as BufferSource
    )

    // Convert back to string and parse JSON
    const decoder = new TextDecoder()
    const dataString = decoder.decode(decryptedBuffer)
    return JSON.parse(dataString)
  } catch (error) {
    console.error("Decryption error:", error)
    throw new Error(
      "Failed to decrypt data - incorrect password or corrupted data"
    )
  }
}

/**
 * Generate a secure encryption password from user's auth token
 * This ensures each user has a unique encryption key
 */
export async function generateEncryptionPassword(
  userId: string,
  authToken: string
): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`${userId}:${authToken}`)

  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

  return hashHex
}

/**
 * Encrypt and store data in Chrome storage
 */
export async function encryptAndStore(
  key: string,
  data: any,
  password: string
): Promise<void> {
  try {
    const encrypted = await encrypt(data, password)
    await chrome.storage.local.set({ [key]: encrypted })
    console.log(`✅ Data encrypted and stored under key: ${key}`)
  } catch (error) {
    console.error("Failed to encrypt and store data:", error)
    throw error
  }
}

/**
 * Retrieve and decrypt data from Chrome storage
 */
export async function retrieveAndDecrypt(
  key: string,
  password: string
): Promise<any> {
  try {
    const result = await chrome.storage.local.get(key)
    const encrypted = result[key] as EncryptedPayload | undefined

    if (!encrypted) {
      return null
    }

    const decrypted = await decrypt(encrypted, password)
    console.log(`✅ Data retrieved and decrypted from key: ${key}`)
    return decrypted
  } catch (error) {
    console.error("Failed to retrieve and decrypt data:", error)
    throw error
  }
}

/**
 * Check if encrypted data exists in storage
 */
export async function hasEncryptedData(key: string): Promise<boolean> {
  const result = await chrome.storage.local.get(key)
  return !!result[key]
}

/**
 * Remove encrypted data from storage
 */
export async function removeEncryptedData(key: string): Promise<void> {
  await chrome.storage.local.remove(key)
  console.log(`✅ Encrypted data removed from key: ${key}`)
}
