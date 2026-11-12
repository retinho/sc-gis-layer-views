/** @jsx jsx */
import { React, jsx, css, AllWidgetProps, getAppStore } from 'jimu-core'
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'
import { Row, Col } from 'jimu-ui'
import { CalciteButton, CalciteLoader } from 'calcite-components'
import { IMConfig } from '../config'
import messages from './translations/default'
import { readThemeRequest, findThemeOwners } from '../shared/theme-link'
import { getThemeController } from './theme-controller'
import { useLayerThemes } from './hooks/useLayerThemes'

export default function Widget(props: AllWidgetProps<IMConfig>): React.ReactElement {
  const [mapView, setMapView] = React.useState<JimuMapView | undefined>()
  const mapWidgetId = props.useMapWidgetIds?.[0]
  const themes = props.config?.themes ?? []
  const currentView = mapView?.mapWidgetId === mapWidgetId ? mapView : undefined
  const controller = useLayerThemes(currentView, props.id)
  React.useEffect(() => {
    if (window.jimuConfig.isInBuilder || !controller.ready) return
    const runtime = getThemeController(props.id)
    try {
      const request = readThemeRequest(window.location.href)
      if (!request) return
      const owners = findThemeOwners(request, getAppStore().getState().appConfig.widgets)
      if (owners.length > 1) { runtime.invalidLink(); return }
      if (owners.length === 1 && owners[0] !== props.id) return
      if (request.widgetId && request.widgetId !== props.id) return
      const selected = themes.find((entry) => entry.id === request.themeId)
      runtime.start(selected ? { ...selected, selectedLayerKeys: Array.from(selected.selectedLayerKeys ?? []), externalLayers: Array.from(selected.externalLayers ?? []).map((entry) => ({ ...entry })) } : undefined)
    } catch { runtime.invalidLink() }
  }, [controller.ready, props.id, themes])
  const translate = (key: keyof typeof messages): string =>
    props.intl.formatMessage({ id: key, defaultMessage: messages[key] })
  const headingId = `${props.id}-themes`
  const statusId = `${props.id}-status`
  const styles = React.useMemo(() => getStyles(props.theme), [props.theme])
  const onActiveViewChange = React.useCallback((view: JimuMapView | undefined): void => {
    setMapView(view)
  }, [])

  return (
    <section className="jimu-widget widget-sc-gis-layer-views" css={styles} aria-labelledby={headingId}>
      {mapWidgetId && <JimuMapViewComponent key={mapWidgetId} useMapWidgetId={mapWidgetId} onActiveViewChange={onActiveViewChange} />}
      <Row className="theme-heading align-items-center m-0">
        <Col className="p-0"><h2 id={headingId}>{translate('themes')}</h2></Col>
        <Col xs="auto" className="p-0">
          <CalciteButton className="reset-themes" appearance="transparent" kind="neutral"
            disabled={!controller.ready} onClick={controller.reset}>
            {translate('reset')}
          </CalciteButton>
        </Col>
      </Row>
      {(!mapWidgetId || !currentView || controller.message) && <div id={statusId} className="status" role="status">
        {(controller.message === 'loadingMap' || controller.message === 'loadingServices') && <CalciteLoader inline label={translate('loadingMap')} />}
        {!mapWidgetId ? translate('noMap') : !currentView ? translate('waitingMap') : controller.message ? translate(controller.message) : null}
        {controller.message === 'mapLoadError' && <CalciteButton appearance="outline" kind="neutral" onClick={controller.retry}>
          {translate('retry')}
        </CalciteButton>}
      </div>}
      {controller.partial && <p className="status" role="status">{translate('partialMap')}</p>}
      {themes.length === 0 ? <p>{translate('empty')}</p> : (
        <ul className="theme-list">
          {themes.map((theme) => (
            <li key={theme.id} className="theme-card" title={theme.requester?.trim() ? `${translate('owner')}: ${theme.requester.trim()}` : undefined}>
              <Row className="align-items-center m-0">
                <Col className="theme-name p-0">{theme.name}</Col>
                <Col xs="auto" className="p-0">
                  <CalciteButton className="show-theme" kind="neutral" disabled={!controller.ready}
                    onClick={() => controller.apply({ ...theme, selectedLayerKeys: Array.from(theme.selectedLayerKeys ?? []), externalLayers: Array.from(theme.externalLayers ?? []).map((entry) => ({ ...entry })) })}
                    label={`${translate('show')}: ${theme.name}`}>
                    {translate('show')}
                  </CalciteButton>
                </Col>
              </Row>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// These theme fields are present in Esri's version-pinned 1.17 demo theme.
function getStyles(theme: AllWidgetProps<IMConfig>['theme']): ReturnType<typeof css> {
  return css`
  height: 100%; box-sizing: border-box; overflow: auto; padding: 20px;
  color: ${theme?.body?.color ?? '#333'};
  background: ${theme?.surfaces?.[1]?.bg ?? '#fff'};
  font-family: ${theme?.body?.fontFamily ?? 'inherit'};
  .theme-heading { padding-bottom: 16px; border-bottom: 1px solid ${theme?.border?.color ?? '#a0a0a0'}; }
  h2 { margin: 0; font-size: 24px; font-weight: 400; line-height: 1.3; }
  .status { margin: 14px 0; font-size: 13px; }
  .theme-list { margin: 0; padding: 0; list-style: none; }
  .theme-card {
    padding: 10px; margin-bottom: 10px;
    border: 1px solid ${theme?.border?.color ?? '#a0a0a0'};
    box-shadow: 0 1px 6px rgb(0 0 0 / 14%);
  }
  .theme-name { min-width: 0; overflow-wrap: anywhere; font-size: 17px; font-weight: 600; margin-right: 12px; }
  .reset-themes { --calcite-button-text-color: ${theme?.body?.color ?? '#333'}; }
  .show-theme {
    width: 112px;
    --calcite-button-background-color: #484848;
    --calcite-button-text-color: #fff;
    --calcite-button-corner-radius: 0;
  }
  @media (max-width: 360px) {
    padding: 12px;
    .theme-name { font-size: 15px; }
    .show-theme { width: 88px; }
  }
`
}
