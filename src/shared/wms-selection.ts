import type WMSLayer from 'esri/layers/WMSLayer'
import type WMSSublayer from 'esri/layers/support/WMSSublayer'
import type SpatialReference from 'esri/geometry/SpatialReference'

// The caller owns a newly loaded WMSLayer. Reuse its sublayer to retain service metadata
// and avoid SDK 4.32 clone() dereferencing a missing fullExtent.
export function configureWmsSelection(wms: WMSLayer, layerId: string, spatialReference: SpatialReference): void {
  const selected = wms.findSublayerByName(layerId)
  if (!selected) throw new Error('invalidService')
  const supported = selected.spatialReferences ?? wms.spatialReferences
  if (supported?.length && !(typeof spatialReference.wkid === 'number' && supported.includes(spatialReference.wkid)) && !(spatialReference.isWebMercator && supported.some((wkid) => [3857, 102100, 102113].includes(wkid)))) throw new Error('serviceProjection')
  const show = (item: WMSSublayer): void => { item.visible = true; item.sublayers?.forEach(show) }
  show(selected)
  wms.sublayers = [selected]
  wms.spatialReference = spatialReference
}
