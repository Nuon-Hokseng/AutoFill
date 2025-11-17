// Service for generating dummy data via backend API

// Backend endpoint base
const BACKEND_BASE_URL = "https://autofill-backend-whgy.onrender.com"
const GENERATE_ENDPOINT = `${BACKEND_BASE_URL}/generate`

export interface AutofillData {
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

// Backwards-compatible alias for existing imports/usages
export type DummyUserData = AutofillData

// Helper function to delay/wait
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Normalize backend output: accept alternate keys and coerce primitives to strings
const normalizeAutofill = (input: any): AutofillData | null => {
  if (!input || typeof input !== "object") return null

  const val = (v: any): string | undefined => {
    if (v === undefined || v === null) return undefined
    // Coerce numbers/booleans to strings; trim strings
    const s = String(v)
    return s
  }

  const pick = (...keys: string[]) => {
    for (const k of keys) {
      if (k in input) return input[k]
    }
    return undefined
  }

  const data: AutofillData = {
    // Basic
    title: val(pick("title")),
    firstname:
      val(pick("firstname", "firstName", "first_name", "given_name")) || "",
    middlename: val(pick("middlename", "middleName", "middle_name")),
    middleinitial: val(
      pick("middleinitial", "middleInitial", "middle_initial")
    ),
    lastname:
      val(pick("lastname", "lastName", "last_name", "family_name")) || "",
    fullname: val(pick("fullname", "fullName", "full_name")),

    // Account
    email: val(pick("email", "emailAddress", "email_address")) || "",
    username:
      val(pick("username", "userName", "user_name", "userid", "userId")) || "",
    password: val(pick("password", "pass", "pwd")) || "",

    // Personal
    gender: val(pick("gender", "sex")) || "",
    dob: val(pick("dob", "dateOfBirth", "birth_date", "birthDate")) || "",
    age: val(pick("age")),
    birthplace: val(pick("birthplace", "birth_place", "birthPlace")),
    ssn: val(pick("ssn", "social", "social_security")),
    driverslicense: val(
      pick("driverslicense", "driverLicense", "driver_license")
    ),

    // Company
    company: val(pick("company")),
    position: val(pick("position", "job", "job_title", "jobTitle")),

    // Address
    address1: val(pick("address1", "address_1", "street", "street1")),
    address2: val(pick("address2", "address_2", "apt", "suite", "street2")),
    city: val(pick("city")),
    state: val(pick("state", "province", "region")),
    zipcode: val(pick("zipcode", "zip", "zip_code")),
    postalcode: val(pick("postalcode", "postal", "postal_code")),
    country: val(pick("country")),

    // Phones
    homephone: val(pick("homephone", "home_phone")),
    workphone: val(pick("workphone", "work_phone")),
    fax: val(pick("fax")),
    cellphone: val(
      pick("cellphone", "cell_phone", "phone", "phone_number", "phoneNumber")
    ),

    // Web
    website: val(pick("website", "url")),
    userid: val(pick("userid", "userId")),

    // Payment
    creditcardtype: val(pick("creditcardtype", "card_type", "cardType")),
    creditcardnumber: val(
      pick("creditcardnumber", "card_number", "cardNumber")
    ),
    cardverificationcode: val(
      pick("cardverificationcode", "cvv", "cvc", "card_verification_code")
    ),
    cardexpiration: val(
      pick("cardexpiration", "card_expiration", "expiry", "expiration")
    ),
    cardusername: val(pick("cardusername", "card_name", "name_on_card")),
    cardissuingbank: val(pick("cardissuingbank", "issuing_bank")),
    cardcustomerservicephone: val(
      pick(
        "cardcustomerservicephone",
        "customer_service",
        "customer_service_phone"
      )
    ),

    // Other
    income: val(pick("income", "annual_income")),
    custommessage: val(pick("custommessage", "message")),
    comments: val(pick("comments", "note", "notes"))
  }

  // Validate required after normalization
  const required: (keyof AutofillData)[] = [
    "firstname",
    "lastname",
    "username",
    "email",
    "password",
    "gender",
    "dob"
  ]
  const ok = required.every(
    (k) => typeof data[k] === "string" && (data[k] as string).length > 0
  )
  if (!ok) {
    const missing = required.filter(
      (k) => !data[k] || (data[k] as string).length === 0
    )
    console.error("❌ Validation failed. Missing required fields:", missing)
    console.log(
      "🔍 Normalized data sample:",
      JSON.stringify(data).slice(0, 300)
    )
  }
  return ok ? data : null
}

// 1) Fetch from backend API and return parsed output
export async function fetchAutofillData(): Promise<AutofillData | null> {
  try {
    // Read optional backend API key from storage (and env as fallback)
    const backendKey = await new Promise<string | null>((resolve) => {
      try {
        if (!chrome?.runtime?.id) return resolve(null)
        chrome.storage.local.get(["backendApiKey", "geminiApiKey"], (res) => {
          resolve(
            (res.backendApiKey as string | undefined) ||
              (res.geminiApiKey as string | undefined) ||
              null
          )
        })
      } catch {
        resolve(null)
      }
    })
    const envKey = process.env.PLASMO_PUBLIC_BACKEND_API_KEY || null
    const apiKey = backendKey || envKey

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(GENERATE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey
          ? {
              Authorization: `Bearer ${apiKey}`,
              "x-api-key": apiKey
            }
          : {})
      },
      // Body can be extended later to pass preferences
      body: JSON.stringify({}),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!res.ok) {
      console.error("Backend responded with non-OK status:", res.status)
      return null
    }

    const json = (await res.json()) as any
    const raw =
      json && typeof json === "object" && "output" in json ? json.output : json

    console.log("📥 Backend response received:", {
      hasOutput: !!json?.output,
      sampleKeys:
        raw && typeof raw === "object" ? Object.keys(raw).slice(0, 10) : []
    })

    const normalized = normalizeAutofill(raw)
    if (!normalized) {
      try {
        const keys = raw && typeof raw === "object" ? Object.keys(raw) : []
        console.error("❌ Invalid or missing fields in backend response", {
          keys,
          sample: JSON.stringify(raw)?.slice(0, 200)
        })
      } catch {
        console.error("❌ Invalid or missing fields in backend response")
      }
    } else {
      console.log("✅ Backend data normalized successfully")
    }
    return normalized || null
  } catch (err: any) {
    if (err?.name === "AbortError") {
      console.error("Backend request timed out")
    } else {
      console.error("Failed to fetch autofill data:", err?.message || err)
    }
    return null
  }
}

// Single generation function with retry logic (now using backend only)
export async function generateDummyData(
  retryCount: number = 0
): Promise<DummyUserData | null> {
  const maxRetries = 3

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const data = await fetchAutofillData()
    if (data) {
      console.log("✅ Successfully fetched autofill data from backend")
      return data
    }

    if (attempt < maxRetries) {
      const delayMs = 1000 * (attempt + 1)
      console.log(`⏳ Backend fetch failed, retrying in ${delayMs}ms...`)
      await delay(delayMs)
    }
  }

  console.error("❌ All backend fetch attempts failed")
  return null
}

// Simple cache system with single entry and 10 minute auto-refresh
let cachedData: DummyUserData | null = null
let cacheTimestamp: number = 0
const CACHE_REFRESH_DURATION = 10 * 60 * 1000 // 10 minutes
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
