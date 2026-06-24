import { templateRepository } from './template.repository'

export class TemplateService {
  list(category?: string) {
    return templateRepository.findAll(category)
  }

  getBySlug(slug: string) {
    return templateRepository.findBySlug(slug)
  }
}

export const templateService = new TemplateService()
