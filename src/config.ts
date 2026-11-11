import { type ImmutableObject } from 'jimu-core'

import { type IViewOptions } from './runtime/utils/view-options'

export interface ISavedView extends IViewOptions {
  id: string
  label: string
  urlData: string
}
export interface IConfig { predefinedViews: ISavedView[] }
export type IMConfig = ImmutableObject<IConfig>
