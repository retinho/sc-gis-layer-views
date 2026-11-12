import { React } from 'jimu-core'
import { CalciteButton, CalciteLabel, CalciteSelect, CalciteOption } from 'calcite-components'
import type { ILayerTheme } from '../../config'
import type { ILayerNode } from '../layer-selection'
import type messages from '../translations/default'
import { referenceIssues, referenceLabel, resolveReference } from '../reconcile'
import type { IReferenceIssue } from '../reconcile'

type TTranslate = (key: keyof typeof messages) => string
interface IProps { theme: ILayerTheme; nodes: readonly ILayerNode[]; translate: TTranslate; onChange: (theme: ILayerTheme) => void }
interface IRowProps { issue: IReferenceIssue; translate: TTranslate; onResolve: (key?: string) => void }
function ReferenceRow({ issue, translate, onResolve }: IRowProps): React.ReactElement {
  const [replacement, setReplacement] = React.useState('')
  const suggested = issue.matches.length === 1 ? issue.matches[0] : undefined
  return <div className="reference-issue">
    <strong>{translate(issue.kind === 'selection' ? 'layerSelection' : issue.kind === 'group' ? 'targetGroup' : 'layerPosition')}: {issue.label}</strong>
    {issue.kind !== 'selection' && <div>{referenceLabel(issue.key)}</div>}
    <p>{translate(suggested ? 'referenceMoved' : issue.matches.length > 1 ? 'referenceAmbiguous' : 'referenceMissing')}{suggested ? ` ${suggested.label}` : ''}</p>
    {suggested && <CalciteButton scale="s" kind="neutral" appearance="outline" onClick={() => onResolve(suggested.key)}>{translate('acceptMoved')}</CalciteButton>}
    <CalciteLabel>{translate('assignReference')}
      <CalciteSelect label={translate('assignReference')} value={replacement} onCalciteSelectChange={(event) => setReplacement(event.target.value)}>
        <CalciteOption value="">{translate('chooseLayer')}</CalciteOption>
        {issue.options.map((option) => <CalciteOption key={option.key} value={option.key}>{option.label}</CalciteOption>)}
      </CalciteSelect>
    </CalciteLabel>
    <div className="footer-actions">
      <CalciteButton scale="s" disabled={!replacement} onClick={() => onResolve(replacement)}>{translate('assignReference')}</CalciteButton>
      <CalciteButton scale="s" kind="danger" appearance="transparent" onClick={() => onResolve()}>{translate(issue.kind === 'selection' ? 'removeReference' : issue.kind === 'group' ? 'moveToRootBottom' : 'moveToBottom')}</CalciteButton>
    </div>
  </div>
}
export function WebMapReconcile({ theme, nodes, translate, onChange }: IProps): React.ReactElement {
  const issues = referenceIssues(theme, nodes)
  return <section aria-label={translate('webMapReconcile')}>
    <h3>{translate('webMapReconcile')}</h3>
    <p>{translate('reconcileHelp')}</p>
    {issues.length === 0 ? <p role="status">{translate('referencesValid')}</p> : issues.map((issue) =>
      <ReferenceRow key={`${issue.kind}-${issue.entryId ?? ''}-${issue.key}`} issue={issue} translate={translate}
        onResolve={(replacement) => onChange(resolveReference(theme, issue, replacement))} />)}
  </section>
}
