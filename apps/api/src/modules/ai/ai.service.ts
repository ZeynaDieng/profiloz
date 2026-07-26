import { AppError } from '@/lib/errors'

export class AiService {
  private getApiKey(): string {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new AppError(503, 'Service Unavailable', 'L’API IA Gemini n’est pas configurée.')
    }
    return apiKey
  }

  async enhanceText(text: string, context?: string): Promise<string> {
    if (!text || !text.trim()) return text
    const apiKey = this.getApiKey()

    const prompt = `You are an expert in professional English resume writing.
Enhance this text to make it punchy, elegant, grammatically perfect, and extremely concise and factual.
Do not lengthen the text unnecessarily and avoid corporate fluff or overly long sentences.
${context ? `Context: ${context}` : ''}
Text: "${text}"

Respond ONLY with the final enhanced English text. No comments, no intro, no quotation marks.`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 512,
          },
        }),
      },
    )

    if (!res.ok) {
      throw new AppError(502, 'Bad Gateway', 'Erreur lors de l’appel à l’IA')
    }

    const data = await res.json()
    const output = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    return output || text
  }

  async suggestBullets(jobTitle: string): Promise<string[]> {
    if (!jobTitle || !jobTitle.trim()) return []
    const apiKey = this.getApiKey()

    const prompt = `For the position of "${jobTitle}", generate 5 punchy professional achievement and task bullet points in English for a resume.
Strict style guidelines:
- Be extremely concise, direct, and results-oriented.
- Start each bullet point with a strong English action verb (e.g., "Managed", "Optimized", "Developed", "Designed", "Led", "Created").
- Write short sentences (maximum 10 to 12 words per bullet point). Avoid unnecessary corporate fluff.

Respond ONLY with a valid JSON array of strings:
[
  "Developed a new...",
  "Managed a team of...",
  "Optimized workflow by...",
  "Designed and implemented...",
  "Led the integration of..."
]`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
            maxOutputTokens: 512,
          },
        }),
      },
    )

    if (!res.ok) return []

    const data = await res.json()
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!textOutput) return []

    try {
      const parsed = JSON.parse(textOutput)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  async generateLetter(input: {
    jobOfferText: string
    candidateInfo?: string
    targetCompany?: string
    targetPosition?: string
  }): Promise<{ content: string; subject: string }> {
    const apiKey = this.getApiKey()

    const prompt = `Write a captivating and highly targeted cover letter in English.

Job Description/Offer: ${input.jobOfferText}
${input.targetPosition ? `Target Position: ${input.targetPosition}` : ''}
${input.targetCompany ? `Target Company: ${input.targetCompany}` : ''}
${input.candidateInfo ? `Candidate Profile:\n${input.candidateInfo}` : ''}

Respond ONLY with a valid JSON object:
{
  "subject": "Subject of the cover letter (e.g., Application for [Position] at [Company])",
  "content": "Full body of the cover letter in English (with \\n\\n line breaks between paragraphs)"
}`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.4,
            maxOutputTokens: 1024,
          },
        }),
      },
    )

    if (!res.ok) {
      throw new AppError(502, 'Bad Gateway', 'Erreur lors de la génération de la lettre avec l’IA')
    }

    const data = await res.json()
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!textOutput) {
      throw new AppError(500, 'Internal Server Error', 'Réponse IA vide')
    }

    const parsed = JSON.parse(textOutput)
    return {
      subject: parsed.subject || 'Candidature',
      content: parsed.content || '',
    }
  }
}

export const aiService = new AiService()
