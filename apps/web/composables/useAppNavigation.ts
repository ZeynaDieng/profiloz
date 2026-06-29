export interface AppNavItem {
  to: string
  icon: string
  label: string
  match: string
  exact?: boolean
}

export const primaryNavItems: AppNavItem[] = [
  { to: '/tableau-de-bord', icon: 'folder_shared', label: 'Mes dossiers', match: '/tableau-de-bord', exact: true },
  { to: '/tableau-de-bord/documents', icon: 'folder_open', label: 'Documents', match: '/documents' },
]

export const secondaryNavItems: AppNavItem[] = [
  { to: '/tableau-de-bord/lettres', icon: 'mail', label: 'Lettres', match: '/lettres' },
  { to: '/tableau-de-bord/modeles', icon: 'dashboard_customize', label: 'Modèles CV', match: '/modeles', exact: true },
  { to: '/tableau-de-bord/modeles-lettres', icon: 'article', label: 'Modèles lettres', match: '/modeles-lettres' },
  { to: '/tableau-de-bord/parametres', icon: 'settings', label: 'Paramètres', match: '/parametres' },
]

export function useAppNavigation() {
  const route = useRoute()

  function isActive(item: AppNavItem) {
    if (item.exact) {
      return route.path === item.to || route.path === `${item.to}/`
    }
    return route.path.includes(item.match)
  }

  return { primaryNavItems, secondaryNavItems, isActive }
}
