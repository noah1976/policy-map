let cachedFont: ArrayBuffer | undefined

export async function japaneseFont() {
  if (!cachedFont) {
    // Google Fonts' Noto Sans JP TTF contains the Japanese glyph ranges used by labels and descriptions.
    const response = await fetch('https://fonts.gstatic.com/s/notosansjp/v56/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFPYk75s.ttf')
    if (!response.ok) throw new Error(`Japanese OGP font unavailable: ${response.status}`)
    cachedFont = await response.arrayBuffer()
  }
  return cachedFont
}
