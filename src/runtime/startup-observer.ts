import type { JimuMapView } from 'jimu-arcgis'
import type { ILayerTheme } from '../config'
import type { ThemeController } from './theme-controller-state'

export function observeStartup(controller: ThemeController, theme: ILayerTheme | undefined, findView: () => JimuMapView | undefined, subscribe: (listener: () => void) => () => void, timeoutMs = 120000): () => void {
  if (controller.hasStarted()) return () => {}
  let stopped = false
  let unsubscribeStore = (): void => {}
  let unsubscribeController = (): void => {}
  let timeout: ReturnType<typeof setTimeout> | undefined
  let timer: ReturnType<typeof setInterval> | undefined
  const stop = (): void => {
    if (stopped) return
    stopped = true; unsubscribeStore(); unsubscribeController()
    if (timer) clearInterval(timer)
    if (timeout) clearTimeout(timeout)
    window.removeEventListener('pagehide', stop)
  }
  const check = (): void => {
    if (stopped) return
    if (controller.hasStarted()) { stop(); return }
    const view = findView()
    if (!view) return
    controller.setView(view)
    if (controller.getSnapshot().ready) controller.start(theme)
    if (controller.hasStarted()) stop()
  }
  unsubscribeStore = subscribe(check)
  unsubscribeController = controller.subscribe(check)
  // Creation of the Jimu wrapper can follow the Redux notification in the same turn.
  timer = setInterval(check, 250)
  timeout = setTimeout(() => { stop(); controller.waitingForMap() }, timeoutMs)
  window.addEventListener('pagehide', stop, { once: true })
  check()
  return stop
}
