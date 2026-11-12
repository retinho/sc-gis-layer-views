import type { ILayerTheme } from '../config'
import type { ILayerNode } from './layer-selection'

export interface IReferenceOption { key: string; label: string; node: ILayerNode }
export interface IReferenceIssue {
  kind: 'selection' | 'group' | 'anchor'
  entryId?: string
  label: string
  key: string
  options: IReferenceOption[]
  matches: IReferenceOption[]
}
export function referenceIdentity(key: string): string {
  try {
    const path: unknown = JSON.parse(key)
    if (!Array.isArray(path) || !path.every((part) => typeof part === 'string')) return ''
    const last = path[path.length - 1] as string | undefined
    if (!last) return ''
    // Sublayer IDs are only unique within their owning service layer.
    return last.startsWith('sublayer:') ? JSON.stringify([path.filter((part: string) => part.startsWith('layer:')).pop(), last]) : last
  } catch { return '' }
}
export function referenceLabel(key: string): string {
  try { const path: unknown = JSON.parse(key); return Array.isArray(path) && path.every((part) => typeof part === 'string') ? path.join(' / ') : key } catch { return key }
}
export function referenceOptions(nodes: readonly ILayerNode[], parent = ''): IReferenceOption[] {
  return nodes.flatMap((node) => {
    const label = parent ? `${parent} / ${node.title}` : node.title
    return [{ key: node.key, label, node }, ...referenceOptions(node.children, label)]
  })
}
export function referenceIssues(theme: ILayerTheme, nodes: readonly ILayerNode[]): IReferenceIssue[] {
  const all = referenceOptions(nodes)
  const leaves = all.filter(({ node }) => node.selectable && node.children.length === 0)
  const groups = all.filter(({ node }) => node.isGroup)
  const issues: IReferenceIssue[] = []
  const inspect = (kind: IReferenceIssue['kind'], key: string, options: IReferenceOption[], label: string, entryId?: string): void => {
    if (options.some((option) => option.key === key)) return
    const identity = referenceIdentity(key)
    issues.push({ kind, key, label, entryId, options, matches: identity ? options.filter((option) => referenceIdentity(option.key) === identity) : [] })
  }
  for (const key of new Set(theme.selectedLayerKeys ?? [])) inspect('selection', key, leaves, referenceLabel(key))
  for (const entry of theme.externalLayers ?? []) {
    if (entry.groupKey) inspect('group', entry.groupKey, groups, entry.title, entry.id)
    const group = groups.find((option) => option.key === entry.groupKey)
    // Resolve the container first; positions must stay within that container.
    if (entry.groupKey && !group) continue
    const siblings = group ? group.node.children : nodes
    if (entry.beforeLayerKey) inspect('anchor', entry.beforeLayerKey, referenceOptions(siblings).filter((option) => siblings.some((node) => node.key === option.key)), entry.title, entry.id)
  }
  return issues
}
export function resolveReference(theme: ILayerTheme, issue: IReferenceIssue, replacement?: string): ILayerTheme {
  if (replacement && !issue.options.some((option) => option.key === replacement)) return theme
  if (issue.kind === 'selection') return { ...theme, selectedLayerKeys: [...new Set((theme.selectedLayerKeys ?? []).flatMap((key) => key === issue.key ? replacement ? [replacement] : [] : [key]))] }
  return { ...theme, externalLayers: (theme.externalLayers ?? []).map((entry) => {
    if (entry.id !== issue.entryId) return entry
    if (issue.kind === 'group') return { ...entry, groupKey: replacement, beforeLayerKey: replacement ? entry.beforeLayerKey : undefined }
    return { ...entry, beforeLayerKey: replacement }
  }) }
}
