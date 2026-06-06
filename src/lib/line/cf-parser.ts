interface ParsedCF {
  cf_code: string
  raw: string
}

export function parseCFMessage(
  message: string
): ParsedCF | null {
  const text = message.trim()
  if (!text) return null

  // รองรับ: "A1", "a1", "ก1", "B2", "CF1"
  // ตัวอักษร(ไทย/อังกฤษ) + เว้นว่างได้ + ตัวเลข
  // ไม่รับจำนวน ไม่รับอะไรต่อท้าย
  const match = text.match(
    /^([a-zA-Zก-๙]+)\s*(\d+)$/
  )

  if (!match) return null

  const prefix = match[1].toUpperCase()
  const number = match[2]

  return {
    cf_code: `${prefix}${number}`,
    raw: text
  }
}
