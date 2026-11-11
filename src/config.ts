import { type ImmutableObject } from 'jimu-core'

export interface ISavedView {
  id: string
  label: string
  urlData: string
}
export interface IConfig { predefinedViews: ISavedView[] }
export type IMConfig = ImmutableObject<IConfig>
