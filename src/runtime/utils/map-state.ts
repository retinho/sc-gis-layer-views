import Collection from 'esri/core/Collection'
import GroupLayer from 'esri/layers/GroupLayer'
import WMSLayer from 'esri/layers/WMSLayer'
import WMTSLayer from 'esri/layers/WMTSLayer'
import WMSSublayer from 'esri/layers/support/WMSSublayer'
import WMTSSublayer from 'esri/layers/support/WMTSSublayer'
import { type IService, type IViewState, type IWmsSublayer } from './view-state'

type OgcLayer = WMSLayer | WMTSLayer
const MANAGED_PREFIX = 'sc_ext_'
function operationalLayers(map: __esri.Map): __esri.Layer[] {
  const visit = (layer: __esri.Layer): __esri.Layer[] => layer instanceof GroupLayer
    ? [layer, ...layer.layers.toArray().flatMap(visit)] : [layer]
  return map.layers.toArray().flatMap(visit)
}
function isOgc(layer: __esri.Layer): layer is OgcLayer {
  return layer instanceof WMSLayer || layer instanceof WMTSLayer
}
function captureSublayer(layer: __esri.WMSSublayer): IWmsSublayer {
  return { name: layer.name, visible: layer.visible,
    sublayers: layer.sublayers?.toArray().map(captureSublayer) ?? [] }
}
function captureService(layer: OgcLayer): IService {
  const base = { id: layer.id, url: layer.url, title: layer.title ?? '', opacity: layer.opacity, visible: layer.visible }
  if (layer instanceof WMSLayer) return { ...base, type: 'WMS', sublayers: layer.sublayers.toArray().map(captureSublayer) }
  const active = layer.activeLayer
  return { ...base, type: 'WMTS', serviceMode: layer.serviceMode,
    activeLayer: active ? { id: active.id, styleId: active.styleId, tileMatrixSetId: active.tileMatrixSetId, imageFormat: active.imageFormat } : undefined }
}
export async function captureMapState(map: __esri.Map): Promise<IViewState> {
  const layers = operationalLayers(map)
  const services = layers.filter(isOgc)
  await Promise.all(services.map((layer: OgcLayer): Promise<OgcLayer> => layer.load()))
  return { version: 2,
    internal: layers.filter((layer: __esri.Layer): boolean => !layer.id.startsWith(MANAGED_PREFIX))
      .map((layer: __esri.Layer): { id: string; visible: boolean } => ({ id: layer.id, visible: layer.visible })),
    external: services.map(captureService) }
}
function flattenSublayers(layers: __esri.WMSSublayer[]): __esri.WMSSublayer[] {
  return layers.flatMap((layer: __esri.WMSSublayer): __esri.WMSSublayer[] =>
    [layer, ...flattenSublayers(layer.sublayers?.toArray() ?? [])])
}
function restoreSublayers(states: IWmsSublayer[], available: __esri.WMSSublayer[]): WMSSublayer[] {
  return states.map((state: IWmsSublayer): WMSSublayer => {
    const original = available.find((layer: __esri.WMSSublayer): boolean => layer.name === state.name)
    const layer = original?.clone() ?? new WMSSublayer({ name: state.name })
    layer.visible = state.visible
    // Preserve loaded service metadata and, for legacy links, the existing child hierarchy.
    if (state.sublayers.length) layer.sublayers = new Collection(restoreSublayers(state.sublayers, available))
    return layer
  })
}
function configure(layer: OgcLayer, state: IService): void {
  layer.title = state.title
  layer.opacity = state.opacity
  layer.visible = state.visible
  if (layer instanceof WMSLayer && state.type === 'WMS') {
    layer.sublayers = new Collection(restoreSublayers(state.sublayers, flattenSublayers(layer.sublayers.toArray())))
  } else if (layer instanceof WMTSLayer && state.type === 'WMTS') {
    if (state.serviceMode) layer.serviceMode = state.serviceMode
    if (state.activeLayer) layer.activeLayer = new WMTSSublayer(state.activeLayer)
  }
}
function sameService(layer: OgcLayer, state: IService): boolean {
  if (layer.type.toUpperCase() !== state.type) return false
  try { return new URL(layer.url).href === new URL(state.url).href } catch { return false }
}
interface IPreparedLayer { layer: OgcLayer; state: IService; created: boolean }

