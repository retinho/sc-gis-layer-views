/** @jsx jsx */
import { React, jsx, css } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector, SettingRow, SettingSection } from 'jimu-ui/advanced/setting-components'
import { CalciteButton, CalciteInput, CalciteLabel } from 'calcite-components'
import { IMConfig } from '../config'
import { useThemeManagement } from './hooks/useThemeManagement'
import messages from './translations/default'
import { useConfiguredWebMaps } from './hooks/useConfiguredWebMaps'
import { suggestExperienceUrl } from '../shared/theme-link'
import { ThemeEditor } from './components/theme-editor'

export default function Setting(props: AllWidgetSettingProps<IMConfig>): React.ReactElement {
  const experienceUrl = props.config.publicExperienceUrl ?? suggestExperienceUrl(window.location.href)
  const management = useThemeManagement(props)
  const mapWidgetId = props.useMapWidgetIds?.[0]
  const sources = useConfiguredWebMaps(mapWidgetId)
  const [editingId, setEditingId] = React.useState<string>()
  const editingTheme = management.themes.find((theme) => theme.id === editingId)
  const translate = (key: keyof typeof messages): string =>
    props.intl.formatMessage({ id: key, defaultMessage: messages[key] })
  const selectMap = (ids: string[]): void => {
    setEditingId(undefined)
    props.onSettingChange({ id: props.id, useMapWidgetIds: ids })
  }
  return (
    <div className="widget-setting-sc-gis-layer-views" css={styles}>
      <p className="widget-version">{translate('widgetVersion')}: {props.manifest.version}</p>
      <SettingSection title={translate('map')}>
        <SettingRow><MapWidgetSelector useMapWidgetIds={props.useMapWidgetIds} onSelect={selectMap} /></SettingRow>
      </SettingSection>
      <SettingSection title={translate('themeLinks')}>
        <CalciteLabel>{translate('experienceUrl')}<CalciteInput type="url" value={experienceUrl}
          onCalciteInputInput={(event) => props.onSettingChange({ id: props.id, config: props.config.set('publicExperienceUrl', event.target.value) })} /></CalciteLabel>
        <p>{translate('experienceUrlHelp')}</p>
      </SettingSection>
      <SettingSection title={translate('themes')}>
        <p>{translate('managementHelp')}</p>
        {!mapWidgetId && <p role="status">{translate('noMap')}</p>}
        {mapWidgetId && sources.length === 0 && <p role="status">{translate('webMapOnly')}</p>}
        <CalciteButton width="full" onClick={() => management.add(translate('newTheme'))}>{translate('addTheme')}</CalciteButton>
        {management.themes.length === 0 && <p className="mt-3">{translate('empty')}</p>}
        <ol className="theme-editors">
          {management.themes.map((theme, index) => (
            <li key={theme.id} className="theme-editor">
              <strong className="theme-name">{theme.name}</strong>
              <CalciteButton width="full" appearance="outline" kind="neutral" onClick={() => setEditingId(theme.id)}>
                {translate('configureTheme')}
              </CalciteButton>
              <div className="theme-actions">
                <CalciteButton scale="s" appearance="outline" kind="neutral" onClick={() => management.duplicate(theme.id, translate('copy'))}>
                  {translate('duplicate')}
                </CalciteButton>
                <CalciteButton scale="s" appearance="outline" kind="neutral" disabled={index === 0}
                  label={`${translate('moveUp')}: ${theme.name}`} onClick={() => management.move(theme.id, -1)}>{translate('moveUp')}</CalciteButton>
                <CalciteButton scale="s" appearance="outline" kind="neutral" disabled={index === management.themes.length - 1}
                  label={`${translate('moveDown')}: ${theme.name}`} onClick={() => management.move(theme.id, 1)}>{translate('moveDown')}</CalciteButton>
                <CalciteButton scale="s" appearance="transparent" kind="danger"
                  label={`${translate('deleteTheme')}: ${theme.name}`} onClick={() => management.remove(theme.id)}>{translate('deleteTheme')}</CalciteButton>
              </div>
            </li>
          ))}
        </ol>
      </SettingSection>
      {editingTheme && <ThemeEditor key={`${mapWidgetId}-${editingTheme.id}`} theme={editingTheme} widgetId={props.id} experienceUrl={experienceUrl} sources={sources} translate={translate}
        onCancel={() => setEditingId(undefined)} onApply={(draft) => { management.updateTheme(draft); setEditingId(undefined) }} />}
    </div>
  )
}

const styles = css`
  .widget-version { margin: 0; padding: 12px 16px; font-size: 12px; color: inherit; }
  calcite-button[kind="neutral"] { color: inherit; --calcite-button-text-color: currentColor; --calcite-button-border-color: currentColor; --calcite-button-background-color: transparent; }
  .theme-editors { padding: 0; margin: 16px 0 0; list-style: none; }
  .theme-editor { padding: 12px 0; border-top: 1px solid currentColor; }
  .theme-name { display: block; margin-bottom: 8px; overflow-wrap: anywhere; }
  .theme-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
`
