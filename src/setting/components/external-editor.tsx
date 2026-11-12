import { React } from 'jimu-core'
import { CalciteButton, CalciteInput, CalciteLabel, CalciteSelect, CalciteOption, CalciteCheckbox, CalciteLoader } from 'calcite-components'
import type { IExternalLayer } from '../../config'
import type { ILayerNode } from '../layer-selection'
import type messages from '../translations/default'
import { readServiceLayers } from '../../shared/external-services'
import type { IServiceLayerOption } from '../../shared/external-services'
import { isValidServiceUrl } from '../../shared/external-config'

type TTranslate = (key: keyof typeof messages) => string
interface IExternalEditorProps {
  entries: readonly IExternalLayer[]
  nodes: readonly ILayerNode[]
  translate: TTranslate
  onChange: (entries: IExternalLayer[]) => void
}
interface IExternalRowProps {
  entry: IExternalLayer
  nodes: readonly ILayerNode[]
  translate: TTranslate
  onChange: (entry: IExternalLayer) => void
}
function ExternalRow({ entry, nodes, translate, onChange }: IExternalRowProps): React.ReactElement {
  const [options, setOptions] = React.useState<IServiceLayerOption[]>([])
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'error' | 'empty'>('idle')
  const generation = React.useRef(0)
  React.useEffect(() => { generation.current += 1; setOptions([]); setStatus('idle'); return (): void => { generation.current += 1 } }, [entry.url, entry.type, entry.serviceMode])
  const load = async (): Promise<void> => {
    const request = ++generation.current
    setStatus('loading')
    try {
      const result = await readServiceLayers(entry)
      if (request !== generation.current) return
      setOptions(result); setStatus(result.length ? 'idle' : 'empty')
    } catch { if (request === generation.current) setStatus('error') }
  }
  const groups: { node: ILayerNode; label: string }[] = []
  const visit = (list: readonly ILayerNode[], parent: string): void => {
    list.forEach((node) => { const label = parent ? `${parent} / ${node.title}` : node.title; if (node.isGroup) groups.push({ node, label }); visit(node.children, label) })
  }
  visit(nodes, '')
  const siblings = entry.groupKey ? groups.find(({ node }) => node.key === entry.groupKey)?.node.children ?? [] : nodes
  const selected = options.find((option) => option.id === entry.layerId)
  const update = (patch: Partial<IExternalLayer>): void => onChange({ ...entry, ...patch })
  return (
    <div className="external-fields">
      <CalciteLabel>{translate('serviceType')}<CalciteSelect label={translate('serviceType')} value={entry.type}
        onCalciteSelectChange={(event) => update({ type: event.target.value === 'WMTS' ? 'WMTS' : 'WMS', layerId: '', tileMatrixSetId: undefined })}>
        <CalciteOption value="WMS">WMS</CalciteOption><CalciteOption value="WMTS">WMTS</CalciteOption>
      </CalciteSelect></CalciteLabel>
      <CalciteLabel>{translate('serviceUrl')}<CalciteInput type="url" value={entry.url}
        onCalciteInputInput={(event) => update({ url: event.target.value, layerId: '', tileMatrixSetId: undefined })} /></CalciteLabel>
      {entry.type === 'WMTS' && <CalciteLabel>{translate('serviceMode')}<CalciteSelect label={translate('serviceMode')} value={entry.serviceMode}
        onCalciteSelectChange={(event) => update({ serviceMode: event.target.value === 'RESTful' ? 'RESTful' : 'KVP', layerId: '', tileMatrixSetId: undefined })}>
        <CalciteOption value="KVP">KVP</CalciteOption><CalciteOption value="RESTful">REST</CalciteOption>
      </CalciteSelect></CalciteLabel>}
      <div><CalciteButton appearance="outline" kind="neutral" disabled={!isValidServiceUrl(entry.url) || status === 'loading'} onClick={() => { void load() }}>{translate('loadService')}</CalciteButton>
        {status === 'loading' && <CalciteLoader inline label={translate('loadingService')} />}
        {status === 'error' && <p role="alert">{translate('serviceLoadError')}</p>}
        {status === 'empty' && <p role="status">{translate('noServiceLayers')}</p>}
      </div>
      <CalciteLabel>{translate('serviceLayer')}<CalciteSelect label={translate('serviceLayer')} value={entry.layerId}
        onCalciteSelectChange={(event) => {
          const option = options.find((item) => item.id === event.target.value)
          if (option) update({ layerId: option.id, title: option.title, tileMatrixSetId: option.matrices[0]?.id })
        }}>
        <CalciteOption value="">{translate('chooseLayer')}</CalciteOption>
        {entry.layerId && !selected && <CalciteOption value={entry.layerId}>{entry.layerId}</CalciteOption>}
        {options.map((option) => <CalciteOption key={option.id} value={option.id}>{option.title} ({option.id})</CalciteOption>)}
      </CalciteSelect></CalciteLabel>
      {entry.type === 'WMTS' && <CalciteLabel>{translate('tileMatrix')}<CalciteSelect label={translate('tileMatrix')} value={entry.tileMatrixSetId ?? ''}
        onCalciteSelectChange={(event) => update({ tileMatrixSetId: event.target.value })}>
        <CalciteOption value="">{translate('chooseMatrix')}</CalciteOption>
        {entry.tileMatrixSetId && !selected && <CalciteOption value={entry.tileMatrixSetId}>{entry.tileMatrixSetId}</CalciteOption>}
        {selected?.matrices.map((matrix) => <CalciteOption key={matrix.id} value={matrix.id}>{matrix.id}{matrix.wkid ? ` (EPSG:${matrix.wkid})` : ''}</CalciteOption>)}
      </CalciteSelect></CalciteLabel>}
      <CalciteLabel>{translate('serviceTitle')}<CalciteInput value={entry.title} onCalciteInputInput={(event) => update({ title: event.target.value })} /></CalciteLabel>
      <CalciteLabel>{translate('targetGroup')}<CalciteSelect label={translate('targetGroup')} value={entry.groupKey ?? ''}
        onCalciteSelectChange={(event) => update({ groupKey: event.target.value || undefined, beforeLayerKey: undefined })}>
        <CalciteOption value="">{translate('rootLevel')}</CalciteOption>
        {entry.groupKey && !groups.some(({ node }) => node.key === entry.groupKey) && <CalciteOption value={entry.groupKey}>{translate('missingTarget')}</CalciteOption>}
        {groups.map(({ node, label }) => <CalciteOption key={node.key} value={node.key}>{label}</CalciteOption>)}
      </CalciteSelect></CalciteLabel>
      <CalciteLabel>{translate('layerPosition')}<CalciteSelect label={translate('layerPosition')} value={entry.beforeLayerKey ?? ''}
        onCalciteSelectChange={(event) => update({ beforeLayerKey: event.target.value || undefined })}>
        <CalciteOption value="">{translate('atBottom')}</CalciteOption>
        {entry.beforeLayerKey && !siblings.some((node) => node.key === entry.beforeLayerKey) && <CalciteOption value={entry.beforeLayerKey}>{translate('missingTarget')}</CalciteOption>}
        {siblings.map((node) => <CalciteOption key={node.key} value={node.key}>{translate('aboveLayer')}: {node.title}</CalciteOption>)}
      </CalciteSelect></CalciteLabel>
      <CalciteLabel layout="inline"><CalciteCheckbox checked={entry.visible} onCalciteCheckboxChange={(event) => update({ visible: event.target.checked })} />{translate('serviceVisible')}</CalciteLabel>
    </div>
  )
}

