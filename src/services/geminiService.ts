// Service for generating dummy data using Gemini API
import { GoogleGenerativeAI } from "@google/generative-ai"

// Local helper to read key from storage to avoid circular deps
const readStoredGeminiKey = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get("geminiApiKey", (res) => {
        resolve((res.geminiApiKey as string | undefined) || null)
      })
    } catch (e) {
      resolve(null)
    }
  })
}

// Initialize Gemini AI (prefers runtime key from storage, falls back to env)
const getGeminiClient = async () => {
  const storedKey = await readStoredGeminiKey()
  const envKey = process.env.PLASMO_PUBLIC_GEMINI_API
  const apiKey = storedKey || envKey
  if (!apiKey) {
    console.error(
      "Gemini API key not found. Set it in Settings or set PLASMO_PUBLIC_GEMINI_API in .env"
    )
    return null
  }
  return new GoogleGenerativeAI(apiKey)
}

export interface DummyUserData {
  // Basic Info
  title?: string
  firstname: string
  middlename?: string
  middleinitial?: string
  lastname: string
  fullname?: string

  // Contact Info
  email: string
  username: string
  password: string

  // Personal Details
  gender: string
  dob: string
  age?: string
  birthplace?: string
  ssn?: string
  driverslicense?: string

  // Company/Work
  company?: string
  position?: string

  // Address
  address1?: string
  address2?: string
  city?: string
  state?: string
  zipcode?: string
  postalcode?: string
  country?: string

  // Phone Numbers
  homephone?: string
  workphone?: string
  fax?: string
  cellphone?: string

  // Web
  website?: string
  userid?: string

  // Payment Info
  creditcardtype?: string
  creditcardnumber?: string
  cardverificationcode?: string
  cardexpiration?: string
  cardusername?: string
  cardissuingbank?: string
  cardcustomerservicephone?: string

  // Additional
  income?: string
  custommessage?: string
  comments?: string
}

