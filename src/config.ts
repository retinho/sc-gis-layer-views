import { ImmutableObject } from 'jimu-core'

export interface IExternalLayer {
  id: string
  type: 'WMS' | 'WMTS'
  url: string
  title: string
  layerId: string
  serviceMode: 'KVP' | 'RESTful'
  tileMatrixSetId?: string
  groupKey?: string
  beforeLayerKey?: string
  visible: boolean
}

export interface ILayerTheme {
  id: string
  name: string
  requester?: string
  webMapKey?: string
  selectedLayerKeys?: readonly string[]
  externalLayers?: readonly IExternalLayer[]
}

export interface IConfig {
  themes: ILayerTheme[]
}

export type IMConfig = ImmutableObject<IConfig>
