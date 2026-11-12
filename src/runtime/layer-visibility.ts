import type Layer from 'esri/layers/Layer'
import type GroupLayer from 'esri/layers/GroupLayer'
import type MapImageLayer from 'esri/layers/MapImageLayer'
import type Sublayer from 'esri/layers/support/Sublayer'

type TGroupMode = 'independent' | 'inherited' | 'exclusive'
export interface IVisibilityNode {
  key: string
  target: { visible: boolean }
  group?: { visibilityMode: TGroupMode }
  children: IVisibilityNode[]
}
export interface IVisibilityValue {
  visible: boolean
  mode?: TGroupMode
}
export type TVisibilitySnapshot = Record<string, IVisibilityValue>

export function collectVisibility(layers: readonly Layer[]): IVisibilityNode[] {
  const sublayer = (layer: Sublayer, parent: string[]): IVisibilityNode => {
    const path = [...parent, `sublayer:${layer.id}`]
    return { key: JSON.stringify(path), target: layer, children: layer.sublayers?.toArray().map((child) => sublayer(child, path)) ?? [] }
  }
  const visit = (layer: Layer, parent: string[]): IVisibilityNode => {
    const path = [...parent, `layer:${layer.id}`]
    const group = layer.type === 'group' ? layer as GroupLayer : undefined
    const children = group ? group.layers.toArray().map((child) => visit(child, path))
      : layer.type === 'map-image' ? (layer as MapImageLayer).sublayers?.toArray().map((child) => sublayer(child, path)) ?? [] : []
    return { key: JSON.stringify(path), target: layer, group, children }
  }
  return layers.map((layer) => visit(layer, []))
}

export function snapshotVisibility(nodes: readonly IVisibilityNode[]): TVisibilitySnapshot {
  const snapshot: TVisibilitySnapshot = {}
  const visit = (node: IVisibilityNode): void => {
    snapshot[node.key] = { visible: node.target.visible, mode: node.group?.visibilityMode }
    node.children.forEach(visit)
  }
  nodes.forEach(visit)
  return snapshot
}

export function themeVisibility(nodes: readonly IVisibilityNode[], keys: readonly string[]): TVisibilitySnapshot {
  const selected = new Set(keys)
  const available = snapshotVisibility(nodes)
  if (keys.some((key) => !Object.prototype.hasOwnProperty.call(available, key))) throw new Error('missingLayers')
  const plan: TVisibilitySnapshot = {}
  const visit = (node: IVisibilityNode): boolean => {
    const children = node.children.map(visit)
    const visible = node.children.length > 0 ? children.some(Boolean) : selected.has(node.key)
    plan[node.key] = { visible, mode: node.group ? 'independent' : undefined }
    return visible
  }
  nodes.forEach(visit)
  return plan
}

// Validate first, then apply children before parents. Revert on assignment failure.
export function applyVisibility(nodes: readonly IVisibilityNode[], plan: TVisibilitySnapshot): void {
  const all: IVisibilityNode[] = []
  const visit = (node: IVisibilityNode): void => { node.children.forEach(visit); all.push(node) }
  nodes.forEach(visit)
  const indexed = new Map(all.map((node) => [node.key, node]))
  if (Object.keys(plan).some((key) => !indexed.has(key))) throw new Error('missingLayers')
  const before = snapshotVisibility(nodes)
  const write = (values: TVisibilitySnapshot): void => {
    all.forEach((node) => { if (values[node.key] && node.group) node.group.visibilityMode = 'independent' })
    all.forEach((node) => { const value = values[node.key]; if (value) node.target.visible = value.visible })
    all.forEach((node) => { const mode = values[node.key]?.mode; if (mode && node.group) node.group.visibilityMode = mode })
  }
  try { write(plan) } catch (error) { write(before); throw error }
}
