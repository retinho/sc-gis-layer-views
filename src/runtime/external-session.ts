import type ArcGISMap from 'esri/Map'
import type Layer from 'esri/layers/Layer'
import type GroupLayer from 'esri/layers/GroupLayer'
import type Collection from 'esri/core/Collection'
import type { IExternalLayer, ILayerTheme } from '../config'
import { collectVisibility, snapshotVisibility, themeVisibility, applyVisibility } from './layer-visibility'
import type { IVisibilityNode, TVisibilitySnapshot } from './layer-visibility'
import { isValidExternalLayer } from '../shared/external-config'

interface IPlacement {
  collection: Collection<Layer>
  anchor?: Layer
  ancestors: IVisibilityNode[]
}
interface IOwned {
  layer: Layer
  collection: Collection<Layer>
}
type TFactory = (entry: IExternalLayer, id: string) => Promise<Layer>

export function withoutOwned(nodes: readonly IVisibilityNode[], owned: ReadonlySet<Layer>): IVisibilityNode[] {
  return nodes.filter((node) => !owned.has(node.target as Layer)).map((node) => ({ ...node, children: withoutOwned(node.children, owned) }))
}

export function resolvePlacement(map: ArcGISMap, nodes: readonly IVisibilityNode[], entry: IExternalLayer): IPlacement {
  let siblings = nodes
  let collection = map.layers
  let ancestors: IVisibilityNode[] = []
  if (entry.groupKey) {
    let found: IVisibilityNode | undefined
    const visit = (list: readonly IVisibilityNode[], path: IVisibilityNode[]): void => {
      for (const node of list) {
        if (node.key === entry.groupKey && node.group) { found = node; ancestors = [...path, node]; return }
        visit(node.children, [...path, node])
      }
    }
    visit(nodes, [])
    if (!found?.group) throw new Error('externalTarget')
    collection = (found.target as GroupLayer).layers
    siblings = found.children
  }
  const anchor = entry.beforeLayerKey ? siblings.find((node) => node.key === entry.beforeLayerKey)?.target as Layer | undefined : undefined
  if (entry.beforeLayerKey && !anchor) throw new Error('externalTarget')
  return { collection, anchor, ancestors }
}

export class ExternalSession {
  private owned: IOwned[] = []
  private generation = 0
  private disposed = false
  private readonly map: ArcGISMap
  private readonly widgetId: string
  private readonly factory: TFactory
  constructor(map: ArcGISMap, widgetId: string, factory: TFactory) { this.map = map; this.widgetId = widgetId; this.factory = factory }

  private currentCollection(item: IOwned): Collection<Layer> {
    const find = (collection: Collection<Layer>): Collection<Layer> | undefined => {
      if (collection.indexOf(item.layer) >= 0) return collection
      for (const layer of collection.toArray()) {
        if (layer.type === 'group') {
          const found = find((layer as GroupLayer).layers)
          if (found) return found
        }
      }
      return undefined
    }
    const parent = item.layer.parent
    const parentLayers = parent && 'layers' in parent ? parent.layers as Collection<Layer> : undefined
    if (parentLayers && parentLayers.indexOf(item.layer) >= 0) return parentLayers
    return find(this.map.layers) ?? item.collection
  }

  dispose(): void {
    this.disposed = true
    this.generation += 1
    for (const item of this.owned) { this.currentCollection(item).remove(item.layer); item.layer.destroy() }
    this.owned = []
  }

  async apply(theme: ILayerTheme | undefined, defaults: TVisibilitySnapshot): Promise<boolean> {
    if (this.disposed) return false
    const request = ++this.generation
    const entries = theme?.externalLayers ?? []
    if (entries.some((entry) => !isValidExternalLayer(entry)) || new Set(entries.map((entry) => entry.id)).size !== entries.length) throw new Error('invalidService')
    const baseNodes = withoutOwned(collectVisibility(this.map.layers.toArray()), new Set(this.owned.map((item) => item.layer)))
    const available = snapshotVisibility(baseNodes)
    // Reset restores all known values still present, even if a failed service omitted sublayers.
    const plan = theme ? themeVisibility(baseNodes, theme.selectedLayerKeys ?? [])
      : Object.fromEntries(Object.entries(defaults).filter(([key]) => Object.prototype.hasOwnProperty.call(available, key)))
    const placements = entries.map((entry) => resolvePlacement(this.map, baseNodes, entry))
    entries.forEach((entry, index) => {
      if (entry.visible) placements[index]?.ancestors.forEach((node) => {
        plan[node.key] = { visible: true, mode: node.group ? 'independent' : undefined }
      })
    })
    const results = await Promise.allSettled(entries.map((entry) => this.factory(entry, `sc-layer-views-${this.widgetId}-${request}-${entry.id}`)))
    const created: Layer[] = []
    let failed = false
    let failure: unknown
    results.forEach((result) => { if (result.status === 'fulfilled') created.push(result.value); else { failed = true; failure = result.reason } })
    if (failed || this.disposed || request !== this.generation) {
      created.forEach((layer) => layer.destroy())
      if (failed && !this.disposed && request === this.generation) throw failure
      return false
    }
    // Re-resolve after async capability requests: another widget may have changed the map.
    const old = this.owned.map((item) => ({ ...item, collection: this.currentCollection(item) }))
    const previous = snapshotVisibility(collectVisibility(this.map.layers.toArray()))
    const oldPositions = old.map((item) => ({ ...item, index: item.collection.indexOf(item.layer) }))
    const next: IOwned[] = []
    try {
      const currentNodes = withoutOwned(collectVisibility(this.map.layers.toArray()), new Set(old.map((item) => item.layer)))
      const currentKeys = snapshotVisibility(currentNodes)
      if (Object.keys(plan).some((key) => !Object.prototype.hasOwnProperty.call(currentKeys, key))) throw new Error('missingLayers')
      const currentPlacements = entries.map((entry) => resolvePlacement(this.map, currentNodes, entry))
      old.forEach((item) => item.collection.remove(item.layer))
      created.forEach((layer, index) => {
        const placement = currentPlacements[index]
        if (!placement) throw new Error('externalTarget')
        // SDK collections draw bottom-to-top; inserting after an anchor displays above it.
        const position = placement.anchor ? placement.collection.indexOf(placement.anchor) + 1 : 0
        placement.collection.add(layer, position)
        next.push({ layer, collection: placement.collection })
      })
      applyVisibility(currentNodes, plan)
      created.forEach((layer, index) => { layer.visible = entries[index]?.visible ?? false })
      this.owned = next
    } catch (error) {
      next.forEach((item) => item.collection.remove(item.layer))
      created.forEach((layer) => layer.destroy())
      oldPositions.sort((a, b) => a.index - b.index).forEach((item) => { if (item.index >= 0 && item.collection.indexOf(item.layer) < 0) item.collection.add(item.layer, item.index) })
      applyVisibility(collectVisibility(this.map.layers.toArray()), previous)
      throw error
    }
    old.forEach((item) => item.layer.destroy())
    return true
  }
}
