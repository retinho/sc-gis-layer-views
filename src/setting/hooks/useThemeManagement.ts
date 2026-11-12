import { Immutable } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { IConfig, ILayerTheme, IMConfig } from '../../config'

interface IThemeManagement {
  themes: ILayerTheme[]
  add: (name: string) => void
  rename: (id: string, name: string) => void
  duplicate: (id: string, suffix: string) => void
  remove: (id: string) => void
  move: (id: string, offset: -1 | 1) => void
}

export function useThemeManagement(props: AllWidgetSettingProps<IMConfig>): IThemeManagement {
  const themes: ILayerTheme[] = Array.from(props.config?.themes ?? [], (theme) => ({ ...theme }))
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
    add: (name: string): void => { save([...themes, { id: newId(), name }]) },
    rename: (id: string, name: string): void => {
      save(themes.map((theme) => theme.id === id ? { ...theme, name } : theme))
    },
    duplicate: (id: string, suffix: string): void => {
      const index = themes.findIndex((theme) => theme.id === id)
      const source = themes[index]
      if (!source) return
      const next = [...themes]
      next.splice(index + 1, 0, { ...source, id: newId(), name: `${source.name} (${suffix})` })
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
