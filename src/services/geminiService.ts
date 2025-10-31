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
  username: string
  email: string
  password: string
  firstname: string
  lastname: string
  dob: string
  gender: string
  zipcode?: string
  postalcode?: string
}

export async function generateDummyData(): Promise<DummyUserData | null> {
  const genAI = getGeminiClient()

  if (!genAI) {
    console.error("Failed to initialize Gemini client")
    return null
  }

  const prompt = `
Generate a random but realistic dummy user information in JSON format.
The data should be realistic and varied each time.

Required fields:
- username (lowercase, 8-12 characters, can include numbers)
- email (valid email format)
- password (strong password, 12-16 characters with mix of letters, numbers, symbols it does not need to have password word in it, just random word with symbols and letter, number are fine)
- firstname (realistic first name)
- lastname (realistic last name)
- make the username, firstname and lastname be international and random, not only emily, sarah which are for USA not asian and african
- dob (date of birth in DD-MM-YYYY format, person should be between 18-60 years old)
- gender (exactly "1" for Female or "2" for Male)
- zipcode (5 digit US zipcode)
- postalcode (5 digit postal code)

Return ONLY valid JSON, no markdown formatting, no explanations.
Example format:
{
  "username": "johndoe123",
  "email": "john.doe@example.com",
  "password": "SecurePass123!@",
  "firstname": "John",
  "lastname": "Doe",
  "dob": "15-03-1990",
  "gender": "2",
  "zipcode": "12345",
  "postalcode": "12345"
}
`

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
    const response = await model.generateContent(prompt)
    let content = await response.response.text()

    // Clean up the response - remove markdown code blocks if present
    content = content.replace(/```json\s*|\s*```/g, "").trim()

    const data = JSON.parse(content) as DummyUserData

    // Validate the data structure
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
    return null
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

  // Generate new data
  const newData = await generateDummyData()

  if (newData) {
    cachedData = newData
    cacheTimestamp = now
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
