import { React } from 'jimu-core'
import WebMap from 'esri/WebMap'
import esriConfig from 'esri/config'
import type { ILayerNode } from '../layer-selection'
import { loadOperationalLayers } from '../../shared/layer-loading'
import { buildLayerTree } from '../build-layer-tree'
import type { IConfiguredWebMap } from '../configured-webmaps'

type TTreeStatus = 'waiting' | 'loading' | 'ready' | 'error' | 'unsupported'

interface ITreeState {
  source: IConfiguredWebMap | undefined
  status: TTreeStatus
  nodes: ILayerNode[]
  partial: boolean
  webMapKey: string
}

interface IWebMapTree extends ITreeState {
  reload: () => void
}

export function useWebMapTree(source: IConfiguredWebMap | undefined): IWebMapTree {
  const [revision, setRevision] = React.useState(0)
  const [state, setState] = React.useState<ITreeState>({ source: undefined, status: 'waiting', nodes: [], webMapKey: '', partial: false })
  React.useEffect(() => {
    if (!source?.itemId) {
      setState({ source, status: source ? 'unsupported' : 'waiting', nodes: [], webMapKey: '', partial: false })
      return
    }
    let cancelled = false
    // Independent owned WebMap: read the saved structure, never alter the live map.
    const saved = new WebMap({
      portalItem: {
        id: source.itemId,
        portal: { url: source.portalUrl || esriConfig.portalUrl }
      }
    })
    setState({ source, status: 'loading', nodes: [], webMapKey: '', partial: false })
    const load = async (): Promise<void> => {
      try {
        await saved.load()
        const failures = await loadOperationalLayers(saved.layers.toArray())
        const item = saved.portalItem
        if (!item?.id) throw new Error('Missing WebMap item ID')
        const portalUrl = item.portal?.url ?? esriConfig.portalUrl
        const webMapKey = JSON.stringify([portalUrl.replace(/\/$/, ''), item.id])
        const nodes = buildLayerTree(saved.layers.toArray())
        if (!cancelled) setState({ source, status: 'ready', nodes, webMapKey, partial: failures.length > 0 })
      } catch {
        if (!cancelled) setState({ source, status: 'error', nodes: [], webMapKey: '', partial: false })
      }
    }
    void load()
    return (): void => {
      cancelled = true
      saved.destroy()
    }
  }, [source, revision])
  const current: ITreeState = state.source === source ? state : { source, status: source ? 'loading' : 'waiting', nodes: [], webMapKey: '', partial: false }
  return { ...current, reload: (): void => { setRevision((value) => value + 1) } }
}
