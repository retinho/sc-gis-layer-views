import { React, ReactRedux, DataSourceTypes } from 'jimu-core'
import type { IMState } from 'jimu-core'
import { resolveConfiguredWebMaps } from '../configured-webmaps'
import type { IConfiguredWebMap } from '../configured-webmaps'

// Settings read the Builder configuration, not a live MapView instance.
export function useConfiguredWebMaps(mapWidgetId: string | undefined): IConfiguredWebMap[] {
  const appConfig = ReactRedux.useSelector((state: IMState) => state.appStateInBuilder?.appConfig ?? state.appConfig)
  const references = mapWidgetId ? appConfig?.widgets?.[mapWidgetId]?.useDataSources : undefined
  const dataSources = appConfig?.dataSources
  return React.useMemo(() => resolveConfiguredWebMaps(references, dataSources, DataSourceTypes.WebMap), [references, dataSources])
}
