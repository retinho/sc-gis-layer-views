export type ExternalLayerPosition = 'bottom' | 'top'
export type ExternalLayerVisibility = 'saved' | 'visible' | 'hidden'
export interface IViewOptions {
  externalLayerPosition?: ExternalLayerPosition
  externalLayerVisibility?: ExternalLayerVisibility
}