/** Load all new services before changing the map; cancelled requests never commit. */
export async function applyMapState(map: __esri.Map, state: IViewState, isCurrent: () => boolean): Promise<boolean> {
  const existing = operationalLayers(map).filter(isOgc)
  const used = new Set<OgcLayer>()
  const prepared: IPreparedLayer[] = []
  try {
    for (const service of state.external) {
      // New links match by stable ID. Old links did not contain IDs; match each URL once.
      const match = existing.find((layer: OgcLayer): boolean => !used.has(layer) && sameService(layer, service) &&
        (service.id === undefined || layer.id === service.id))
      if (match) {
        used.add(match)
        prepared.push({ layer: match, state: service, created: false })
        continue
      }
      const id = service.id?.startsWith(MANAGED_PREFIX) && !map.findLayerById(service.id)
        ? service.id : `${MANAGED_PREFIX}${crypto.randomUUID()}`
      const layer: OgcLayer = service.type === 'WMS'
        ? new WMSLayer({ url: service.url, id })
        : new WMTSLayer({ url: service.url, id, serviceMode: service.serviceMode,
          activeLayer: service.activeLayer ? new WMTSSublayer(service.activeLayer) : undefined })
      prepared.push({ layer, state: service, created: true })
    }
    const results = await Promise.allSettled(prepared.map(async (item: IPreparedLayer): Promise<void> => {
      await item.layer.load()
      if (item.layer instanceof WMTSLayer && item.state.type === 'WMTS' && item.state.activeLayer) {
        const selection = item.state.activeLayer
        const available = item.layer.sublayers?.find((sublayer: __esri.WMTSSublayer): boolean => sublayer.id === selection.id)
        if (!available) throw new Error('WMTS layer unavailable')
        if (selection.styleId && !available.styles?.some((style: __esri.WMTSStyle): boolean => style.id === selection.styleId)) {
          throw new Error('WMTS style unavailable')
        }
        if (selection.tileMatrixSetId && !available.tileMatrixSets?.some((matrix: __esri.TileMatrixSet): boolean => matrix.id === selection.tileMatrixSetId)) {
          throw new Error('WMTS tile matrix unavailable')
        }
      }
    }))
    if (!isCurrent()) return false
    const failure = results.find((result: PromiseSettledResult<void>): boolean => result.status === 'rejected')
    if (failure?.status === 'rejected') throw new Error('Service could not be loaded')
    prepared.forEach((item: IPreparedLayer): void => { configure(item.layer, item.state) })
    const retained = new Set(prepared.map((item: IPreparedLayer): OgcLayer => item.layer))
    const obsolete = map.layers.filter((layer: __esri.Layer): boolean =>
      isOgc(layer) && layer.id.startsWith(MANAGED_PREFIX) && !retained.has(layer)).toArray()
    map.removeMany(obsolete)
    obsolete.forEach((layer: __esri.Layer): void => { layer.destroy() })
    map.addMany(prepared.filter((item: IPreparedLayer): boolean => item.created).map((item: IPreparedLayer): OgcLayer => item.layer))
    const layersById = new Map(operationalLayers(map).map((layer: __esri.Layer): [string, __esri.Layer] => [layer.id, layer]))
    state.internal.forEach((visibility: { id: string; visible: boolean }): void => {
      const layer = layersById.get(visibility.id)
      if (layer) layer.visible = visibility.visible
    })
    return true
  } finally {
    prepared.forEach((item: IPreparedLayer): void => {
      if (item.created && map.findLayerById(item.layer.id) !== item.layer) item.layer.destroy()
    })
  }
}
