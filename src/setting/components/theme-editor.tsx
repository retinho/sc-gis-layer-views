/** @jsx jsx */
import { React, jsx, css } from 'jimu-core'
import { Modal, ModalHeader } from 'jimu-ui'
import { CalciteButton, CalciteInput, CalciteLabel, CalciteLoader, CalciteSelect, CalciteOption } from 'calcite-components'
import esriConfig from 'esri/config'
import type { ILayerTheme } from '../../config'
import type { IConfiguredWebMap } from '../configured-webmaps'
import messages from '../translations/default'
import { createThemeDraft } from '../theme-draft'
import { useWebMapTree } from '../hooks/useWebMapTree'
import { getLeafKeys } from '../layer-selection'
import { ExternalEditor } from './external-editor'
import { isValidExternalLayer } from '../../shared/external-config'
import type { ILayerNode } from '../layer-selection'
import { createThemeLink } from '../../shared/theme-link'
import { WebMapReconcile } from './webmap-reconcile'
import { LayerTree } from './layer-tree'

interface IThemeEditorProps {
  widgetId: string
  experienceUrl: string
  theme: ILayerTheme
  sources: readonly IConfiguredWebMap[]
  translate: (key: keyof typeof messages) => string
  onApply: (draft: ILayerTheme) => void
  onCancel: () => void
}

export function ThemeEditor({ theme, widgetId, experienceUrl, sources, translate, onApply, onCancel }: IThemeEditorProps): React.ReactElement {
  const [copyStatus, setCopyStatus] = React.useState<'linkCopied' | 'linkCopyFailed' | null>(null)
  let themeLink = ''
  try { themeLink = createThemeLink(experienceUrl, widgetId, theme.id) } catch { /* Invalid base URL is shown below. */ }
  const copyLink = async (): Promise<void> => {
    try { await navigator.clipboard.writeText(themeLink); setCopyStatus('linkCopied') }
    catch { setCopyStatus('linkCopyFailed') }
  }
  const [draft, setDraft] = React.useState<ILayerTheme>(() => createThemeDraft(theme))
  const [sourceId, setSourceId] = React.useState(() => sources.find((entry) =>
    JSON.stringify([(entry.portalUrl || esriConfig.portalUrl).replace(/\/$/, ''), entry.itemId]) === theme.webMapKey
  )?.dataSourceId ?? sources[0]?.dataSourceId ?? '')
  const source = sources.find((entry) => entry.dataSourceId === sourceId) ?? sources[0]
  const tree = useWebMapTree(source)
  const available = React.useMemo(() => new Set(tree.nodes.flatMap(getLeafKeys)), [tree.nodes])
  const differentMap = Boolean(draft.webMapKey && tree.status === 'ready' && draft.webMapKey !== tree.webMapKey)
  const changeSelection = (keys: string[]): void => {
    setDraft((current) => ({ ...current, webMapKey: tree.webMapKey, selectedLayerKeys: [...keys] }))
  }
  const validPlacement = (entry: NonNullable<ILayerTheme['externalLayers']>[number]): boolean => {
    const findGroup = (nodes: readonly ILayerNode[]): ILayerNode | undefined => {
      for (const node of nodes) {
        if (node.isGroup && node.key === entry.groupKey) return node
        const found = findGroup(node.children)
        if (found) return found
      }
      return undefined
    }
    const group = entry.groupKey ? findGroup(tree.nodes) : undefined
    const siblings = entry.groupKey ? group?.children : tree.nodes
    return Boolean(siblings && (!entry.beforeLayerKey || siblings.some((node) => node.key === entry.beforeLayerKey)))
  }
  const invalidServices = (draft.externalLayers ?? []).some((entry) => !isValidExternalLayer(entry) || !validPlacement(entry))
  const unresolved = (draft.selectedLayerKeys ?? []).some((key) => !available.has(key))
  const canApply = Boolean(draft.name.trim() && !differentMap && !invalidServices && !unresolved && tree.status === 'ready' && !tree.partial)
  const apply = (): void => {
    if (!canApply) return
    // A newly configured empty theme is valid: it intentionally hides all operational layers.
    onApply({ ...draft, webMapKey: draft.webMapKey ?? (tree.status === 'ready' ? tree.webMapKey : undefined) })
  }
  return (
    <Modal isOpen toggle={onCancel} backdrop="static" labelledBy={`${theme.id}-editor-heading`}
      style={{ width: '900px', maxWidth: 'calc(100vw - 32px)', margin: '4vh auto' }}>
      <div css={editorStyles}>
        <ModalHeader id={`${theme.id}-editor-heading`} toggle={onCancel}>{translate('configureTheme')}</ModalHeader>
        <div className="editor-body">
          <CalciteLabel>
            {translate('themeName')}
            <CalciteInput type="text" value={draft.name}
              onCalciteInputInput={(event) => { const name = event.target.value; setDraft((current) => ({ ...current, name })) }} />
          </CalciteLabel>
          <CalciteLabel>
            {translate('requester')}
            <CalciteInput type="text" value={draft.requester ?? ''}
              onCalciteInputInput={(event) => { const requester = event.target.value; setDraft((current) => ({ ...current, requester })) }} />
          </CalciteLabel>
          <CalciteLabel>{translate('themeLink')}<CalciteInput value={themeLink} readOnly /></CalciteLabel>
          <CalciteButton appearance="outline" kind="neutral" disabled={!themeLink} onClick={() => { void copyLink() }}>{translate('copyThemeLink')}</CalciteButton>
          <p>{translate('themeLinkHelp')}</p>
          {!themeLink && <p role="alert">{translate('invalidExperienceUrl')}</p>}
          {copyStatus && <p role="status">{translate(copyStatus)}</p>}
          {sources.length > 1 && <CalciteLabel>
            {translate('webMapSource')}
            <CalciteSelect label={translate('webMapSource')} value={source?.dataSourceId ?? ''}
              onCalciteSelectChange={(event) => setSourceId(event.target.value)}>
              {sources.map((entry) => <CalciteOption key={entry.dataSourceId} value={entry.dataSourceId}>{entry.label}</CalciteOption>)}
            </CalciteSelect>
          </CalciteLabel>}
          <h3>{translate('layerSelection')}</h3>
          <p>{translate('layerHelp')}</p>
          {!source && <p role="status">{translate('webMapOnly')}</p>}
          {tree.status === 'loading' && <CalciteLoader inline label={translate('loadingLayers')} />}
          {tree.status === 'error' && <p role="alert">{translate('layerLoadError')}</p>}
          {source && <CalciteButton appearance="outline" kind="neutral" disabled={tree.status === 'loading'}
            onClick={tree.reload}>{translate('reloadLayers')}</CalciteButton>}
          {tree.status === 'ready' && (differentMap ? <div>
            <p role="status">{translate('differentMap')}</p>
            <CalciteButton appearance="outline" kind="neutral" onClick={() => changeSelection([])}>
              {translate('useCurrentMap')}
            </CalciteButton>
          </div> : <div className="layer-section">
            {tree.nodes.length === 0 && <p>{translate('noLayers')}</p>}
            {(draft.selectedLayerKeys ?? []).some((key) => !available.has(key)) && <p role="status">{translate('missingLayers')}</p>}
            {!tree.partial && <WebMapReconcile theme={draft} nodes={tree.nodes} translate={translate} onChange={setDraft} />}
            <LayerTree nodes={tree.nodes} selected={draft.selectedLayerKeys ?? []}
              expandLabel={translate('expandGroup')} collapseLabel={translate('collapseGroup')} onChange={changeSelection} />
          </div>)}
          {tree.status === 'ready' && !differentMap && <ExternalEditor entries={draft.externalLayers ?? []} nodes={tree.nodes} translate={translate}
            onChange={(externalLayers) => setDraft((current) => ({ ...current, webMapKey: tree.webMapKey, externalLayers }))} />}
          {tree.partial && <p role="alert">{translate('partialTree')}</p>}
          {unresolved && tree.status === 'ready' && !tree.partial && <p role="alert">{translate('resolveBeforeApply')}</p>}
          {invalidServices && <p role="alert">{translate('invalidServices')}</p>}
        </div>
        <div className="editor-footer">
          <span>{translate('applyHint')}</span>
          <div className="footer-actions">
            <CalciteButton appearance="outline" kind="neutral" onClick={onCancel}>{translate('cancel')}</CalciteButton>
            <CalciteButton disabled={!canApply} onClick={apply}>{translate('apply')}</CalciteButton>
          </div>
        </div>
      </div>
    </Modal>
  )
}

