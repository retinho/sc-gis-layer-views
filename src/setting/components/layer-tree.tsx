import { React } from 'jimu-core'
import { CalciteButton, CalciteCheckbox, CalciteLabel } from 'calcite-components'
import { getSelectionState, toggleSelection } from '../layer-selection'
import type { ILayerNode } from '../layer-selection'

interface ILayerTreeProps {
  nodes: readonly ILayerNode[]
  selected: readonly string[]
  expandLabel: string
  collapseLabel: string
  onChange: (keys: string[]) => void
}

interface ILayerBranchProps extends Omit<ILayerTreeProps, 'nodes'> {
  node: ILayerNode
  selectedSet: ReadonlySet<string>
}

function LayerBranch(props: ILayerBranchProps): React.ReactElement {
  const { node, selected, selectedSet, onChange, expandLabel, collapseLabel } = props
  const [expanded, setExpanded] = React.useState(false)
  const state = getSelectionState(node, selectedSet)
  const hasChildren = node.children.length > 0
  return (
    <li>
      <div className="layer-row">
        {hasChildren ? (
          <CalciteButton scale="s" appearance="transparent" kind="neutral"
            iconStart={expanded ? 'chevron-down' : 'chevron-right'}
            label={`${expanded ? collapseLabel : expandLabel}: ${node.title}`}
            aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} />
        ) : <span className="layer-spacer" aria-hidden="true" />}
        <CalciteLabel layout="inline" className="layer-choice">
          <CalciteCheckbox checked={state.checked} indeterminate={state.indeterminate} disabled={state.disabled}
            onCalciteCheckboxChange={(event) => onChange(toggleSelection(node, selected, event.target.checked))} />
          <span>{node.title}</span>
        </CalciteLabel>
      </div>
      {hasChildren && expanded && (
        <ul>{node.children.map((child) => <LayerBranch {...props} key={child.key} node={child} />)}</ul>
      )}
    </li>
  )
}

export function LayerTree(props: ILayerTreeProps): React.ReactElement {
  const selectedSet = React.useMemo(() => new Set(props.selected), [props.selected])
  return (
    <ul className="layer-tree">
      {props.nodes.map((node) => <LayerBranch {...props} key={node.key} node={node} selectedSet={selectedSet} />)}
    </ul>
  )
}
