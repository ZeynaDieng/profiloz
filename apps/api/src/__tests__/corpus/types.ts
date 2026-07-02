export interface CorpusExpectations {
  fullName?: string | RegExp
  jobTitle?: RegExp
  email?: string
  minExperiences?: number
  maxExperiences?: number
  minEducations?: number
  minSkills?: number
  minLanguages?: number
  experiencePositions?: RegExp[]
}

export interface CorpusCase {
  name: string
  format: string
  rawText: string
  expect: CorpusExpectations
  strict?: boolean
}
