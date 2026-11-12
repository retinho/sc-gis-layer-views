import { React } from 'jimu-core'
import type { JimuMapView } from 'jimu-arcgis'
import type { ILayerTheme } from '../../config'
import type { IControllerState } from '../theme-controller'
import { getThemeController } from '../theme-controller'

export function useLayerThemes(view: JimuMapView | undefined, widgetId: string): IControllerState & { apply: (theme: ILayerTheme) => void; reset: () => void; retry: () => void } {
  const controller = React.useMemo(() => getThemeController(widgetId), [widgetId])
  const state = React.useSyncExternalStore(controller.subscribe, controller.getSnapshot)
  React.useEffect(() => { if (view) controller.setView(view) }, [controller, view])
  return { ...state, ready: Boolean(state.ready && view), apply: controller.apply, reset: controller.reset, retry: controller.retry }
}