// Helper function to delay/wait
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Single generation function with retry logic
export async function generateDummyData(
  retryCount: number = 0
): Promise<DummyUserData | null> {
  const genAI = await getGeminiClient()

  if (!genAI) {
    console.error("Failed to initialize Gemini client - API key missing")
    return null
  }

  const prompt = `
Generate a random but realistic dummy user information in JSON format.
The data should be realistic and varied each time.

Required fields (must be present):
- title (Mr, Mrs, Ms, Dr, etc.)
- firstname (realistic first name)
- middlename (realistic middle name)
- middleinitial (single letter middle initial)
- lastname (realistic last name)
- fullname (complete name: firstname middlename lastname)
- username (lowercase, 8-12 characters, can include numbers)
- email (valid email format)
- password (strong password, 12-16 characters with mix of letters, numbers, symbols - no "password" word, just random words/symbols/numbers)
- gender (exactly "1" for Female or "2" for Male)
- dob (date of birth in DD-MM-YYYY format, person should be between 18-60 years old)
- age (calculated from dob)
- birthplace (city, country)
- ssn (format: XXX-XX-XXXX)
- driverslicense (format: realistic license number)

Company/Work fields:
- company (company name)
- position (job title/position)

Address fields:
- address1 (street address)
- address2 (apt/suite number, can be empty)
- city (city name)
- state (state/province)
- zipcode (5 digit US zipcode)
- postalcode (5 digit postal code, same as zipcode)
- country (country name)

Phone fields:
- homephone (format: XXX-XXX-XXXX)
- workphone (format: XXX-XXX-XXXX)
- fax (format: XXX-XXX-XXXX)
- cellphone (format: XXX-XXX-XXXX)

Web fields:
- website (personal website URL)
- userid (unique ID, can be same as username)

Payment fields:
- creditcardtype (Visa, Mastercard, Amex, etc.)
- creditcardnumber (16 digit card number)
- cardverificationcode (3 digit CVV)
- cardexpiration (MM/YY format)
- cardusername (name on card, same as fullname)
- cardissuingbank (bank name)
- cardcustomerservicephone (format: XXX-XXX-XXXX)

Additional fields:
- income (annual income amount like "75000")
- custommessage (short personal message)
- comments (brief comment or note)

Make the names, locations international and diverse (not only USA/English names - include Asian, African, European, etc.)

Return ONLY valid JSON, no markdown formatting, no explanations.
Example format:
{
  "title": "Mr",
  "firstname": "John",
  "middlename": "Michael",
  "middleinitial": "M",
  "lastname": "Doe",
  "fullname": "John Michael Doe",
  "username": "johndoe123",
  "email": "john.doe@example.com",
  "password": "SecurePass123!@",
  "gender": "2",
  "dob": "15-03-1990",
  "age": "34",
  "birthplace": "New York, USA",
  "ssn": "123-45-6789",
  "driverslicense": "D1234567",
  "company": "Tech Corp",
  "position": "Software Engineer",
  "address1": "123 Main Street",
  "address2": "Apt 4B",
  "city": "New York",
  "state": "NY",
  "zipcode": "10001",
  "postalcode": "10001",
  "country": "USA",
  "homephone": "212-555-0100",
  "workphone": "212-555-0101",
  "fax": "212-555-0102",
  "cellphone": "917-555-0100",
  "website": "https://johndoe.com",
  "userid": "johndoe123",
  "creditcardtype": "Visa",
  "creditcardnumber": "4532123456789012",
  "cardverificationcode": "123",
  "cardexpiration": "12/28",
  "cardusername": "John Michael Doe",
  "cardissuingbank": "Chase Bank",
  "cardcustomerservicephone": "800-555-0199",
  "income": "85000",
  "custommessage": "Hello world!",
  "comments": "Test user account"
}
`

  // Use only gemini-2.0-flash-exp as specified
  const modelName = "gemini-2.5-pro"
  const maxRetries = 3

  // Helper to clean and parse JSON from model response
  const tryParseJson = (text: string): DummyUserData | null => {
    try {
      // Remove markdown fences if any
      const cleaned = text
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim()
      const parsed = JSON.parse(cleaned)
      return parsed as DummyUserData
    } catch (e) {
      console.error("JSON parse error:", e)
      console.error("Raw response:", text.substring(0, 200))
      return null
    }
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🤖 Calling Gemini ${modelName} (attempt ${attempt + 1}/${maxRetries + 1})...`
      )
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(prompt)
      const response = result.response

      // Check for safety blocks or other issues
      if (!response) {
        console.error("❌ No response from Gemini API")
        continue
      }

      const text = response.text()
      console.log(`✅ Got response from Gemini (${text.length} chars)`)

      const json = tryParseJson(text)
      if (json) {
        console.log("✅ Successfully parsed JSON data")
        return json
      }
      console.warn(
        `⚠️ Model returned non-JSON response on attempt ${attempt + 1}`
      )
    } catch (error: any) {
      console.error(
        `❌ Gemini call failed (attempt ${attempt + 1}/${maxRetries + 1}):`,
        error?.message || error
      )
      // Log additional error details if available
      if (error?.response) {
        console.error("Error response:", error.response)
      }
      if (error?.status) {
        console.error("Error status:", error.status)
      }
    }

    // Backoff before retrying
    if (attempt < maxRetries) {
      const delayMs = 1000 * (attempt + 1)
      console.log(`⏳ Waiting ${delayMs}ms before retry...`)
      await delay(delayMs)
    }
  }

  console.error("❌ All generation attempts failed")
  return null
}

// Simple cache system with single entry and 10 minute auto-refresh
let cachedData: DummyUserData | null = null
let cacheTimestamp: number = 0
const CACHE_REFRESH_DURATION = 1 * 60 * 1000 // 10 minutes
let refreshTimer: NodeJS.Timeout | null = null
let isGenerating = false

// Initialize cache with single entry (with retries)
async function initializeCache(attemptNumber: number = 1): Promise<void> {
  const maxAttempts = 3

  if (isGenerating) {
    console.log("⏳ Generation already in progress...")
    return
  }

  isGenerating = true
  console.log(
    `🔄 Generating single dummy data entry (attempt ${attemptNumber}/${maxAttempts})...`
  )

  try {
    const newData = await generateDummyData()

    if (newData) {
      cachedData = newData
      cacheTimestamp = Date.now()

      // Save to chrome storage for persistence
      chrome.storage.local.set(
        {
          generatedData: newData,
          generatedDataTimestamp: cacheTimestamp
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error saving generated data to storage:",
              chrome.runtime.lastError
            )
          }
        }
      )

      console.log("✅ Data cached and ready for instant use!")

      // Schedule auto-refresh after 10 minutes
      scheduleCacheRefresh()
    } else {
      console.error(`❌ Failed to generate data on attempt ${attemptNumber}`)

      // Retry if we haven't exceeded max attempts
      if (attemptNumber < maxAttempts) {
        isGenerating = false
        const retryDelay = attemptNumber * 3000 // 3s, 6s, 9s
        console.log(`⏳ Retrying cache initialization in ${retryDelay}ms...`)
        await delay(retryDelay)
        return initializeCache(attemptNumber + 1)
      } else {
        console.error("❌ All cache initialization attempts failed")
      }
    }
  } catch (error) {
    console.error("Error generating cached data:", error)

    // Retry if we haven't exceeded max attempts
    if (attemptNumber < maxAttempts) {
      isGenerating = false
      const retryDelay = attemptNumber * 3000
      console.log(`⏳ Retrying after error in ${retryDelay}ms...`)
      await delay(retryDelay)
      return initializeCache(attemptNumber + 1)
    }
  } finally {
    isGenerating = false
  }
}

// Schedule automatic cache refresh
function scheduleCacheRefresh(): void {
  // Clear existing timer if any
  if (refreshTimer) {
    clearTimeout(refreshTimer)
  }

  refreshTimer = setTimeout(() => {
    console.log("🔄 Auto-refreshing cached data after 10 minutes...")
    initializeCache()
  }, CACHE_REFRESH_DURATION)

  console.log("⏰ Cache auto-refresh scheduled for 10 minutes from now")
}

// Get cached data (instant, no waiting!)
export async function getCachedOrGenerateData(): Promise<DummyUserData | null> {
  const now = Date.now()

  // Try to load from storage if memory cache is empty
  if (!cachedData) {
    const stored = await new Promise<{
      generatedData?: DummyUserData
      generatedDataTimestamp?: number
    }>((resolve) => {
      chrome.storage.local.get(
        ["generatedData", "generatedDataTimestamp"],
        (res) => {
          resolve(res)
        }
      )
    })

    if (stored.generatedData && stored.generatedDataTimestamp) {
      const storedAge = now - stored.generatedDataTimestamp
      if (storedAge < CACHE_REFRESH_DURATION) {
        cachedData = stored.generatedData
        cacheTimestamp = stored.generatedDataTimestamp
        scheduleCacheRefresh()
        console.log(
          `✅ Restored cached data from storage (age: ${Math.floor(storedAge / 1000)}s)`
        )
      }
    }
  }

  // Check if cache needs initialization or refresh
  if (!cachedData || now - cacheTimestamp > CACHE_REFRESH_DURATION) {
    console.log("🔄 Cache empty or expired, initializing...")
    await initializeCache()
  }

  // If still no data after initialization attempt, return null
  if (!cachedData) {
    console.error("❌ No cached data available")
    return null
  }

  const cacheAge = Math.floor((now - cacheTimestamp) / 1000)
  console.log(`⚡ Instantly serving cached data (age: ${cacheAge}s)`)

  return cachedData
}

// Preload single data entry on extension startup
export function preloadData(): void {
  console.log("🚀 Preloading single data entry in background...")
  initializeCache().catch((error) => {
    console.error("Error preloading cache:", error)
  })
}

// Check if cache has valid data
export async function hasCachedData(): Promise<boolean> {
  const now = Date.now()

  // Check memory cache first
  if (cachedData !== null && now - cacheTimestamp < CACHE_REFRESH_DURATION) {
    return true
  }

  // Check storage
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ["generatedData", "generatedDataTimestamp"],
      (res) => {
        if (res.generatedData && res.generatedDataTimestamp) {
          const storedAge = now - res.generatedDataTimestamp
          resolve(storedAge < CACHE_REFRESH_DURATION)
        } else {
          resolve(false)
        }
      }
    )
  })
}

// Force refresh the cache
export function clearCache(): void {
  cachedData = null
  cacheTimestamp = 0
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }

  // Clear from storage as well
  chrome.storage.local.remove(
    ["generatedData", "generatedDataTimestamp"],
    () => {
      if (chrome.runtime.lastError) {
        console.error("Error clearing storage:", chrome.runtime.lastError)
      }
    }
  )

  console.log("🗑️ Cache cleared")
}

// Get cache status for debugging
export function getCacheStatus(): {
  hasData: boolean
  age: number
} {
  return {
    hasData: cachedData !== null,
    age: Date.now() - cacheTimestamp
  }
}
