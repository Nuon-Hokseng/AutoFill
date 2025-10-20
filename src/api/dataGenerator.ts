import { GoogleGenerativeAI } from "@google/generative-ai"
import * as dotenv from "dotenv"

dotenv.config()
const genAI = new GoogleGenerativeAI(process.env.KEY)

export async function generateDummyData() {
  const prompt = `
    Generate a random but realistic dummy user info in JSON:
    - username
    - email
    - password
    - first name
    - last name
    - date of birth (DD-MM-YYYY)
  `

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
    const response = await model.generateContent(prompt)
    let content = await response.response.text()

    content = content.replace(/```json|```/g, "").trim()

    return JSON.parse(content)
  } catch (error) {
    console.error("Error generating dummy data:", error)
    return null
  }
}
