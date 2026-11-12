import { ImmutableObject } from 'jimu-core'

export interface ILayerTheme {
  id: string
  name: string
}

export interface IConfig {
  themes: ILayerTheme[]
}

export type IMConfig = ImmutableObject<IConfig>
