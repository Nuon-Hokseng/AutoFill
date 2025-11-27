export interface ParsedDate {
  day: string
  month: string
  year: string
  fullYear: string // 4-digit year
}

export type DateFormat =
  | "DD-MM-YYYY"
  | "MM-DD-YYYY"
  | "YYYY-MM-DD"
  | "DD/MM/YYYY"
  | "MM/DD/YYYY"
  | "YYYY/MM/DD"
  | "DD.MM.YYYY"
  | "MM.DD.YYYY"
  | "YYYY.MM.DD"
  | "DDMMYYYY"
  | "MMDDYYYY"
  | "YYYYMMDD"

export function detectDateFormat(dateStr: string): DateFormat | null {
  const cleaned = dateStr.trim()

  const hasDash = cleaned.includes("-")
  const hasSlash = cleaned.includes("/")
  const hasDot = cleaned.includes(".")
  const noSeparator = !hasDash && !hasSlash && !hasDot

  let parts: string[] = []
  if (hasDash) parts = cleaned.split("-")
  else if (hasSlash) parts = cleaned.split("/")
  else if (hasDot) parts = cleaned.split(".")
  else if (noSeparator && cleaned.length === 8) {
    parts = [cleaned.slice(0, 2), cleaned.slice(2, 4), cleaned.slice(4, 8)]
  } else {
    return null
  }

  if (parts.length !== 3) return null

  const [first, second, third] = parts.map((p) => p.trim())
  const firstNum = parseInt(first, 10)
  const secondNum = parseInt(second, 10)
  const thirdNum = parseInt(third, 10)

  if (first.length === 4 && thirdNum <= 31) {
    if (hasDash) return "YYYY-MM-DD"
    if (hasSlash) return "YYYY/MM/DD"
    if (hasDot) return "YYYY.MM.DD"
    if (noSeparator) return "YYYYMMDD"
  }

  if (third.length === 4 || third.length === 2) {
    if (firstNum > 12) {
      if (hasDash) return "DD-MM-YYYY"
      if (hasSlash) return "DD/MM/YYYY"
      if (hasDot) return "DD.MM.YYYY"
      if (noSeparator) return "DDMMYYYY"
    }

    if (secondNum > 12) {
      if (hasDash) return "MM-DD-YYYY"
      if (hasSlash) return "MM/DD/YYYY"
      if (hasDot) return "MM.DD.YYYY"
      if (noSeparator) return "MMDDYYYY"
    }

    if (firstNum <= 31 && secondNum <= 12) {
      if (hasDash) return "DD-MM-YYYY"
      if (hasSlash) return "DD/MM/YYYY"
      if (hasDot) return "DD.MM.YYYY"
      if (noSeparator) return "DDMMYYYY"
    }

    if (firstNum <= 12 && secondNum <= 31) {
      if (hasDash) return "MM-DD-YYYY"
      if (hasSlash) return "MM/DD/YYYY"
      if (hasDot) return "MM.DD.YYYY"
      if (noSeparator) return "MMDDYYYY"
    }
  }

  return null
}

function expandYear(yearStr: string): string {
  if (yearStr.length === 4) return yearStr
  if (yearStr.length !== 2) return yearStr

  const year = parseInt(yearStr, 10)
  const currentYear = new Date().getFullYear()
  const currentCentury = Math.floor(currentYear / 100) * 100
  const threshold = (currentYear % 100) + 20

  if (year > threshold) {
    return String(currentCentury - 100 + year)
  } else {
    return String(currentCentury + year)
  }
}

export function parseDate(
  dateStr: string,
  format?: DateFormat
): ParsedDate | null {
  const cleaned = dateStr.trim()
  if (!cleaned) return null

  const detectedFormat = format || detectDateFormat(cleaned)
  if (!detectedFormat) {
    console.warn(`Could not detect date format for: ${dateStr}`)
    return null
  }

  let parts: string[] = []
  if (detectedFormat.includes("-")) parts = cleaned.split("-")
  else if (detectedFormat.includes("/")) parts = cleaned.split("/")
  else if (detectedFormat.includes(".")) parts = cleaned.split(".")
  else if (cleaned.length === 8) {
    // No separator formats
    parts = [cleaned.slice(0, 2), cleaned.slice(2, 4), cleaned.slice(4, 8)]
  }

  if (parts.length !== 3) return null

  let day = ""
  let month = ""
  let year = ""

  switch (detectedFormat) {
    case "DD-MM-YYYY":
    case "DD/MM/YYYY":
    case "DD.MM.YYYY":
    case "DDMMYYYY":
      day = parts[0].padStart(2, "0")
      month = parts[1].padStart(2, "0")
      year = parts[2]
      break

    case "MM-DD-YYYY":
    case "MM/DD/YYYY":
    case "MM.DD.YYYY":
    case "MMDDYYYY":
      month = parts[0].padStart(2, "0")
      day = parts[1].padStart(2, "0")
      year = parts[2]
      break

    case "YYYY-MM-DD":
    case "YYYY/MM/DD":
    case "YYYY.MM.DD":
    case "YYYYMMDD":
      year = parts[0]
      month = parts[1].padStart(2, "0")
      day = parts[2].padStart(2, "0")
      break

    default:
      return null
  }

  const fullYear = expandYear(year)

  const dayNum = parseInt(day, 10)
  const monthNum = parseInt(month, 10)
  if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12) {
    console.warn(
      `Invalid date values: day=${day}, month=${month}, year=${year}`
    )
    return null
  }

  return { day, month, year: year.padStart(2, "0"), fullYear }
}

export function formatDate(parsed: ParsedDate, format: DateFormat): string {
  const { day, month, fullYear } = parsed
  const shortYear = fullYear.slice(-2)

  switch (format) {
    case "DD-MM-YYYY":
      return `${day}-${month}-${fullYear}`
    case "MM-DD-YYYY":
      return `${month}-${day}-${fullYear}`
    case "YYYY-MM-DD":
      return `${fullYear}-${month}-${day}`
    case "DD/MM/YYYY":
      return `${day}/${month}/${fullYear}`
    case "MM/DD/YYYY":
      return `${month}/${day}/${fullYear}`
    case "YYYY/MM/DD":
      return `${fullYear}/${month}/${day}`
    case "DD.MM.YYYY":
      return `${day}.${month}.${fullYear}`
    case "MM.DD.YYYY":
      return `${month}.${day}.${fullYear}`
    case "YYYY.MM.DD":
      return `${fullYear}.${month}.${day}`
    case "DDMMYYYY":
      return `${day}${month}${fullYear}`
    case "MMDDYYYY":
      return `${month}${day}${fullYear}`
    case "YYYYMMDD":
      return `${fullYear}${month}${day}`
    default:
      return `${day}-${month}-${fullYear}`
  }
}

export function convertDateFormat(
  dateStr: string,
  targetFormat: DateFormat
): string | null {
  const parsed = parseDate(dateStr)
  if (!parsed) return null
  return formatDate(parsed, targetFormat)
}
