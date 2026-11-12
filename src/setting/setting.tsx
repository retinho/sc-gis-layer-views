import { React } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector, SettingRow, SettingSection } from 'jimu-ui/advanced/setting-components'
import { IMConfig } from '../config'
import messages from '../runtime/translations/default'

export default function Setting(props: AllWidgetSettingProps<IMConfig>): React.ReactElement {
  const translate = (key: keyof typeof messages): string =>
    props.intl.formatMessage({ id: key, defaultMessage: messages[key] })
  const selectMap = (ids: string[]): void => {
    props.onSettingChange({ id: props.id, useMapWidgetIds: ids })
  }
  return (
    <div className="widget-setting-sc-gis-layer-views">
      <SettingSection title={translate('map')}>
        <SettingRow><MapWidgetSelector useMapWidgetIds={props.useMapWidgetIds} onSelect={selectMap} /></SettingRow>
      </SettingSection>
      <SettingSection title={translate('themes')}>
        <p>{translate('foundation')}</p>
      </SettingSection>
    </div>
  )
}
