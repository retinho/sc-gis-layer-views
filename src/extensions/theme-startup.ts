import type { extensionSpec, AppConfig } from 'jimu-core'
import { loadArcGISJSAPIModules } from 'jimu-arcgis'
import { bootThemeStartup } from './boot-theme-startup'
import type { IConfig } from '../config'
import { readThemeRequest, findThemeOwners } from '../shared/theme-link'

export default class ThemeStartup implements extensionSpec.AppConfigProcessorExtension {
  id = 'sc-layer-theme-startup'
  widgetId = ''
  async process(appConfig: AppConfig): Promise<AppConfig> {
    if (window.jimuConfig.isInBuilder) return appConfig
    let request: ReturnType<typeof readThemeRequest>
    try { request = readThemeRequest(window.location.href) } catch { return appConfig }
    if (!request) return appConfig
    const owners = findThemeOwners(request, appConfig.widgets)
    if (owners.length !== 1 || owners[0] !== this.widgetId) return appConfig
    const widget = appConfig.widgets[this.widgetId]
    const mapWidgetId = widget?.useMapWidgetIds?.[0]
    if (!mapWidgetId) return appConfig
    const theme = (widget.config as IConfig)?.themes?.find((entry) => entry.id === request.themeId)
    // Do not hold app configuration processing until the SDK or map is ready.
    // The extension runs before widget dependencies have necessarily loaded.
    void bootThemeStartup(
      () => loadArcGISJSAPIModules(['esri/WebMap']),
      // Bundle locally, but execute only after the SDK loader has resolved.
      // Portal-hosted extensions otherwise resolve lazy chunks against the Portal CDN.
      () => import(/* webpackMode: "eager" */ '../runtime/url-startup'),
      (runtime) => runtime.startUrlTheme(this.widgetId, mapWidgetId, theme)
    ).catch((error: unknown) => {
      console.error('[sc-gis-layer-views] URL theme background startup failed', error)
    })
    return appConfig
  }
}
