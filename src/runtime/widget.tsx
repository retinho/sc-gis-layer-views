import { React, type AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis'
import { CalciteButton, CalciteLabel, CalciteLoader, CalciteTextArea } from 'calcite-components'
import { type IMConfig } from '../config'
import { useMapViews } from './hooks/use-map-views'
import { calciteThemeStyle } from '../theme'
import messages from './translations/default'

interface IActiveMap { widgetId: string | undefined; view: JimuMapView | null }

export default function Widget(props: AllWidgetProps<IMConfig>): React.ReactElement {
  const [active, setActive] = React.useState<IActiveMap | null>(null)
  const mapWidgetId = props.useMapWidgetIds?.[0]
  const jmv = active?.widgetId === mapWidgetId ? active?.view ?? null : null
  const views = useMapViews(mapWidgetId ? jmv : null)
  const t = (key: keyof typeof messages): string => props.intl.formatMessage({ id: key, defaultMessage: messages[key] })
  const onActiveViewChange = React.useCallback((view: JimuMapView | undefined): void => {
    setActive({ widgetId: mapWidgetId, view: view ?? null })
  }, [mapWidgetId])
  const predefined = props.config?.predefinedViews
  const error = ['invalidView', 'loadFailed', 'captureFailed'].includes(views.message)
  return (
    <div className={`widget-sc-gis-layer-views jimu-widget p-3 ${props.theme.darkTheme ? 'calcite-mode-dark' : 'calcite-mode-light'}`}
      style={{ ...calciteThemeStyle, overflowY: 'auto', height: '100%' }}
      aria-busy={views.busy}>
      {mapWidgetId && <JimuMapViewComponent key={mapWidgetId} useMapWidgetId={mapWidgetId} onActiveViewChange={onActiveViewChange} />}
      {!mapWidgetId && <p>{t('selectMap')}</p>}
      {mapWidgetId && !jmv && <p>{t('waitingForMap')}</p>}
      {views.busy && <CalciteLoader label={t('loading')} scale="s" />}
      <section className="mb-3" aria-labelledby={`${props.id}-capture`}>
        <h3 id={`${props.id}-capture`} className="h6">{t('captureTitle')}</h3>
        <CalciteButton width="full" disabled={!views.ready || views.busy} onClick={(): void => { void views.capture() }}>
          {t('capture')}
        </CalciteButton>
        {views.generatedUrl && <CalciteLabel className="mt-2">{t('generatedUrl')}
          <CalciteTextArea readOnly value={views.generatedUrl} rows={3} />
        </CalciteLabel>}
      </section>
      <section aria-labelledby={`${props.id}-views`}>
        <h3 id={`${props.id}-views`} className="h6">{t('predefinedViews')}</h3>
        {!predefined?.length && <p>{t('noViews')}</p>}
        {predefined?.map((view): React.ReactElement => (
          <CalciteButton key={view.id} className="mb-2" width="full" appearance="outline"
            disabled={!views.ready || views.busy || !view.urlData}
            onClick={(): void => { void views.apply(view.urlData) }}>
            {view.label || t('unnamedView')}
          </CalciteButton>
        ))}
      </section>
      <div role={error ? 'alert' : 'status'} aria-live={error ? 'assertive' : 'polite'}>
        {views.message !== 'ready' && t(views.message)}
      </div>
    </div>
  )
}
