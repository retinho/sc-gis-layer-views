import type { JimuMapView } from 'jimu-arcgis'
import type ArcGISMap from 'esri/Map'
import type { ILayerTheme } from '../config'
import type { ExternalSession } from './external-session'
import type { TVisibilitySnapshot } from './layer-visibility'
import { assertThemeAvailable } from '../shared/layer-loading'

export type TMessage = 'invalidThemeLink' | 'urlThemeMissing' | 'waitingUrlMap' |  'layerUnavailable' | 'externalPrepareError' | 'externalApplyError' | 'loadingServices' | 'invalidService' | 'serviceProjection' | 'externalTarget' | 'externalLoadError' | 'loadingMap' | 'mapLoadError' | 'wrongMap' | 'missingLayers' | 'unconfiguredTheme' | 'applyError' | 'themeApplied' | 'resetApplied' | null
export interface IPreparedMap {
  view: JimuMapView
  map: ArcGISMap
  key: string
  session: ExternalSession
  unavailable: string[]
  partial: boolean
  defaults: TVisibilitySnapshot
}
export interface IControllerState { ready: boolean; partial: boolean; message: TMessage }
export class ThemeController {
  private view?: JimuMapView
  private prepared?: IPreparedMap
  private revision = 0
  private busy = false
  private startupDone = false
  private listeners = new Set<() => void>()
  private state: IControllerState = { ready: false, partial: false, message: null }
  private widgetId: string
  private prepareMap: (view: JimuMapView, widgetId: string) => Promise<IPreparedMap>
  constructor(widgetId: string, prepareMap: (view: JimuMapView, widgetId: string) => Promise<IPreparedMap>) {
    this.widgetId = widgetId; this.prepareMap = prepareMap
  }
  getSnapshot = (): IControllerState => this.state
  subscribe = (listener: () => void): (() => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private update(message: TMessage): void {
    this.state = { ready: Boolean(this.prepared && !this.busy), partial: Boolean(this.prepared?.partial), message }
    this.listeners.forEach((listener) => listener())
  }
  setView(view: JimuMapView): void {
    if (this.view === view) return
    this.prepared?.session.dispose()
    this.prepared = undefined
    this.view = view
    this.busy = false
    const revision = ++this.revision
    this.update('loadingMap')
    // Tie cleanup to the map lifetime, not whether a controller panel is open.
    view.view.addHandles({ remove: () => {
      if (this.view !== view) return
      this.revision += 1; this.prepared?.session.dispose(); this.prepared = undefined; this.view = undefined; this.busy = false; this.update(null)
    } })
    void this.prepare(view, revision)
  }
  private async prepare(view: JimuMapView, revision: number): Promise<void> {
    try {
      const prepared = await this.prepareMap(view, this.widgetId)
      if (revision !== this.revision || view.view.destroyed) { prepared.session.dispose(); return }
      this.prepared = prepared
      this.update(null)
    } catch { if (revision === this.revision) this.update('mapLoadError') }
  }
  retry = (): void => {
    const view = this.view
    if (!view || this.busy) return
    this.prepared?.session.dispose(); this.prepared = undefined; this.view = undefined
    this.setView(view)
  }
  private async run(theme?: ILayerTheme): Promise<void> {
    const prepared = this.prepared
    if (!prepared || this.busy || prepared.map !== this.view?.view.map) return
    this.startupDone = true
    if (theme && !theme.webMapKey) { this.update('unconfiguredTheme'); return }
    if (theme && theme.webMapKey !== prepared.key) { this.update('wrongMap'); return }
    if (theme) {
      try { assertThemeAvailable([...(theme.selectedLayerKeys ?? []), ...(theme.externalLayers ?? []).flatMap((entry) => [entry.groupKey, entry.beforeLayerKey].filter((key): key is string => Boolean(key)))], prepared.unavailable) }
      catch { this.update('layerUnavailable'); return }
    }
    this.busy = true
    this.update(theme?.externalLayers?.length ? 'loadingServices' : null)
    try {
      const applied = await prepared.session.apply(theme, prepared.defaults)
      if (this.prepared === prepared && applied) this.update(theme ? 'themeApplied' : 'resetApplied')
    } catch (error: unknown) {
      if (this.prepared !== prepared) return
      const reason = error instanceof Error ? error.message : ''
      const known = ['missingLayers', 'invalidService', 'serviceProjection', 'externalTarget', 'externalPrepareError', 'externalLoadError'] as const
      this.update(known.find((key) => key === reason) ?? (theme?.externalLayers?.length ? 'externalApplyError' : 'applyError'))
    } finally { if (this.prepared === prepared) { this.busy = false; this.update(this.state.message) } }
  }
  apply = (theme: ILayerTheme): void => { void this.run(theme) }
  reset = (): void => { void this.run() }
  start(theme: ILayerTheme | undefined): void {
    if (this.startupDone) return
    if (!theme) { this.startupDone = true; this.update('urlThemeMissing'); return }
    if (!this.state.ready) return
    this.startupDone = true
    this.apply(theme)
  }
  hasStarted(): boolean { return this.startupDone }
  waitingForMap(): void { if (!this.startupDone && !this.prepared) this.update('waitingUrlMap') }
  invalidLink(): void { if (!this.startupDone) { this.startupDone = true; this.update('invalidThemeLink') } }
}
