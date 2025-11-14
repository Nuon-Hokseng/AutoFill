// Service for generating dummy data using Gemini API
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const getGeminiClient = () => {
  const apiKey = process.env.PLASMO_PUBLIC_GEMINI_API
  if (!apiKey) {
    console.error(
      "Gemini API key not found. Make sure PLASMO_PUBLIC_GEMINI_API is set in .env file"
    )
    console.error(
      "Available env vars:",
      Object.keys(process.env).filter((k) => k.startsWith("PLASMO"))
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

export async function generateDummyData(): Promise<DummyUserData | null> {
  const genAI = getGeminiClient()

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

  try {
    // Use gemini-1.5-flash for production with Pro plan support
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" })
    const response = await model.generateContent(prompt)
    let content = await response.response.text()

    // Clean up the response - remove markdown code blocks if present
    content = content.replace(/```json\s*|\s*```/g, "").trim()

    const data = JSON.parse(content) as DummyUserData

    // Validate the data structure - only check required fields
    if (
      !data.username ||
      !data.email ||
      !data.password ||
      !data.firstname ||
      !data.lastname ||
      !data.dob ||
      !data.gender
    ) {
      console.error("Generated data is missing required fields:", data)
      return null
    }

    console.log("✅ Successfully generated dummy data via Gemini API")
    return data
  } catch (error) {
    console.error("Error generating dummy data with Gemini:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    return null
  }
}

// Cache for generated data to avoid multiple API calls
let cachedData: DummyUserData | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes to reduce API calls

// Track if generation is in progress to prevent concurrent calls
let isGenerating = false
let generationPromise: Promise<DummyUserData | null> | null = null

export async function getCachedOrGenerateData(): Promise<DummyUserData | null> {
  const now = Date.now()

  // Return cached data if it's still valid
  if (cachedData && now - cacheTimestamp < CACHE_DURATION) {
    console.log(
      "📦 Using cached dummy data (age: " +
        Math.floor((now - cacheTimestamp) / 1000) +
        "s)"
    )
    return cachedData
  }

  // If already generating, wait for that to complete
  if (isGenerating && generationPromise) {
    console.log("⏳ Generation already in progress, waiting...")
    return generationPromise
  }

  // Generate new data from Gemini API only
  isGenerating = true
  generationPromise = generateDummyData()

  try {
    const newData = await generationPromise

    if (newData) {
      cachedData = newData
      cacheTimestamp = Date.now()
      console.log("✅ New data cached successfully")
    }

    return newData
  } finally {
    isGenerating = false
    generationPromise = null
  }
}

// Preload data into cache without waiting
export function preloadData(): void {
  console.log("🚀 Preloading dummy data in background...")
  generateDummyData()
    .then((data) => {
      if (data) {
        cachedData = data
        cacheTimestamp = Date.now()
        console.log("✅ Dummy data preloaded and ready!")
      }
    })
    .catch((error) => {
      console.error("Error preloading dummy data:", error)
    })
}

// Check if cache has valid data
export function hasCachedData(): boolean {
  const now = Date.now()
  return cachedData !== null && now - cacheTimestamp < CACHE_DURATION
}

// Force refresh the cached data
export function clearCache() {
  cachedData = null
  cacheTimestamp = 0
}
