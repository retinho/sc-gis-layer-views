import { DataSourceManager, DataSourceTypes, getAppStore } from 'jimu-core'
import type { JimuMapView } from 'jimu-arcgis'
import WebMap from 'esri/WebMap'
import esriConfig from 'esri/config'
import { collectVisibility, snapshotVisibility } from './layer-visibility'

import { loadOperationalLayers } from '../shared/layer-loading'
import { ExternalSession } from './external-session'
import { createExternalLayer } from '../shared/external-services'

import { ThemeController } from './theme-controller-state'
import type { IPreparedMap } from './theme-controller-state'
export type { IControllerState } from './theme-controller-state'

async function prepareMap(view: JimuMapView, widgetId: string): Promise<IPreparedMap> {
  let saved: WebMap | undefined
  try {
    await view.view.when()
    const state = getAppStore().getState()
    const appConfig = state.appStateInBuilder?.appConfig ?? state.appConfig
    const metadata = DataSourceManager.getInstance().getDataSource(view.dataSourceId)?.getDataSourceJson()
      ?? appConfig?.dataSources?.[view.dataSourceId]
    if (metadata?.type !== DataSourceTypes.WebMap || !metadata.itemId) throw new Error('No WebMap data source')
    saved = new WebMap({ portalItem: { id: metadata.itemId, portal: { url: metadata.portalUrl || esriConfig.portalUrl } } })
    await saved.load()
    const map = view.view.map
    if (!map) throw new Error('No active map')
    const [savedFailures, liveFailures] = await Promise.all([
      loadOperationalLayers(saved.layers.toArray()), loadOperationalLayers(map.layers.toArray())
    ])
    const item = saved.portalItem
    if (!item?.id) throw new Error('No WebMap item')
    const key = JSON.stringify([(item.portal?.url ?? esriConfig.portalUrl).replace(/\/$/, ''), item.id])
    const defaults = snapshotVisibility(collectVisibility(saved.layers.toArray()))

    if (view.view.destroyed) throw new Error('Map destroyed')
    const session = new ExternalSession(map, widgetId, (entry, id) => createExternalLayer(entry, id, view.view.spatialReference))
    return { view, map, key, defaults, session, unavailable: [...new Set([...savedFailures, ...liveFailures])], partial: savedFailures.length > 0 || liveFailures.length > 0 }
  } finally { saved?.destroy() }
}
// Extension and widget entry bundles share ownership even if their modules are emitted separately.
const registryKey = Symbol.for('sc-gis-layer-views.controllers')
const shared = globalThis as typeof globalThis & { [registryKey]?: WeakMap<object, Map<string, ThemeController>> }
const registries = shared[registryKey] ?? (shared[registryKey] = new WeakMap())
const store = getAppStore()
const controllers = registries.get(store) ?? new Map<string, ThemeController>()
registries.set(store, controllers)
export function getThemeController(widgetId: string): ThemeController {
  let controller = controllers.get(widgetId)
  if (!controller) { controller = new ThemeController(widgetId, prepareMap); controllers.set(widgetId, controller) }
  return controller
}
