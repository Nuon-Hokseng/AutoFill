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
    username: val(pick("username", "userName", "user_name")) || "",
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
    userid: val(pick("userid", "userId", "user_id")),

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

// Helper to generate random password
const generateRandomPassword = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*"
  const length = 12 + Math.floor(Math.random() * 5) // 12-16 chars
  let pwd = ""
  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)]
  }
  return pwd
}

// Backup dummy data pool for instant use while AI generates
const BACKUP_DUMMY_POOL: AutofillData[] = [
  {
    title: "Mr",
    firstname: "Alex",
    middlename: "Jordan",
    middleinitial: "J",
    lastname: "Chen",
    fullname: "Alex Jordan Chen",
    username: "alexchen2024",
    email: "alex.chen@example.com",
    password: generateRandomPassword(),
    gender: "2",
    dob: "15-03-1992",
    age: "32",
    birthplace: "Singapore",
    ssn: "456-78-9012",
    driverslicense: "SG8765432",
    company: "Tech Solutions Pte Ltd",
    position: "Software Developer",
    address1: "45 Marina Boulevard",
    address2: "Unit 12-03",
    city: "Singapore",
    state: "Central Region",
    zipcode: "018956",
    postalcode: "018956",
    country: "Singapore",
    homephone: "+65 6234-5678",
    workphone: "+65 6345-6789",
    fax: "+65 6456-7890",
    cellphone: "+65 9123-4567",
    website: "https://alexchen.dev",
    userid: "alexchen2024",
    creditcardtype: "Visa",
    creditcardnumber: "4532123456789012",
    cardverificationcode: "789",
    cardexpiration: "06/27",
    cardusername: "Alex Jordan Chen",
    cardissuingbank: "DBS Bank",
    cardcustomerservicephone: "+65 1800-111-1111",
    income: "78000",
    custommessage: "Innovation through code",
    comments: "Passionate about web development"
  },
  {
    title: "Ms",
    firstname: "Maria",
    middlename: "Sofia",
    middleinitial: "S",
    lastname: "Garcia",
    fullname: "Maria Sofia Garcia",
    username: "mariagarcia89",
    email: "maria.garcia@ejemplo.es",
    password: generateRandomPassword(),
    gender: "1",
    dob: "22-08-1989",
    age: "35",
    birthplace: "Madrid, Spain",
    ssn: "789-01-2345",
    driverslicense: "ES1234567890",
    company: "Innovación Digital SA",
    position: "Project Manager",
    address1: "Calle Gran Via 28",
    address2: "Piso 5A",
    city: "Madrid",
    state: "Madrid",
    zipcode: "28013",
    postalcode: "28013",
    country: "Spain",
    homephone: "+34 91 123 4567",
    workphone: "+34 91 234 5678",
    fax: "+34 91 345 6789",
    cellphone: "+34 612 345 678",
    website: "https://mariagarcia.es",
    userid: "mariagarcia89",
    creditcardtype: "Mastercard",
    creditcardnumber: "5412345678901234",
    cardverificationcode: "456",
    cardexpiration: "09/28",
    cardusername: "Maria Sofia Garcia",
    cardissuingbank: "Banco Santander",
    cardcustomerservicephone: "+34 900 123 123",
    income: "65000",
    custommessage: "Leading with purpose",
    comments: "Loves traveling and photography"
  },
  {
    title: "Dr",
    firstname: "Yuki",
    middlename: "Haruto",
    middleinitial: "H",
    lastname: "Tanaka",
    fullname: "Yuki Haruto Tanaka",
    username: "yukitanaka",
    email: "yuki.tanaka@example.jp",
    password: generateRandomPassword(),
    gender: "2",
    dob: "10-11-1985",
    age: "39",
    birthplace: "Tokyo, Japan",
    ssn: "234-56-7890",
    driverslicense: "JP9876543210",
    company: "Tokyo Medical Center",
    position: "Senior Physician",
    address1: "1-2-3 Shibuya",
    address2: "Apt 801",
    city: "Tokyo",
    state: "Tokyo",
    zipcode: "150-0002",
    postalcode: "150-0002",
    country: "Japan",
    homephone: "+81 3-1234-5678",
    workphone: "+81 3-2345-6789",
    fax: "+81 3-3456-7890",
    cellphone: "+81 90-1234-5678",
    website: "https://yukitanaka.jp",
    userid: "yukitanaka",
    creditcardtype: "Amex",
    creditcardnumber: "378282246310005",
    cardverificationcode: "1234",
    cardexpiration: "12/26",
    cardusername: "Yuki Haruto Tanaka",
    cardissuingbank: "Mitsubishi UFJ Bank",
    cardcustomerservicephone: "+81 120-123-456",
    income: "120000",
    custommessage: "Healing with compassion",
    comments: "Enjoys classical music and golf"
  }
]

// Track if we're using backup data
let usingBackupData = false

