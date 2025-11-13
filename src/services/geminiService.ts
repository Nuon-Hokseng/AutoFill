// Service for generating dummy data using Gemini API
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini AI
const getGeminiClient = () => {
  const apiKey = process.env.PLASMO_PUBLIC_GEMINI_API_KEY
  if (!apiKey) {
    console.error("Gemini API key not found in environment variables")
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

// Fallback dummy data when API is unavailable
function generateFallbackDummyData(): DummyUserData {
  const firstNames = [
    "Yuki",
    "Amara",
    "Diego",
    "Priya",
    "Khalid",
    "Sofia",
    "Chen",
    "Olga",
    "Ravi",
    "Zara"
  ]
  const lastNames = [
    "Tanaka",
    "Okonkwo",
    "Rodriguez",
    "Sharma",
    "Al-Rashid",
    "Ivanova",
    "Wong",
    "Silva",
    "Patel",
    "Kim"
  ]
  const cities = [
    "Tokyo",
    "Lagos",
    "Mumbai",
    "Cairo",
    "São Paulo",
    "Seoul",
    "Bangkok",
    "Istanbul",
    "London",
    "Toronto"
  ]
  const companies = [
    "Tech Solutions Inc",
    "Global Dynamics",
    "Innovation Labs",
    "Digital Ventures",
    "Future Systems"
  ]
  const positions = [
    "Software Engineer",
    "Product Manager",
    "Data Analyst",
    "UX Designer",
    "Marketing Specialist"
  ]

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
  const middleName = firstNames[
    Math.floor(Math.random() * firstNames.length)
  ].substring(0, 5)
  const city = cities[Math.floor(Math.random() * cities.length)]
  const company = companies[Math.floor(Math.random() * companies.length)]
  const position = positions[Math.floor(Math.random() * positions.length)]

  const randomDigits = (n: number) =>
    Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("")
  const randomYear = 1965 + Math.floor(Math.random() * 40) // 1965-2005
  const randomMonth = 1 + Math.floor(Math.random() * 12)
  const randomDay = 1 + Math.floor(Math.random() * 28)
  const age = new Date().getFullYear() - randomYear

  return {
    title: Math.random() > 0.5 ? "Mr" : "Ms",
    firstname: firstName,
    middlename: middleName,
    middleinitial: middleName[0],
    lastname: lastName,
    fullname: `${firstName} ${middleName} ${lastName}`,
    username: `${firstName.toLowerCase()}${randomDigits(3)}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    password: `${firstName}${randomDigits(4)}!@#`,
    gender: Math.random() > 0.5 ? "2" : "1",
    dob: `${String(randomDay).padStart(2, "0")}-${String(randomMonth).padStart(2, "0")}-${randomYear}`,
    age: String(age),
    birthplace: `${city}, World`,
    ssn: `${randomDigits(3)}-${randomDigits(2)}-${randomDigits(4)}`,
    driverslicense: `DL${randomDigits(8)}`,
    company: company,
    position: position,
    address1: `${randomDigits(3)} Main Street`,
    address2: `Apt ${randomDigits(2)}`,
    city: city,
    state: "CA",
    zipcode: randomDigits(5),
    postalcode: randomDigits(5),
    country: "United States",
    homephone: `${randomDigits(3)}-${randomDigits(3)}-${randomDigits(4)}`,
    workphone: `${randomDigits(3)}-${randomDigits(3)}-${randomDigits(4)}`,
    fax: `${randomDigits(3)}-${randomDigits(3)}-${randomDigits(4)}`,
    cellphone: `${randomDigits(3)}-${randomDigits(3)}-${randomDigits(4)}`,
    website: `https://${firstName.toLowerCase()}${lastName.toLowerCase()}.com`,
    userid: `${firstName.toLowerCase()}${randomDigits(3)}`,
    creditcardtype: ["Visa", "Mastercard", "Amex", "Discover"][
      Math.floor(Math.random() * 4)
    ],
    creditcardnumber: `4${randomDigits(15)}`,
    cardverificationcode: randomDigits(3),
    cardexpiration: `${String(randomMonth).padStart(2, "0")}/${String(randomYear + 60).slice(-2)}`,
    cardusername: `${firstName} ${middleName} ${lastName}`,
    cardissuingbank: "Global Bank",
    cardcustomerservicephone: `${randomDigits(3)}-${randomDigits(3)}-${randomDigits(4)}`,
    income: `${50 + Math.floor(Math.random() * 150)}000`,
    custommessage: "This is a test account",
    comments: "Generated locally due to API unavailability"
  }
}

export async function generateDummyData(): Promise<DummyUserData | null> {
  const genAI = getGeminiClient()

  if (!genAI) {
    console.error("Failed to initialize Gemini client, using fallback data")
    return generateFallbackDummyData()
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
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

    // Check if it's a quota/rate limit error
    const errorMessage = error?.toString() || ""
    if (
      errorMessage.includes("quota") ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("429") ||
      errorMessage.includes("RESOURCE_EXHAUSTED")
    ) {
      console.warn(
        "⚠️ API quota exceeded, using fallback local data generation"
      )
      return generateFallbackDummyData()
    }

    // For other errors, also use fallback
    console.warn("⚠️ API error occurred, using fallback local data generation")
    return generateFallbackDummyData()
  }
}

// Cache for generated data to avoid multiple API calls
let cachedData: DummyUserData | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 1 * 60 * 1000

export async function getCachedOrGenerateData(): Promise<DummyUserData | null> {
  const now = Date.now()

  // Return cached data if it's still valid
  if (cachedData && now - cacheTimestamp < CACHE_DURATION) {
    console.log("📦 Using cached dummy data")
    return cachedData
  }

  // Generate new data (will use fallback if API fails)
  const newData = await generateDummyData()

  if (newData) {
    cachedData = newData
    cacheTimestamp = now
  } else {
    // Last resort: use fallback if everything fails
    console.warn("⚠️ All generation methods failed, using fresh fallback data")
    const fallbackData = generateFallbackDummyData()
    cachedData = fallbackData
    cacheTimestamp = now
    return fallbackData
  }

  return newData
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
