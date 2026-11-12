import { getAppStore } from 'jimu-core'
import { MapViewManager } from 'jimu-arcgis'
import type { ILayerTheme } from '../config'
import { getThemeController } from './theme-controller'
import { observeStartup } from './startup-observer'

// AppConfigProcessor runs before panels mount. Observe the existing map; never open another panel.
export function startUrlTheme(widgetId: string, mapWidgetId: string, theme: ILayerTheme | undefined): void {
  const store = getAppStore()
  observeStartup(getThemeController(widgetId), theme, () => {
    const ids = Object.keys(store.getState().jimuMapViewsInfo ?? {})
    const manager = MapViewManager.getInstance()
    return ids.map((id) => manager.getJimuMapViewById(id)).find((candidate) => candidate?.mapWidgetId === mapWidgetId && candidate.isActive && !candidate.view.destroyed)
  }, (listener) => store.subscribe(listener))
}
