/** Portable view format. Keep this module independent of React and the ArcGIS SDK. */
export interface ILayerVisibility { id: string; visible: boolean }
export interface IWmsSublayer { name: string; visible: boolean; sublayers: IWmsSublayer[] }
export interface IWmtsSelection { id: string; styleId?: string; tileMatrixSetId?: string; imageFormat?: string }
interface IServiceBase { id?: string; url: string; title: string; opacity: number; visible: boolean }
export interface IWmsService extends IServiceBase { type: 'WMS'; sublayers: IWmsSublayer[] }
export interface IWmtsService extends IServiceBase { type: 'WMTS'; activeLayer?: IWmtsSelection; serviceMode?: 'RESTful' | 'KVP' }
export type IService = IWmsService | IWmtsService
export interface IViewState { version: 2; internal: ILayerVisibility[]; external: IService[] }
export const VIEW_PARAMETER = 'view_state'
const MAX_LENGTH = 200000
const MAX_ITEMS = 500

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Invalid object')
  return value as Record<string, unknown>
}
function string(value: unknown): string {
  if (typeof value !== 'string' || value.length > 8192) throw new Error('Invalid string')
  return value
}
function boolean(value: unknown, fallback?: boolean): boolean {
  if (value === undefined && fallback !== undefined) return fallback
  if (typeof value !== 'boolean') throw new Error('Invalid boolean')
  return value
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value) || value.length > MAX_ITEMS) throw new Error('Invalid array')
  return value
}
function optionalString(value: unknown): string | undefined {
  return value === undefined ? undefined : string(value)
}
function sublayer(value: unknown, depth: number): IWmsSublayer {
  if (depth > 10) throw new Error('Sublayer hierarchy too deep')
  const item = record(value)
  return { name: string(item.name), visible: boolean(item.visible, true),
    sublayers: array(item.sublayers ?? []).map((child: unknown): IWmsSublayer => sublayer(child, depth + 1)) }
}
function service(value: unknown, legacy: boolean): IService {
  const item = record(value)
  const url = string(item.url)
  const parsed = new URL(url)
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('Invalid service URL')
  const opacity = item.opacity ?? 1
  if (typeof opacity !== 'number' || !Number.isFinite(opacity) || opacity < 0 || opacity > 1) throw new Error('Invalid opacity')
  const base: IServiceBase = { id: optionalString(item.id), url, title: string(item.title ?? ''), opacity,
    visible: boolean(item.visible, legacy ? true : undefined) }
  if (item.type === 'WMS') return { ...base, type: 'WMS', sublayers: array(item.sublayers ?? []).map((child: unknown): IWmsSublayer => sublayer(child, 0)) }
  if (item.type !== 'WMTS') throw new Error('Unsupported service type')
  let activeLayer: IWmtsSelection | undefined
  if (item.activeLayer !== undefined) {
    const active = record(item.activeLayer)
    activeLayer = { id: string(active.id), styleId: optionalString(active.styleId),
      tileMatrixSetId: optionalString(active.tileMatrixSetId), imageFormat: optionalString(active.imageFormat) }
  }
  const mode = item.serviceMode
  if (mode !== undefined && mode !== 'RESTful' && mode !== 'KVP') throw new Error('Invalid service mode')
  return { ...base, type: 'WMTS', activeLayer, serviceMode: mode }
}
export function validateViewState(value: unknown): IViewState {
  const state = record(value)
  if (state.version !== undefined && state.version !== 2) throw new Error('Unsupported view version')
  const internal = array(state.internal).map((entry: unknown): ILayerVisibility => {
    const item = record(entry)
    return { id: string(item.id), visible: boolean(item.visible) }
  })
  const external = array(state.external).map((entry: unknown): IService => service(entry, state.version === undefined))
  if (new Set(internal.map((item: ILayerVisibility): string => item.id)).size !== internal.length) throw new Error('Duplicate layer ID')
  const ids = external.flatMap((item: IService): string[] => item.id === undefined ? [] : [item.id])
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate service ID')
  return { version: 2, internal, external }
}
export function extractViewData(input: string): string {
  const trimmed = input.trim()
  if (trimmed.length > MAX_LENGTH) throw new Error('View data too large')
  if (/^https?:\/\//i.test(trimmed)) {
    const data = new URL(trimmed).searchParams.get(VIEW_PARAMETER)
    if (!data) throw new Error('Missing view data')
    return data
  }
  return trimmed
}
export function decodeViewState(input: string): IViewState {
  // URLSearchParams converts unescaped '+' in historical links to spaces.
  const encoded = extractViewData(input).replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/')
  if (!encoded || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) throw new Error('Invalid encoding')
  const binary = atob(encoded)
  const bytes = Uint8Array.from(binary, (character: string): number => character.charCodeAt(0))
  let json: string
  try { json = new TextDecoder('utf-8', { fatal: true }).decode(bytes) } catch { json = binary }
  const value: unknown = JSON.parse(json)
  return validateViewState(value)
}
export function encodeViewState(state: IViewState): string {
  const bytes = new TextEncoder().encode(JSON.stringify(validateViewState(state)))
  let binary = ''
  bytes.forEach((byte: number): void => { binary += String.fromCharCode(byte) })
  const result = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  if (result.length > MAX_LENGTH) throw new Error('View data too large')
  return result
}
export function createViewUrl(currentUrl: string, state: IViewState): string {
  const url = new URL(currentUrl)
  url.searchParams.set(VIEW_PARAMETER, encodeViewState(state))
  return url.toString()
}
