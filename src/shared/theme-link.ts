import type { IConfig } from '../config'

export const THEME_PARAMETER = 'thema'
export interface IThemeRequest { themeId: string; widgetId?: string }
const validId = (value: string): boolean => /^[A-Za-z0-9_-]+$/.test(value)
export function readThemeRequest(href: string): IThemeRequest | undefined {
  const params = new URL(href).searchParams
  const values = params.getAll(THEME_PARAMETER)
  if (values.length) {
    if (values.length !== 1 || !validId(values[0])) throw new Error('invalidThemeLink')
    return { themeId: values[0] }
  }
  // Previously shared 0.8.0 links remain usable, without exposing this format in settings.
  const legacy = params.getAll('sc-layer-theme')
  if (!legacy.length) return undefined
  const parts = legacy[0].split(':')
  if (legacy.length !== 1 || parts.length !== 2 || !parts.every(validId)) throw new Error('invalidThemeLink')
  return { widgetId: parts[0], themeId: parts[1] }
}
export function themeParameter(themeId: string): string {
  if (!validId(themeId)) throw new Error('invalidThemeLink')
  return `${THEME_PARAMETER}=${encodeURIComponent(themeId)}`
}
export function findThemeOwners(request: IThemeRequest, widgets: Record<string, { config?: unknown }>): string[] {
  return Object.keys(widgets).filter((id) => {
    if (request.widgetId && request.widgetId !== id) return false
    const config = widgets[id].config as Partial<IConfig> | undefined
    return Array.isArray(config?.themes) && config.themes.some((theme) => theme?.id === request.themeId)
  })
}
