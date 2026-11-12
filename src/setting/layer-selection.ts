export interface ILayerNode {
  key: string
  title: string
  children: ILayerNode[]
  selectable: boolean
}

export interface ISelectionState {
  checked: boolean
  indeterminate: boolean
  disabled: boolean
}

// Only leaf keys are persisted. Parent state is derived, including nested groups.
export function getLeafKeys(node: ILayerNode): string[] {
  if (node.children.length > 0) return node.children.flatMap(getLeafKeys)
  return node.selectable ? [node.key] : []
}

export function getSelectionState(node: ILayerNode, selected: ReadonlySet<string>): ISelectionState {
  const keys = getLeafKeys(node)
  const count = keys.filter((key) => selected.has(key)).length
  return {
    checked: keys.length > 0 && count === keys.length,
    indeterminate: count > 0 && count < keys.length,
    disabled: keys.length === 0
  }
}

export function toggleSelection(node: ILayerNode, selected: readonly string[], checked: boolean): string[] {
  const next = new Set(selected)
  getLeafKeys(node).forEach((key) => {
    if (checked) next.add(key)
    else next.delete(key)
  })
  return Array.from(next)
}
