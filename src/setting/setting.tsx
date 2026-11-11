import { React, Immutable } from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import { SettingSection, MapWidgetSelector } from 'jimu-ui/advanced/setting-components'
import { CalciteButton, CalciteInput, CalciteLabel } from 'calcite-components'
import { type IConfig, type IMConfig, type ISavedView } from '../config'
import { decodeViewState, extractViewData } from '../runtime/utils/view-state'
import { calciteThemeStyle } from '../theme'
import messages from './translations/default'

type EditableField = 'label' | 'urlData'
export default function Setting(props: AllWidgetSettingProps<IMConfig>): React.ReactElement {
  const { config, onSettingChange, id, useMapWidgetIds } = props
  const [invalidIds, setInvalidIds] = React.useState<ReadonlySet<string>>(new Set<string>())
  const t = (key: keyof typeof messages): string => props.intl.formatMessage({ id: key, defaultMessage: messages[key] })
  const getViews = (): ISavedView[] => config?.predefinedViews?.asMutable({ deep: true }) ?? []
  const save = (views: ISavedView[]): void => {
    const defaults: IConfig = { predefinedViews: [] }
    const base: IMConfig = config ?? Immutable(defaults)
    const next = base.set('predefinedViews', Immutable(views))
    onSettingChange({ id, config: next })
  }
  const addView = (): void => { save([...getViews(), { id: crypto.randomUUID(), label: t('newView'), urlData: '' }]) }
  const updateView = (viewId: string, field: EditableField, value: string): void => {
    let normalized = value
    if (field === 'urlData') {
      let invalid = false
      try {
        if (value.trim()) { decodeViewState(value); normalized = extractViewData(value) }
      } catch { invalid = true }
      setInvalidIds((previous: ReadonlySet<string>): ReadonlySet<string> => {
        const next = new Set(previous)
        if (invalid) next.add(viewId)
        else next.delete(viewId)
        return next
      })
    }
    save(getViews().map((view: ISavedView): ISavedView => view.id === viewId ? { ...view, [field]: normalized } : view))
  }
  const deleteView = (viewId: string): void => {
    save(getViews().filter((view: ISavedView): boolean => view.id !== viewId))
    setInvalidIds((previous: ReadonlySet<string>): ReadonlySet<string> => {
      const next = new Set(previous)
      next.delete(viewId)
      return next
    })
  }
  return (
    <div className={`setting-sc-gis-layer-views p-3 ${props.theme.darkTheme ? 'calcite-mode-dark' : 'calcite-mode-light'}`} style={calciteThemeStyle}>
      <SettingSection title={t('mapSectionTitle')}>
        <MapWidgetSelector useMapWidgetIds={useMapWidgetIds}
          onSelect={(ids: string[]): void => { onSettingChange({ id, useMapWidgetIds: ids }) }} />
      </SettingSection>
      <SettingSection title={t('settingsTitle')}>
        <CalciteButton width="full" className="mb-3" onClick={addView}>{t('addView')}</CalciteButton>
        {config?.predefinedViews?.map((view): React.ReactElement => (
          <div key={view.id} className="p-2 mb-3 border rounded">
            <CalciteLabel>{t('viewTitle')}
              <CalciteInput value={view.label}
                onCalciteInputInput={(event): void => { updateView(view.id, 'label', event.target.value) }} />
            </CalciteLabel>
            <CalciteLabel>{t('viewData')}
              <CalciteInput value={view.urlData} status={invalidIds.has(view.id) ? 'invalid' : 'idle'}
                onCalciteInputChange={(event): void => { updateView(view.id, 'urlData', event.target.value) }} />
            </CalciteLabel>
            {invalidIds.has(view.id) && <p role="alert">{t('invalidView')}</p>}
            <CalciteButton width="full" kind="danger" appearance="outline" label={`${t('deleteView')}: ${view.label}`}
              onClick={(): void => { deleteView(view.id) }}>{t('deleteView')}</CalciteButton>
          </div>
        ))}
      </SettingSection>
    </div>
  )
}
