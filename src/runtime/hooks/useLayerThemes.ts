import { React, DataSourceManager, DataSourceTypes, getAppStore } from 'jimu-core'
import type { JimuMapView } from 'jimu-arcgis'
import WebMap from 'esri/WebMap'
import esriConfig from 'esri/config'
import type ArcGISMap from 'esri/Map'
import type { ILayerTheme } from '../../config'
import { collectVisibility, snapshotVisibility, themeVisibility, applyVisibility, loadOperationalLayers } from '../layer-visibility'
import type { TVisibilitySnapshot } from '../layer-visibility'

type TMessage = 'loadingMap' | 'mapLoadError' | 'wrongMap' | 'missingLayers' | 'unconfiguredTheme' | 'applyError' | 'themeApplied' | 'resetApplied' | null
interface IPreparedMap {
  view: JimuMapView
  map: ArcGISMap
  key: string
  defaults: TVisibilitySnapshot
}
interface ILayerThemes {
  ready: boolean
  message: TMessage
  apply: (theme: ILayerTheme) => void
  reset: () => void
  retry: () => void
}

export function useLayerThemes(view: JimuMapView | undefined): ILayerThemes {
  const [prepared, setPrepared] = React.useState<IPreparedMap>()
  const [message, setMessage] = React.useState<TMessage>(null)
  const [revision, setRevision] = React.useState(0)
  React.useEffect(() => {
    setPrepared(undefined)
    setMessage(view ? 'loadingMap' : null)
    if (!view) return
    let cancelled = false
    let saved: WebMap | undefined
    const load = async (): Promise<void> => {
      try {
        await view.view.when()
        const state = getAppStore().getState()
        const appConfig = state.appStateInBuilder?.appConfig ?? state.appConfig
        const metadata = DataSourceManager.getInstance().getDataSource(view.dataSourceId)?.getDataSourceJson()
          ?? appConfig?.dataSources?.[view.dataSourceId]
        if (metadata?.type !== DataSourceTypes.WebMap || !metadata.itemId) throw new Error('No WebMap data source')
        saved = new WebMap({ portalItem: { id: metadata.itemId, portal: { url: metadata.portalUrl || esriConfig.portalUrl } } })
        await saved.loadAll()
        const map = view.view.map
        if (!map) throw new Error('No active map')
        await loadOperationalLayers(map.layers.toArray())
        const item = saved.portalItem
        if (!item?.id) throw new Error('No WebMap item')
        const key = JSON.stringify([(item.portal?.url ?? esriConfig.portalUrl).replace(/\/$/, ''), item.id])
        const defaults = snapshotVisibility(collectVisibility(saved.layers.toArray()))
        if (!cancelled) { setPrepared({ view, map, key, defaults }); setMessage(null) }
      } catch {
        if (!cancelled) setMessage('mapLoadError')
      } finally { saved?.destroy() }
    }
    void load()
    return (): void => { cancelled = true }
  }, [view, revision])
  const ready = Boolean(view && prepared?.view === view)
  const run = (theme?: ILayerTheme): void => {
    if (!view || !prepared || prepared.view !== view || prepared.map !== view.view.map) return
    if (theme && !theme.webMapKey) { setMessage('unconfiguredTheme'); return }
    if (theme && theme.webMapKey !== prepared.key) { setMessage('wrongMap'); return }
    try {
      const nodes = collectVisibility(prepared.map.layers.toArray())
      const plan = theme ? themeVisibility(nodes, theme.selectedLayerKeys ?? []) : prepared.defaults
      applyVisibility(nodes, plan)
      setMessage(theme ? 'themeApplied' : 'resetApplied')
    } catch (error: unknown) {
      setMessage(error instanceof Error && error.message === 'missingLayers' ? 'missingLayers' : 'applyError')
    }
  }
  return { ready, message, apply: (theme): void => run(theme), reset: (): void => run(), retry: (): void => setRevision((value) => value + 1) }
}
