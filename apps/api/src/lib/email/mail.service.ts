import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'

function interpolate(template: string, variables: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? '')
}

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim())
}

function createTransporter() {
  const port = Number(process.env.SMTP_PORT ?? 587)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS ?? '',
        }
      : undefined,
  })
}

export async function sendEmailTemplate(
  slug: string,
  to: string,
  variables: Record<string, string> = {},
) {
  const template = await prisma.emailTemplate.findUnique({ where: { slug } })
  if (!template || !template.isActive) {
    return { sent: false, reason: 'template_unavailable' as const }
  }

  if (!isSmtpConfigured()) {
    console.info(`[mail] SMTP non configuré — email « ${slug} » non envoyé à ${to}`)
    return { sent: false, reason: 'smtp_not_configured' as const }
  }

  const transporter = createTransporter()
  const from = process.env.SMTP_FROM?.trim() || "Profilo'Z <noreply@profiloz.com>"

  await transporter.sendMail({
    from,
    to,
    subject: interpolate(template.subject, variables),
    html: interpolate(template.bodyHtml, variables),
    text: template.bodyText ? interpolate(template.bodyText, variables) : undefined,
  })

  return { sent: true as const }
}

export async function sendRawEmail(input: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  if (!isSmtpConfigured()) {
    console.info(`[mail] SMTP non configuré — email non envoyé à ${input.to}`)
    return { sent: false, reason: 'smtp_not_configured' as const }
  }

  const transporter = createTransporter()
  const from = process.env.SMTP_FROM?.trim() || "Profilo'Z <noreply@profiloz.com>"

  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  })

  return { sent: true as const }
}