const editorStyles = css`
  display: flex; flex-direction: column; height: min(780px, 90vh); min-height: 0;
  .modal-header { flex-shrink: 0; }
  .editor-body { flex: 1; min-height: 0; overflow: auto; padding: 20px; }
  .editor-footer { flex-shrink: 0; padding: 12px 20px; border-top: 1px solid currentColor; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .editor-footer > span { font-size: 12px; flex: 1; min-width: 180px; }
  .footer-actions { display: flex; flex-wrap: wrap; gap: 8px; }
  h3 { font-size: 18px; margin: 20px 0 8px; }
  calcite-label { color: inherit; --calcite-label-text-color: currentColor; }
  calcite-button[kind="neutral"] { color: inherit; --calcite-button-text-color: currentColor; --calcite-button-border-color: currentColor; --calcite-button-background-color: transparent; }
  .reference-issue { border: 1px solid currentColor; padding: 12px; margin: 12px 0; overflow-wrap: anywhere; }
  .external-entry { border: 1px solid currentColor; padding: 16px; margin: 16px 0; }
  .external-fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
  .external-fields > * { min-width: 0; }
  .layer-section { margin-top: 16px; }
  .layer-tree, .layer-tree ul { list-style: none; margin: 0; padding: 0; }
  .layer-tree ul { padding-left: 24px; }
  .layer-row { display: flex; align-items: flex-start; gap: 4px; margin: 8px 0; }
  .layer-choice { flex: 1; min-width: 0; --calcite-label-margin-bottom: 0; }
  .layer-choice span { overflow-wrap: anywhere; }
  .layer-spacer { width: 24px; flex-shrink: 0; }
`
