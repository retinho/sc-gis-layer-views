/** @jsx jsx */
import { React, jsx, css, AllWidgetProps } from 'jimu-core'
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'
import { Row, Col } from 'jimu-ui'
import { CalciteButton } from 'calcite-components'
import { IMConfig } from '../config'
import messages from './translations/default'

// Step 1 deliberately does not mutate map visibility or add external layers.
export default function Widget(props: AllWidgetProps<IMConfig>): React.ReactElement {
  const [mapView, setMapView] = React.useState<JimuMapView | undefined>()
  const mapWidgetId = props.useMapWidgetIds?.[0]
  const themes = props.config?.themes ?? []
  const translate = (key: keyof typeof messages): string =>
    props.intl.formatMessage({ id: key, defaultMessage: messages[key] })
  const headingId = `${props.id}-themes`
  const statusId = `${props.id}-status`

  return (
    <section className="widget-sc-gis-layer-views" css={styles} aria-labelledby={headingId}>
      {mapWidgetId && <JimuMapViewComponent useMapWidgetId={mapWidgetId} onActiveViewChange={setMapView} />}
      <Row className="theme-heading align-items-center m-0">
        <Col className="p-0"><h2 id={headingId}>{translate('themes')}</h2></Col>
        <Col xs="auto" className="p-0">
          <CalciteButton appearance="transparent" kind="neutral" disabled title={translate('foundation')}>
            {translate('reset')}
          </CalciteButton>
        </Col>
      </Row>
      <p id={statusId} className="status" role="status">
        {!mapWidgetId ? translate('noMap') : !mapView ? translate('waitingMap') : translate('foundation')}
      </p>
      {themes.length === 0 ? <p>{translate('empty')}</p> : (
        <ul className="theme-list">
          {themes.map((theme) => (
            <li key={theme.id} className="theme-card">
              <Row className="align-items-center m-0">
                <Col className="theme-name p-0">{theme.name}</Col>
                <Col xs="auto" className="p-0">
                  <CalciteButton className="show-theme" kind="neutral" disabled
                    aria-label={`${translate('show')}: ${theme.name}`} aria-describedby={statusId}>
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

const styles = css`
  height: 100%; overflow: auto; padding: 20px;
  color: var(--sys-color-on-surface, #333);
  background: var(--sys-color-surface, #fff);
  font-family: inherit;
  .theme-heading { padding-bottom: 16px; border-bottom: 1px solid var(--sys-color-outline, #a0a0a0); }
  h2 { margin: 0; font-size: 24px; font-weight: 400; line-height: 1.3; }
  .status { margin: 14px 0; font-size: 13px; }
  .theme-list { margin: 0; padding: 0; list-style: none; }
  .theme-card {
    padding: 10px; margin-bottom: 10px;
    border: 1px solid var(--sys-color-outline, #a0a0a0);
    box-shadow: 0 1px 6px rgb(0 0 0 / 14%);
  }
  .theme-name { min-width: 0; overflow-wrap: anywhere; font-size: 17px; font-weight: 600; margin-right: 12px; }
  .show-theme { width: 112px; --calcite-color-foreground-1: #484848; --calcite-color-text-1: #fff; }
  @media (max-width: 360px) {
    padding: 12px;
    .theme-name { font-size: 15px; }
    .show-theme { width: 88px; }
  }
`
