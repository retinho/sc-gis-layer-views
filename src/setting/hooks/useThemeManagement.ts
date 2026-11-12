import { Immutable } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { IConfig, ILayerTheme, IMConfig } from '../../config'
import { mergeThemeDraft } from '../theme-draft'

interface IThemeManagement {
  themes: ILayerTheme[]
  updateTheme: (draft: ILayerTheme) => void
  add: (name: string) => void
  duplicate: (id: string, suffix: string) => void
  remove: (id: string) => void
  move: (id: string, offset: -1 | 1) => void
}

export function useThemeManagement(props: AllWidgetSettingProps<IMConfig>): IThemeManagement {
  const themes: ILayerTheme[] = Array.from(props.config?.themes ?? [], (theme) => ({
    ...theme, selectedLayerKeys: Array.from(theme.selectedLayerKeys ?? [])
  }))
  const save = (next: ILayerTheme[]): void => {
    const config = props.config ?? Immutable<IConfig>({ themes: [] })
    props.onSettingChange({ id: props.id, config: config.set('themes', next) })
  }
  const newId = (): string => {
    const base = `theme-${Date.now().toString(36)}`
    let candidate = base
    let index = 1
    while (themes.some((theme) => theme.id === candidate)) {
      candidate = `${base}-${index++}`
    }
    return candidate
  }
  return {
    themes,
    updateTheme: (draft: ILayerTheme): void => { save(mergeThemeDraft(themes, draft)) },
    add: (name: string): void => { save([...themes, { id: newId(), name }]) },
    duplicate: (id: string, suffix: string): void => {
      const index = themes.findIndex((theme) => theme.id === id)
      const source = themes[index]
      if (!source) return
      const next = [...themes]
      next.splice(index + 1, 0, {
        ...source, id: newId(), name: `${source.name} (${suffix})`,
        selectedLayerKeys: [...(source.selectedLayerKeys ?? [])]
      })
      save(next)
    },
    remove: (id: string): void => { save(themes.filter((theme) => theme.id !== id)) },
    move: (id: string, offset: -1 | 1): void => {
      const index = themes.findIndex((theme) => theme.id === id)
      const target = index + offset
      const selected = themes[index]
      if (!selected || target < 0 || target >= themes.length) return
      const next = [...themes]
      next.splice(index, 1)
      next.splice(target, 0, selected)
      save(next)
    }
  }
}
