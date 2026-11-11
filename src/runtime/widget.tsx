import { React, type AllWidgetProps } from 'jimu-core';
import { JimuMapViewComponent, type JimuMapView } from 'jimu-arcgis';
import { Button, TextArea, Label } from 'jimu-ui';
import WMSLayer from 'esri/layers/WMSLayer';
import WMTSLayer from 'esri/layers/WMTSLayer';
import { type IMConfig } from '../config';

export default function Widget(props: AllWidgetProps<IMConfig>) {
  const { config, useMapWidgetIds } = props;
  const [jmv, setJmv] = React.useState<JimuMapView>(null);
  const [generatedUrl, setGeneratedUrl] = React.useState('');

  React.useEffect(() => {
    if (jmv) {
      const params = new URLSearchParams(window.location.search);
      const data = params.get('view_state');
      if (data) applyViewState(data);
    }
  }, [jmv]);

  const onActiveViewChange = (jimuMapView: JimuMapView) => {
    if (jimuMapView) setJmv(jimuMapView);
  };

  const captureCurrentState = () => {
    if (!jmv) return;
    const map = jmv.view.map;

    const state = {
      internal: map.allLayers
        .filter(l => !l.id.startsWith('sc_ext_') && !l.id.includes('basemap'))
        .map(l => ({ id: l.id, visible: l.visible }))
        .toArray(),
      external: map.layers
        .filter(l => l.id.startsWith('sc_ext_') || l.type === 'wms' || l.type === 'wmts')
        .map((l: any) => ({
          url: l.url,
          title: l.title,
          type: l.type.toUpperCase(),
          opacity: l.opacity,
          sublayers: l.sublayers ? l.sublayers.map(s => ({ name: s.name, title: s.title })).toArray() : []
        }))
        .toArray()
    };

    const base64 = btoa(JSON.stringify(state));
    const fullUrl = `${window.location.origin}${window.location.pathname}?view_state=${base64}`;
    setGeneratedUrl(fullUrl);
    navigator.clipboard.writeText(fullUrl);
  };

  const applyViewState = (base64Data: string) => {
    try {
      const state = JSON.parse(atob(base64Data));
      const map = jmv.view.map;

      state.internal.forEach(s => {
        const l = map.findLayerById(s.id);
        if (l) l.visible = s.visible;
      });

      const oldExt = map.layers.filter(l => l.id.startsWith('sc_ext_')).toArray();
      map.removeMany(oldExt);

      state.external.forEach((ext, i) => {
        const layerProps = {
          url: ext.url,
          id: `sc_ext_${Date.now()}_${i}`,
          title: ext.title,
          opacity: ext.opacity,
          sublayers: ext.sublayers
        };
        const newLayer = ext.type === 'WMTS' ? new WMTSLayer(layerProps) : new WMSLayer(layerProps);
        map.add(newLayer);
      });
    } catch (e) {
      console.error("View-Status konnte nicht geladen werden", e);
    }
  };

  return (
    <div className="widget-url-serializer jimu-widget p-3" style={{ backgroundColor: '#fff', overflowY: 'auto' }}>
      <JimuMapViewComponent useMapWidgetId={useMapWidgetIds?.[0]} onActiveViewChange={onActiveViewChange} />
      
      <div className="admin-section border-bottom pb-3 mb-3">
        <Label className="font-weight-bold">Admin: Sicht generieren</Label>
        <Button className="w-100 mb-2" type="primary" onClick={captureCurrentState}>
          Aktuelle Sicht als URL kopieren
        </Button>
        {generatedUrl && (
          <TextArea readOnly value={generatedUrl} style={{ height: '80px', fontSize: '12px' }} />
        )}
      </div>

      <div className="user-section">
        <Label className="font-weight-bold">Vordefinierte Ansichten</Label>
        {config.predefinedViews?.map((view) => (
          <Button key={view.id} className="w-100 mb-2" type="default" onClick={() => applyViewState(view.urlData)}>
            {view.label}
          </Button>
        ))}
      </div>
    </div>
  );
}