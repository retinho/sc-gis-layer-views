export const THEME_PARAMETER = 'sc-layer-theme'
export interface IThemeRequest { widgetId: string; themeId: string }
export function readThemeRequest(href: string): IThemeRequest | undefined {
  const values = new URL(href).searchParams.getAll(THEME_PARAMETER)
  if (values.length === 0) return undefined
  if (values.length !== 1) throw new Error('invalidThemeLink')
  const parts = values[0].split(':')
  if (parts.length !== 2 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) throw new Error('invalidThemeLink')
  return { widgetId: parts[0], themeId: parts[1] }
}
export function suggestExperienceUrl(href: string): string {
  const url = new URL(href)
  const id = url.searchParams.get('id')
  if (/\/builder\/?$/.test(url.pathname)) url.pathname = url.pathname.replace(/\/builder\/?$/, '/experience/')
  else if (url.pathname === '/' && id) { url.pathname = `/experience/${encodeURIComponent(id)}/`; url.searchParams.delete('id') }
  // Do not copy Builder-only arguments or credentials into shared links.
  for (const key of [...url.searchParams.keys()]) {
    if (!['id', 'locale', 'page', 'views', 'dlg'].includes(key)) url.searchParams.delete(key)
  }
  url.hash = ''
  return url.href
}
export function createThemeLink(base: string, widgetId: string, themeId: string): string {
  const url = new URL(base)
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || /\/builder(?:\/|$)/.test(url.pathname)) throw new Error('invalidThemeLink')
  if (![widgetId, themeId].every((value) => /^[A-Za-z0-9_-]+$/.test(value))) throw new Error('invalidThemeLink')
  url.searchParams.set(THEME_PARAMETER, `${widgetId}:${themeId}`)
  return url.href
}
