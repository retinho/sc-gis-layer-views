/** @jsx jsx */
import { React, jsx, css } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector, SettingRow, SettingSection } from 'jimu-ui/advanced/setting-components'
import { CalciteButton, CalciteInput, CalciteLabel } from 'calcite-components'
import { IMConfig } from '../config'
import { useThemeManagement } from './hooks/useThemeManagement'
import messages from './translations/default'

export default function Setting(props: AllWidgetSettingProps<IMConfig>): React.ReactElement {
  const management = useThemeManagement(props)
  const translate = (key: keyof typeof messages): string =>
    props.intl.formatMessage({ id: key, defaultMessage: messages[key] })
  const selectMap = (ids: string[]): void => {
    props.onSettingChange({ id: props.id, useMapWidgetIds: ids })
  }
  return (
    <div className="widget-setting-sc-gis-layer-views" css={styles}>
      <SettingSection title={translate('map')}>
        <SettingRow><MapWidgetSelector useMapWidgetIds={props.useMapWidgetIds} onSelect={selectMap} /></SettingRow>
      </SettingSection>
      <SettingSection title={translate('themes')}>
        <p>{translate('managementHelp')}</p>
        <CalciteButton width="full" onClick={() => management.add(translate('newTheme'))}>
          {translate('addTheme')}
        </CalciteButton>
        {management.themes.length === 0 && <p className="mt-3">{translate('empty')}</p>}
        <ol className="theme-editors">
          {management.themes.map((theme, index) => (
            <li key={theme.id} className="theme-editor">
              <CalciteLabel>
                {translate('themeName')}
                <CalciteInput value={theme.name} type="text"
                  onCalciteInputInput={(event) => management.rename(theme.id, event.target.value)} />
              </CalciteLabel>
              <div className="theme-actions">
                <CalciteButton scale="s" appearance="outline" kind="neutral"
                  onClick={() => management.duplicate(theme.id, translate('copy'))}>
                  {translate('duplicate')}
                </CalciteButton>
                <CalciteButton scale="s" appearance="outline" kind="neutral" disabled={index === 0}
                  label={`${translate('moveUp')}: ${theme.name}`}
                  onClick={() => management.move(theme.id, -1)}>{translate('moveUp')}</CalciteButton>
                <CalciteButton scale="s" appearance="outline" kind="neutral"
                  disabled={index === management.themes.length - 1}
                  label={`${translate('moveDown')}: ${theme.name}`}
                  onClick={() => management.move(theme.id, 1)}>{translate('moveDown')}</CalciteButton>
                <CalciteButton scale="s" appearance="transparent" kind="danger"
                  label={`${translate('deleteTheme')}: ${theme.name}`}
                  onClick={() => management.remove(theme.id)}>{translate('deleteTheme')}</CalciteButton>
              </div>
            </li>
          ))}
        </ol>
      </SettingSection>
    </div>
  )
}

const styles = css`
  .theme-editors { padding: 0; margin: 16px 0 0; list-style: none; }
  .theme-editor { padding: 12px 0; border-top: 1px solid currentColor; }
  .theme-actions { display: flex; flex-wrap: wrap; gap: 6px; }
`
