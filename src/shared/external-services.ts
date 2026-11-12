import WMSLayer from 'esri/layers/WMSLayer'
import WMTSLayer from 'esri/layers/WMTSLayer'
import { configureWmsSelection } from './wms-selection'
import type SpatialReference from 'esri/geometry/SpatialReference'
import type { IExternalLayer } from '../config'
import { isValidServiceUrl, isValidExternalLayer } from './external-config'

export interface IServiceLayerOption {
  id: string
  title: string
  matrices: { id: string; wkid?: number }[]
}

export async function readServiceLayers(entry: IExternalLayer): Promise<IServiceLayerOption[]> {
  if (!isValidServiceUrl(entry.url)) throw new Error('invalidService')
  const layer = entry.type === 'WMS' ? new WMSLayer({ url: entry.url })
    : new WMTSLayer({ url: entry.url, serviceMode: entry.serviceMode })
  try {
    await layer.load()
    if (layer.type === 'wms') {
      return (layer as WMSLayer).allSublayers.toArray().filter((item) => Boolean(item.name))
        .map((item) => ({ id: item.name, title: item.title || item.name, matrices: [] }))
    }
    return (layer as WMTSLayer).sublayers?.toArray().map((item) => ({
      id: item.id, title: item.title || item.id,
      matrices: item.tileMatrixSets?.toArray().map((matrix) => ({ id: matrix.id, wkid: matrix.tileInfo?.spatialReference?.wkid ?? undefined })) ?? []
    })) ?? []
  } finally { layer.destroy() }
}

export async function createExternalLayer(entry: IExternalLayer, id: string, spatialReference: SpatialReference): Promise<WMSLayer | WMTSLayer> {
  if (!isValidExternalLayer(entry)) throw new Error('invalidService')
  const layer = entry.type === 'WMS' ? new WMSLayer({ id, url: entry.url, visible: false })
    : new WMTSLayer({ id, url: entry.url, serviceMode: entry.serviceMode, visible: false })
  let loaded = false
  try {
    await layer.load()
    loaded = true
    if (layer.type === 'wms') {
      const wms = layer as WMSLayer
      configureWmsSelection(wms, entry.layerId, spatialReference)
    } else {
      const wmts = layer as WMTSLayer
      const selected = wmts.sublayers?.find((item) => item.id === entry.layerId)?.clone()
      const matrix = selected?.tileMatrixSets?.find((item) => item.id === entry.tileMatrixSetId)
      if (!selected || !matrix) throw new Error('invalidService')
      if (!matrix.tileInfo?.spatialReference?.equals(spatialReference)) throw new Error('serviceProjection')
      selected.tileMatrixSetId = matrix.id
      wmts.activeLayer = selected
    }
    layer.title = entry.title
    layer.listMode = 'show'
    return layer
  } catch (error: unknown) {
    layer.destroy()
    if (error instanceof Error && ['invalidService', 'serviceProjection'].includes(error.message)) throw error
    throw new Error(loaded ? 'externalPrepareError' : 'externalLoadError')
  }
}
