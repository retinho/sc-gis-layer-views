import type { IExternalLayer } from '../config'

export const SERVICE_DEFAULTS = {
  WMS: { url: 'https://wms.geo.admin.ch/', serviceMode: 'KVP' as const },
  WMTS: { url: 'https://wmts.geo.admin.ch/EPSG/2056/1.0.0/WMTSCapabilities.xml', serviceMode: 'RESTful' as const }
}
export function changeServiceType(entry: IExternalLayer, type: IExternalLayer['type']): IExternalLayer {
  const useDefault = !entry.url.trim() || Object.values(SERVICE_DEFAULTS).some((value) => value.url.replace(/\/$/, '') === entry.url.trim().replace(/\/$/, ''))
  return { ...entry, type, ...(useDefault ? SERVICE_DEFAULTS[type] : {}), layerId: '', tileMatrixSetId: undefined }
}
export function filterServiceLayers<T extends { id: string; title: string }>(options: readonly T[], query: string): T[] {
  const normalize = (value: string): string => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const words = normalize(query).trim().split(/\s+/).filter(Boolean)
  return options.filter((option) => {
    const text = normalize(`${option.title} ${option.id}`)
    return words.every((word) => text.includes(word))
  })
}
