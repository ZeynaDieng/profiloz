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

const FALLBACK_TEMPLATES: Record<string, { subject: string; bodyHtml: string; bodyText?: string }> = {
  document_download: {
    subject: 'Votre {{documentType}} est prêt ! 🚀',
    bodyHtml: `
<div style="font-family: sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #0f172a; margin-bottom: 20px;">Votre {{documentType}} est prêt ! 🚀</h2>
  <p>Bonjour {{firstName}},</p>
  <p>Vous venez de générer votre <strong>{{documentType}}</strong> sur Profilo'Z. Vous pouvez le télécharger directement en cliquant sur le bouton ci-dessous :</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{downloadUrl}}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Télécharger mon {{documentType}}</a>
  </div>
  
  <p style="font-size: 0.9em; color: #64748b; background-color: #f8fafc; padding: 12px; border-radius: 6px;">
    ⚠️ <strong>Important :</strong> Ce lien de téléchargement direct expire dans <strong>24 heures</strong> pour des raisons de sécurité. 
    Pas d'inquiétude ! Vous pourrez toujours régénérer votre document gratuitement depuis votre tableau de bord.
  </p>

  <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <h4 style="color: #166534; margin: 0 0 5px 0; font-size: 1.05em; font-weight: bold;">💾 Conservez vos documents à vie !</h4>
    <p style="margin: 0; font-size: 0.9em; color: #15803d; line-height: 1.5;">
      Si ce n'est pas déjà fait, nous vous conseillons de <strong>créer un compte gratuit</strong> sur Profilo'Z avec votre adresse e-mail. 
      Cela vous permettra de sauvegarder votre travail en toute sécurité, de retrouver votre historique et de modifier vos documents à tout moment depuis n'importe quel appareil.
    </p>
  </div>
  
  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
  
  <h3 style="color: #0f172a; margin-top: 0;">🎁 Il vous reste des documents disponibles !</h3>
  <p>N'oubliez pas que votre formule comprend un <strong>Duo Complet (1 CV + 1 Lettre de motivation)</strong>.</p>
  <p>Vous pouvez à tout moment créer votre lettre de motivation (ou un second CV si vous préférez l'échanger) depuis votre espace personnel :</p>
  
  <div style="text-align: center; margin: 25px 0;">
    <a href="{{dashboardUrl}}" style="background-color: #0d9488; color: white; padding: 10px 20px; text-decoration: none; font-weight: 500; border-radius: 6px; display: inline-block;">Accéder à mon espace client</a>
  </div>
  
  <p>Merci pour votre confiance,<br />L'équipe Profilo'Z</p>
</div>
    `,
    bodyText: 'Votre {{documentType}} est prêt ! 🚀\n\nBonjour {{firstName}},\n\nVous venez de générer votre {{documentType}} sur Profilo\'Z. Vous pouvez le télécharger via ce lien : {{downloadUrl}}\n\nCe lien expire dans 24 heures.\n\n💾 Conservez vos documents à vie : Pensez à créer un compte gratuit sur Profilo\'Z pour retrouver tout votre historique, modifier vos documents et les sauvegarder à vie.\n\nAccédez à votre espace client pour gérer vos documents : {{dashboardUrl}}',
  },
}

export async function sendEmailTemplate(
  slug: string,
  to: string,
  variables: Record<string, string> = {},
) {
  const template = await prisma.emailTemplate.findUnique({ where: { slug } })
  
  let subject: string
  let bodyHtml: string
  let bodyText: string | undefined

  if (!template) {
    const fallback = FALLBACK_TEMPLATES[slug]
    if (!fallback) {
      return { sent: false, reason: 'template_unavailable' as const }
    }
    subject = fallback.subject
    bodyHtml = fallback.bodyHtml
    bodyText = fallback.bodyText
  } else {
    if (!template.isActive) {
      return { sent: false, reason: 'template_unavailable' as const }
    }
    subject = template.subject
    bodyHtml = template.bodyHtml
    bodyText = template.bodyText ?? undefined
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
    subject: interpolate(subject, variables),
    html: interpolate(bodyHtml, variables),
    text: bodyText ? interpolate(bodyText, variables) : undefined,
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
