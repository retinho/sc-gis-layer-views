import { React } from 'jimu-core'
import { type JimuMapView } from 'jimu-arcgis'
import { type IViewOptions } from '../utils/view-options'
import { applyMapState, captureMapState } from '../utils/map-state'
import { createViewUrl, decodeViewState, VIEW_PARAMETER } from '../utils/view-state'

export type ViewMessage = 'ready' | 'applied' | 'copied' | 'copyFailed' | 'invalidView' | 'loadFailed' | 'captureFailed'
interface IMapViews {
  busy: boolean
  ready: boolean
  message: ViewMessage
  generatedUrl: string
  apply: (data: string, options?: IViewOptions) => Promise<void>
  capture: () => Promise<void>
}
// A map may be shared by several widget instances. Only the most recent request commits.
const requests = new WeakMap<__esri.Map, symbol>()
export function useMapViews(jmv: JimuMapView | null): IMapViews {
  const [busy, setBusy] = React.useState<boolean>(false)
  const [readyView, setReadyView] = React.useState<JimuMapView | null>(null)
  const ready = jmv !== null && readyView === jmv
  const [message, setMessage] = React.useState<ViewMessage>('ready')
  const [generatedUrl, setGeneratedUrl] = React.useState<string>('')
  const generation = React.useRef<number>(0)
  const operation = React.useRef<number>(0)
  const map = jmv?.view?.map

  const apply = React.useCallback(async (data: string, options?: IViewOptions): Promise<void> => {
    if (!map || !ready) return
    let state: ReturnType<typeof decodeViewState>
    try { state = decodeViewState(data) } catch { setMessage('invalidView'); return }
    const currentGeneration = generation.current
    const currentOperation = ++operation.current
    const token = Symbol()
    requests.set(map, token)
    const mounted = (): boolean => currentGeneration === generation.current && currentOperation === operation.current
    const current = (): boolean => mounted() && requests.get(map) === token
    setBusy(true)
    setMessage('ready')
    try {
      if (await applyMapState(map, state, current, options)) setMessage('applied')
    } catch {
      if (current()) setMessage('loadFailed')
    } finally {
      if (mounted()) setBusy(false)
    }
  }, [map, ready])

  const capture = React.useCallback(async (): Promise<void> => {
    if (!map || !ready) return
    const currentGeneration = generation.current
    const currentOperation = ++operation.current
    const current = (): boolean => currentGeneration === generation.current && currentOperation === operation.current
    setBusy(true)
    setMessage('ready')
    try {
      const state = await captureMapState(map)
      if (!current()) return
      const url = createViewUrl(window.location.href, state)
      setGeneratedUrl(url)
      try {
        await navigator.clipboard.writeText(url)
        if (current()) setMessage('copied')
      } catch {
        if (current()) setMessage('copyFailed')
      }
    } catch {
      if (current()) setMessage('captureFailed')
    } finally {
      if (current()) setBusy(false)
    }
  }, [map, ready])

  React.useEffect((): (() => void) => {
    const currentGeneration = ++generation.current
    setReadyView(null)
    setBusy(false)
    setGeneratedUrl('')
    setMessage('ready')
    if (jmv && map) {
      setBusy(true)
      void jmv.view.when().then((): void => {
        if (generation.current === currentGeneration) { setReadyView(jmv); setBusy(false) }
      }).catch((): void => {
        if (generation.current === currentGeneration) { setMessage('loadFailed'); setBusy(false) }
      })
    }
    return (): void => { generation.current += 1 }
  }, [jmv, map])

  React.useEffect((): void => {
    if (!ready) return
    const data = new URL(window.location.href).searchParams.get(VIEW_PARAMETER)
    if (data) void apply(data)
  }, [ready, apply])
  return { busy, ready, message, generatedUrl, apply, capture }
}