export function ExternalEditor({ entries, nodes, translate, onChange }: IExternalEditorProps): React.ReactElement {
  const move = (index: number, offset: number): void => {
    const next = [...entries]; const entry = next[index]; if (!entry) return
    next.splice(index, 1); next.splice(index + offset, 0, entry); onChange(next)
  }
  return <section>
    <h3>{translate('externalServices')}</h3><p>{translate('externalHelp')}</p>
    {entries.map((entry, index) => <div className="external-entry" key={entry.id}>
      <ExternalRow entry={entry} nodes={nodes} translate={translate} onChange={(next) => onChange(entries.map((item) => item.id === entry.id ? next : item))} />
      <div className="footer-actions">
        <CalciteButton scale="s" kind="neutral" appearance="outline" disabled={index === 0} onClick={() => move(index, -1)}>{translate('moveUp')}</CalciteButton>
        <CalciteButton scale="s" kind="neutral" appearance="outline" disabled={index === entries.length - 1} onClick={() => move(index, 1)}>{translate('moveDown')}</CalciteButton>
        <CalciteButton scale="s" kind="danger" appearance="transparent" onClick={() => onChange(entries.filter((item) => item.id !== entry.id))}>{translate('deleteTheme')}</CalciteButton>
      </div>
    </div>)}
    <CalciteButton appearance="outline" kind="neutral" onClick={() => onChange([...entries, {
      id: crypto.randomUUID(), type: 'WMS', url: '', title: '', layerId: '', serviceMode: 'KVP', visible: true
    }])}>{translate('addService')}</CalciteButton>
  </section>
}
