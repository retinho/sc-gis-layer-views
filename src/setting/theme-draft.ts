import type { ILayerTheme } from '../config'

export function createThemeDraft(theme: ILayerTheme): ILayerTheme {
  return { ...theme, selectedLayerKeys: [...(theme.selectedLayerKeys ?? [])] }
}

export function mergeThemeDraft(themes: readonly ILayerTheme[], draft: ILayerTheme): ILayerTheme[] {
  return themes.map((theme) => theme.id === draft.id ? {
    ...theme, name: draft.name.trim(), webMapKey: draft.webMapKey,
    selectedLayerKeys: [...(draft.selectedLayerKeys ?? [])]
  } : theme)
}
