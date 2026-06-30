export interface AdminNavItem {
  to: string
  label: string
  icon: string
  exact?: boolean
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { to: '/admin', label: 'Tableau de bord', icon: 'dashboard', exact: true },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: 'group' },
  { to: '/admin/cv', label: 'CV', icon: 'description' },
  { to: '/admin/lettres', label: 'Lettres de motivation', icon: 'mail' },
  { to: '/admin/pdf', label: 'Documents PDF', icon: 'picture_as_pdf' },
  { to: '/admin/paiements', label: 'Paiements', icon: 'payments' },
  { to: '/admin/analytics', label: 'Analytics', icon: 'monitoring' },
  { to: '/admin/ocr', label: 'OCR & IA', icon: 'document_scanner' },
  { to: '/admin/templates', label: 'Templates', icon: 'view_quilt' },
  { to: '/admin/offres', label: 'Offres & Packs', icon: 'sell' },
  { to: '/admin/organisations', label: 'Organisations', icon: 'domain' },
  { to: '/admin/emails', label: 'Emails', icon: 'forward_to_inbox' },
  { to: '/admin/notifications', label: 'Notifications', icon: 'notifications' },
  { to: '/admin/journaux', label: 'Journaux', icon: 'receipt_long' },
  { to: '/admin/parametres', label: 'Paramètres', icon: 'settings' },
  { to: '/admin/profil', label: 'Mon profil', icon: 'account_circle' },
]