// Simple cache system with single entry and 1 hour auto-refresh
let cachedData: DummyUserData | null = null
let cacheTimestamp: number = 0
const CACHE_REFRESH_DURATION = 60 * 60 * 1000
let refreshTimer: NodeJS.Timeout | null = null
let isGenerating = false

// Get random backup dummy data with fresh password
function getBackupData(): AutofillData {
  const randomIndex = Math.floor(Math.random() * BACKUP_DUMMY_POOL.length)
  const backup = { ...BACKUP_DUMMY_POOL[randomIndex] }
  // Generate fresh random password each time
  backup.password = generateRandomPassword()
  console.log("🎲 Using backup dummy data (random profile)")
  return backup
}

// Initialize cache with single entry (with retries)
async function initializeCache(attemptNumber: number = 1): Promise<void> {
  const maxAttempts = 3

  if (isGenerating) {
    console.log("⏳ Generation already in progress...")
    return
  }

  isGenerating = true
  console.log(
    `🔄 Generating AI dummy data (attempt ${attemptNumber}/${maxAttempts})...`
  )

  // Immediately provide backup data for instant use
  if (!cachedData) {
    const backupData = getBackupData()
    cachedData = backupData
    cacheTimestamp = Date.now()
    usingBackupData = true
    console.log("⚡ Backup data ready for instant use while AI generates...")
  }

  try {
    const newData = await generateDummyData()

    if (newData) {
      cachedData = newData
      cacheTimestamp = Date.now()
      usingBackupData = false

      // Save to chrome storage for persistence
      chrome.storage.local.set(
        {
          generatedData: newData,
          generatedDataTimestamp: cacheTimestamp,
          usingBackup: false
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

      console.log("✅ AI-generated data cached and replaced backup!")

      // Schedule auto-refresh after 1 hour
      scheduleCacheRefresh()
    } else {
      console.error(`❌ Failed to generate AI data on attempt ${attemptNumber}`)

      // Keep using backup data if generation fails
      if (attemptNumber >= maxAttempts) {
        console.warn(
          "⚠️ All AI generation attempts failed, continuing with backup data"
        )
      } else {
        // Retry if we haven't exceeded max attempts
        isGenerating = false
        const retryDelay = attemptNumber * 3000 // 3s, 6s, 9s
        console.log(`⏳ Retrying AI generation in ${retryDelay}ms...`)
        await delay(retryDelay)
        return initializeCache(attemptNumber + 1)
      }
    }
  } catch (error) {
    console.error("Error generating AI cached data:", error)

    // Retry if we haven't exceeded max attempts
    if (attemptNumber < maxAttempts) {
      isGenerating = false
      const retryDelay = attemptNumber * 3000
      console.log(`⏳ Retrying after error in ${retryDelay}ms...`)
      await delay(retryDelay)
      return initializeCache(attemptNumber + 1)
    } else {
      console.warn("⚠️ Keeping backup data due to generation errors")
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
    console.log("🔄 Auto-refreshing cached data after 1 hour...")
    initializeCache()
  }, CACHE_REFRESH_DURATION)

  console.log("⏰ Cache auto-refresh scheduled for 1 hour from now")
}

// Get cached data (instant, no waiting!)
export async function getCachedOrGenerateData(): Promise<DummyUserData | null> {
  const now = Date.now()

  // Try to load from storage if memory cache is empty
  if (!cachedData) {
    const stored = await new Promise<{
      generatedData?: DummyUserData
      generatedDataTimestamp?: number
      usingBackup?: boolean
    }>((resolve) => {
      chrome.storage.local.get(
        ["generatedData", "generatedDataTimestamp", "usingBackup"],
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
        usingBackupData = stored.usingBackup || false
        scheduleCacheRefresh()
        const dataType = usingBackupData ? "backup" : "AI-generated"
        console.log(
          `✅ Restored ${dataType} data from storage (age: ${Math.floor(storedAge / 1000)}s)`
        )
      }
    }
  }

  // Check if cache needs initialization or refresh
  if (!cachedData || now - cacheTimestamp > CACHE_REFRESH_DURATION) {
    console.log("🔄 Cache empty or expired, initializing...")
    await initializeCache()
  }

  // If still no data after initialization attempt, use backup as last resort
  if (!cachedData) {
    console.warn("⚠️ No cached data available, using backup as fallback")
    cachedData = getBackupData()
    cacheTimestamp = now
    usingBackupData = true
  }

  const cacheAge = Math.floor((now - cacheTimestamp) / 1000)
  const dataType = usingBackupData ? "backup" : "AI-generated"
  console.log(`⚡ Instantly serving ${dataType} data (age: ${cacheAge}s)`)

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
  usingBackupData = false
  if (refreshTimer) {
    clearTimeout(refreshTimer)
    refreshTimer = null
  }

  // Clear from storage as well
  chrome.storage.local.remove(
    ["generatedData", "generatedDataTimestamp", "usingBackup"],
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
