import type { extensionSpec, AppConfig } from 'jimu-core'
import type { IConfig } from '../config'
import { readThemeRequest } from '../shared/theme-link'

export default class ThemeStartup implements extensionSpec.AppConfigProcessorExtension {
  id = 'sc-layer-theme-startup'
  widgetId = ''
  async process(appConfig: AppConfig): Promise<AppConfig> {
    if (window.jimuConfig.isInBuilder) return appConfig
    let request: ReturnType<typeof readThemeRequest>
    try { request = readThemeRequest(window.location.href) } catch { return appConfig }
    if (!request || request.widgetId !== this.widgetId) return appConfig
    const widget = appConfig.widgets[this.widgetId]
    const mapWidgetId = widget?.useMapWidgetIds?.[0]
    if (!mapWidgetId) return appConfig
    const theme = (widget.config as IConfig)?.themes?.find((entry) => entry.id === request.themeId)
    // The module is loaded by the framework; no map loading is awaited in config processing.
    try {
      const { startUrlTheme } = await import('../runtime/url-startup')
      startUrlTheme(this.widgetId, mapWidgetId, theme)
    } catch {
      // A failed extension load must not prevent the Experience from opening.
      // The widget retries the URL request when its panel is opened.
    }
    return appConfig
  }
}
