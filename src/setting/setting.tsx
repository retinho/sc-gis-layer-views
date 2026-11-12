/** @jsx jsx */
import { React, jsx, css } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { MapWidgetSelector, SettingRow, SettingSection } from 'jimu-ui/advanced/setting-components'
import { CalciteButton, CalciteInput, CalciteLabel, CalciteLoader } from 'calcite-components'
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'
import WebMap from 'esri/WebMap'
import { IMConfig } from '../config'
import { useThemeManagement } from './hooks/useThemeManagement'
import messages from './translations/default'
import { useWebMapTree } from './hooks/useWebMapTree'
import { LayerTree } from './components/layer-tree'
import { getLeafKeys } from './layer-selection'

export default function Setting(props: AllWidgetSettingProps<IMConfig>): React.ReactElement {
  const management = useThemeManagement(props)
  const [binding, setBinding] = React.useState<{ widgetId: string; view: JimuMapView | undefined }>()
  const mapWidgetId = props.useMapWidgetIds?.[0]
  const view = binding?.widgetId === mapWidgetId ? binding?.view : undefined
  const map = view?.view?.map
  const source = map instanceof WebMap ? map : undefined
  const tree = useWebMapTree(source)
  const availableKeys = React.useMemo(() => new Set(tree.nodes.flatMap(getLeafKeys)), [tree.nodes])
  const translate = (key: keyof typeof messages): string =>
    props.intl.formatMessage({ id: key, defaultMessage: messages[key] })
  const selectMap = (ids: string[]): void => {
    props.onSettingChange({ id: props.id, useMapWidgetIds: ids })
  }
  return (
    <div className="widget-setting-sc-gis-layer-views" css={styles}>
      {mapWidgetId && <JimuMapViewComponent key={mapWidgetId} useMapWidgetId={mapWidgetId}
        onActiveViewChange={(active: JimuMapView | undefined) => setBinding({ widgetId: mapWidgetId, view: active })} />}
      <SettingSection title={translate('map')}>
        <SettingRow><MapWidgetSelector useMapWidgetIds={props.useMapWidgetIds} onSelect={selectMap} /></SettingRow>
      </SettingSection>
      <SettingSection title={translate('themes')}>
        <p>{translate('managementHelp')}</p>
        <p>{translate('layerHelp')}</p>
        {!mapWidgetId && <p role="status">{translate('noMap')}</p>}
        {mapWidgetId && !view && <p role="status">{translate('waitingMap')}</p>}
        {view && !source && <p role="status">{translate('webMapOnly')}</p>}
        {tree.status === 'unsupported' && <p role="status">{translate('webMapOnly')}</p>}
        {tree.status === 'loading' && <CalciteLoader inline label={translate('loadingLayers')} />}
        {tree.status === 'error' && <p role="alert">{translate('layerLoadError')}</p>}
        {source && <CalciteButton className="tree-action" appearance="outline" kind="neutral"
          disabled={tree.status === 'loading'} onClick={tree.reload}>{translate('reloadLayers')}</CalciteButton>}
        {tree.status === 'ready' && tree.nodes.length === 0 && <p>{translate('noLayers')}</p>}
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
              {tree.status === 'ready' && (
                theme.webMapKey && theme.webMapKey !== tree.webMapKey ? (
                  <div>
                    <p role="status">{translate('differentMap')}</p>
                    <CalciteButton className="tree-action" appearance="outline" kind="neutral"
                      onClick={() => management.selectLayers(theme.id, tree.webMapKey, [])}>
                      {translate('useCurrentMap')}
                    </CalciteButton>
                  </div>
                ) : (
                  <div className="theme-layer-selection">
                    {(theme.selectedLayerKeys ?? []).some((key) => !availableKeys.has(key)) &&
                      <p role="status">{translate('missingLayers')}</p>}
                    <LayerTree nodes={tree.nodes} selected={theme.selectedLayerKeys ?? []}
                      expandLabel={translate('expandGroup')} collapseLabel={translate('collapseGroup')}
                      onChange={(keys) => management.selectLayers(theme.id, tree.webMapKey, keys)} />
                  </div>
                )
              )}
            </li>
          ))}
        </ol>
      </SettingSection>
    </div>
  )
}

const styles = css`
  /* Use the surrounding Builder text color, independently of the app theme.
     Calcite's shadow DOM otherwise keeps its default light-mode text color. */
  calcite-label {
    color: inherit;
    --calcite-label-text-color: currentColor;
  }
  calcite-button[kind="neutral"] {
    color: inherit;
    --calcite-button-text-color: currentColor;
    --calcite-button-border-color: currentColor;
    --calcite-button-background-color: transparent;
  }
  .theme-editors { padding: 0; margin: 16px 0 0; list-style: none; }
  .theme-editor { padding: 12px 0; border-top: 1px solid currentColor; }
  .theme-actions { display: flex; flex-wrap: wrap; gap: 6px; }
  .tree-action { margin-bottom: 12px; }
  .theme-layer-selection { margin-top: 12px; }
  .layer-tree, .layer-tree ul { list-style: none; margin: 0; padding: 0; }
  .layer-tree ul { padding-left: 16px; }
  .layer-row { display: flex; align-items: flex-start; gap: 4px; margin: 6px 0; }
  .layer-choice { flex: 1; min-width: 0; --calcite-label-margin-bottom: 0; }
  .layer-choice span { overflow-wrap: anywhere; }
  .layer-spacer { width: 24px; flex-shrink: 0; }
`
