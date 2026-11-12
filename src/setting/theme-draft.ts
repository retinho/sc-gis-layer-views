import type { ILayerTheme } from '../config'

export function createThemeDraft(theme: ILayerTheme): ILayerTheme {
  return { ...theme, selectedLayerKeys: [...(theme.selectedLayerKeys ?? [])], externalLayers: (theme.externalLayers ?? []).map((entry) => ({ ...entry })) }
}

export function mergeThemeDraft(themes: readonly ILayerTheme[], draft: ILayerTheme): ILayerTheme[] {
  return themes.map((theme) => theme.id === draft.id ? {
    ...theme, name: draft.name.trim(), requester: draft.requester?.trim() ?? '', webMapKey: draft.webMapKey,
    selectedLayerKeys: [...(draft.selectedLayerKeys ?? [])],
    externalLayers: (draft.externalLayers ?? []).map((entry) => ({ ...entry }))
  } : theme)
}
