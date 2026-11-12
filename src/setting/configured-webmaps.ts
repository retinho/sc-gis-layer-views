export interface IConfiguredWebMap {
  dataSourceId: string
  itemId: string
  portalUrl?: string
  label: string
}

interface IMapReference {
  dataSourceId: string
  mainDataSourceId?: string
  rootDataSourceId?: string
}

interface IMapSource {
  id: string
  type: string
  itemId?: string
  portalUrl?: string
  label?: string
}

export function resolveConfiguredWebMaps(
  references: readonly IMapReference[] | undefined,
  dataSources: Readonly<Record<string, IMapSource | undefined>> | undefined,
  webMapType: string
): IConfiguredWebMap[] {
  const result: IConfiguredWebMap[] = []
  for (const reference of references ?? []) {
    const ids = [reference.dataSourceId, reference.mainDataSourceId, reference.rootDataSourceId]
    const source = ids.map((id) => id ? dataSources?.[id] : undefined)
      .find((entry) => entry?.type === webMapType && Boolean(entry.itemId))
    if (!source?.itemId || result.some((entry) => entry.dataSourceId === source.id)) continue
    result.push({ dataSourceId: source.id, itemId: source.itemId, portalUrl: source.portalUrl, label: source.label || source.itemId })
  }
  return result
}
