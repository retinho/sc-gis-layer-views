import type { IExternalLayer } from '../config'

export function isValidServiceUrl(value: string): boolean {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password } catch { return false }
}
export function isValidExternalLayer(entry: IExternalLayer): boolean {
  return Boolean(entry.id && (entry.type === 'WMS' || entry.type === 'WMTS') && isValidServiceUrl(entry.url)
    && entry.title.trim() && entry.layerId && (entry.type !== 'WMTS' || entry.tileMatrixSetId)
    && (entry.serviceMode === 'KVP' || entry.serviceMode === 'RESTful'))
}
