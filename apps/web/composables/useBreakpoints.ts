/**
 * Breakpoints Mobile First Profilo'Z :
 * - Mobile  : 320–767 px
 * - Tablette: 768–1279 px
 * - Desktop : ≥1280 px
 */
export function useBreakpoints() {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1279px)')
  const isDesktop = useMediaQuery('(min-width: 1280px)')
  const isMobileOrTablet = useMediaQuery('(max-width: 1279px)')

  return { isMobile, isTablet, isDesktop, isMobileOrTablet }
}
