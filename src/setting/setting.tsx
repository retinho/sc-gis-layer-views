import { React, Immutable } from 'jimu-core';
import { AllWidgetSettingProps } from 'jimu-for-builder';
import { SettingSection, MapWidgetSelector } from 'jimu-ui/advanced/setting-components';
import { Button, TextInput, Label } from 'jimu-ui';
import { IMConfig } from '../config';

export default function Setting(props: AllWidgetSettingProps<IMConfig>) {
  const { config, onSettingChange, id, useMapWidgetIds } = props;

  const addView = () => {
    const newView = { id: Date.now().toString(), label: 'Neue Sicht', urlData: '' };
    const views = config.predefinedViews ? config.predefinedViews.asMutable() : [];
    onSettingChange({ id, config: config.set('predefinedViews', Immutable([...views, newView])) });
  };

  const updateView = (index: number, field: string, value: string) => {
    let val = value;
    if (field === 'urlData' && value.includes('view_state=')) {
      val = value.split('view_state=')[1].split('&')[0]; 
    }
    const views = config.predefinedViews.asMutable({ deep: true });
    views[index][field] = val;
    onSettingChange({ id, config: config.set('predefinedViews', Immutable(views)) });
  };

  const deleteView = (index: number) => {
    const views = config.predefinedViews.asMutable();
    views.splice(index, 1);
    onSettingChange({ id, config: config.set('predefinedViews', Immutable(views)) });
  };

  return (
    <div className="setting-url-views p-3">
      <SettingSection title="Karten-Instanz">
        <MapWidgetSelector useMapWidgetIds={useMapWidgetIds} onSelect={(ids) => onSettingChange({ id, useMapWidgetIds: ids })} />
      </SettingSection>

      <SettingSection title="Sichten verwalten">
        <Button className="w-100 mb-3" type="primary" onClick={addView}>Ansicht hinzufügen</Button>
        {config.predefinedViews?.map((view, i) => (
          <div key={view.id} className="p-2 mb-3 border rounded bg-light" style={{color: '#000'}}>
            <Label>Bezeichnung</Label>
            <TextInput className="mb-2" value={view.label} onChange={e => updateView(i, 'label', e.target.value)} />
            <Label>View-Daten (Base64 oder URL)</Label>
            <TextInput className="mb-2" value={view.urlData} onChange={e => updateView(i, 'urlData', e.target.value)} />
            <Button size="sm" type="danger" className="w-100" onClick={() => deleteView(i)}>Löschen</Button>
          </div>
        ))}
      </SettingSection>
    </div>
  );
}