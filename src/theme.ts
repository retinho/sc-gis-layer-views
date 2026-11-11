import { type React } from 'jimu-core'

interface ICalciteThemeStyle extends React.CSSProperties {
  '--calcite-color-brand': string
  '--calcite-color-brand-hover': string
  '--calcite-color-brand-press': string
  '--calcite-color-text-1': string
  '--calcite-color-foreground-1': string
}
/** Use the host theme instead of shipping a separate Calcite theme or runtime. */
export const calciteThemeStyle: ICalciteThemeStyle = {
  '--calcite-color-brand': 'var(--sys-color-primary-main)',
  '--calcite-color-brand-hover': 'var(--sys-color-primary-dark)',
  '--calcite-color-brand-press': 'var(--sys-color-primary-dark)',
  '--calcite-color-text-1': 'var(--sys-color-surface-paper-text)',
  '--calcite-color-foreground-1': 'var(--sys-color-surface-paper)',
  color: 'var(--sys-color-surface-paper-text)',
  backgroundColor: 'var(--sys-color-surface-paper)'
}
