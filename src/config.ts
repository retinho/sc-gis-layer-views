import { ImmutableObject } from 'jimu-core'

export interface ILayerTheme {
  id: string
  name: string
  webMapKey?: string
  selectedLayerKeys?: readonly string[]
}

export interface IConfig {
  themes: ILayerTheme[]
}

export type IMConfig = ImmutableObject<IConfig>
