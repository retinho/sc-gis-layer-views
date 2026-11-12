import { React } from 'jimu-core'
import WebMap from 'esri/WebMap'
import esriConfig from 'esri/config'
import type { ILayerNode } from '../layer-selection'
import { buildLayerTree } from '../build-layer-tree'

type TTreeStatus = 'waiting' | 'loading' | 'ready' | 'error' | 'unsupported'

interface ITreeState {
  source: WebMap | undefined
  status: TTreeStatus
  nodes: ILayerNode[]
  webMapKey: string
}

interface IWebMapTree extends ITreeState {
  reload: () => void
}

export function useWebMapTree(source: WebMap | undefined): IWebMapTree {
  const [revision, setRevision] = React.useState(0)
  const [state, setState] = React.useState<ITreeState>({ source: undefined, status: 'waiting', nodes: [], webMapKey: '' })
  React.useEffect(() => {
    const portalItem = source?.portalItem
    if (!portalItem?.id) {
      setState({ source, status: source ? 'unsupported' : 'waiting', nodes: [], webMapKey: '' })
      return
    }
    let cancelled = false
    // Independent owned WebMap: read the saved structure, never alter the live map.
    const saved = new WebMap({ portalItem: portalItem.clone() })
    setState({ source, status: 'loading', nodes: [], webMapKey: '' })
    const load = async (): Promise<void> => {
      try {
        await saved.loadAll()
        const item = saved.portalItem
        if (!item?.id) throw new Error('Missing WebMap item ID')
        const portalUrl = item.portal?.url ?? esriConfig.portalUrl
        const webMapKey = JSON.stringify([portalUrl.replace(/\/$/, ''), item.id])
        const nodes = buildLayerTree(saved.layers.toArray())
        if (!cancelled) setState({ source, status: 'ready', nodes, webMapKey })
      } catch {
        if (!cancelled) setState({ source, status: 'error', nodes: [], webMapKey: '' })
      }
    }
    void load()
    return (): void => {
      cancelled = true
      saved.destroy()
    }
  }, [source, revision])
  const current: ITreeState = state.source === source ? state : { source, status: source ? 'loading' : 'waiting', nodes: [], webMapKey: '' }
  return { ...current, reload: (): void => { setRevision((value) => value + 1) } }
}
