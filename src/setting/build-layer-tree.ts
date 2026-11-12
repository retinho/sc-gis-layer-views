import type Layer from 'esri/layers/Layer'
import type GroupLayer from 'esri/layers/GroupLayer'
import type MapImageLayer from 'esri/layers/MapImageLayer'
import type Sublayer from 'esri/layers/support/Sublayer'
import type { ILayerNode } from './layer-selection'

function sublayerNode(layer: Sublayer, parent: string[]): ILayerNode {
  const path = [...parent, `sublayer:${layer.id}`]
  const children = layer.sublayers?.toArray().reverse().map((child) => sublayerNode(child, path)) ?? []
  return { key: JSON.stringify(path), title: layer.title || String(layer.id), children, selectable: true }
}

function layerNode(layer: Layer, parent: string[]): ILayerNode {
  const path = [...parent, `layer:${layer.id}`]
  let children: ILayerNode[] = []
  if (layer.type === 'group') {
    children = (layer as GroupLayer).layers.toArray().reverse().map((child) => layerNode(child, path))
  } else if (layer.type === 'map-image') {
    children = (layer as MapImageLayer).sublayers?.toArray().reverse().map((child) => sublayerNode(child, path)) ?? []
  }
  return {
    key: JSON.stringify(path), title: layer.title || layer.id, children,
    isGroup: layer.type === 'group',
    selectable: layer.type !== 'group' && layer.type !== 'unsupported' && layer.type !== 'unknown'
  }
}

export function buildLayerTree(layers: readonly Layer[]): ILayerNode[] {
  return [...layers].reverse().map((layer) => layerNode(layer, []))
}
