# Prüfung des Grundgerüsts gegen ExB 1.17

Prüfdatum: 12. November 2026. Widget-Version: 0.1.1.

## Referenz und Grenzen

Primäre Quellcode-Referenz ist Esris offizieller Branch `1.17`, festgehalten auf Commit [`16ccec0c21cfff1cb66e283eacaafc326ed6b95c`](https://github.com/Esri/arcgis-experience-builder-sdk-resources/tree/16ccec0c21cfff1cb66e283eacaafc326ed6b95c). Nicht der veränderliche `master`-Branch.

Dies ist ein Dokumentations- und Quellcodevergleich, kein erfolgreicher SDK-Build. Lokal fehlen die vollständige Developer Edition, deren Typdeklarationen und Node.js. TypeScript-/Webpack-Kompilierung, visuelle Übereinstimmung, SharedTheme-Verhalten und Portal-Laufzeit sind daher noch nicht abgenommen. Die öffentlichen Beispiele liefern nicht alle SDK-Typdeklarationen; insbesondere vollständige Props-Kompatibilität ist erst im SDK-Build nachgewiesen.

## Befunde

| Bereich | Ergebnis und Massnahme | Versionsbezogener Beleg |
| --- | --- | --- |
| Manifest | `name`, `type`, `version`, `exbVersion`, `translatedLocales` passen zum Muster. `exbVersion` bleibt `1.17.0`; eigene Widget-Version ist unabhängig davon `0.1.1`. | [demo-function/manifest.json](https://github.com/Esri/arcgis-experience-builder-sdk-resources/blob/16ccec0c21cfff1cb66e283eacaafc326ed6b95c/widgets/demo-function/manifest.json) |
| Runtime / Settings | Funktionskomponenten, `AllWidgetProps`, `AllWidgetSettingProps`, `IMConfig`, `src/runtime/widget.tsx` und `src/setting/setting.tsx` entsprechen der Struktur. | [demo-function](https://github.com/Esri/arcgis-experience-builder-sdk-resources/tree/16ccec0c21cfff1cb66e283eacaafc326ed6b95c/widgets/demo-function) |
| Kartenbindung | `MapWidgetSelector` speichert `useMapWidgetIds` über `onSettingChange`. Runtime verwendet `JimuMapViewComponent` und `onActiveViewChange`. Es wird keine zweite Karte erzeugt. `jimu-arcgis` bleibt als Runtime-Abhängigkeit deklariert. Settings importieren selbst kein `jimu-arcgis`, deshalb derzeit keine zusätzliche `settingDependency`. | [get-map-coordinates-function](https://github.com/Esri/arcgis-experience-builder-sdk-resources/tree/16ccec0c21cfff1cb66e283eacaafc326ed6b95c/widgets/get-map-coordinates-function) |
| Calcite | Import von `CalciteButton` aus `calcite-components` ist bereits in 1.17 vorgesehen und bleibt unverändert. Keine separate Installation und keine React-19-Webcomponent-Annahme. | [use-calcite-components](https://github.com/Esri/arcgis-experience-builder-sdk-resources/tree/16ccec0c21cfff1cb66e283eacaafc326ed6b95c/widgets/use-calcite-components) |
| Übersetzungen | `default.ts` und `System.register` für DE/FR stimmen mit dem Beispiel überein. Settings importieren jetzt ihre eigene Default-Datei statt der Runtime-Datei. | [demo-function/src](https://github.com/Esri/arcgis-experience-builder-sdk-resources/tree/16ccec0c21cfff1cb66e283eacaafc326ed6b95c/widgets/demo-function/src) |
| Theme | Nicht belegte CSS-Namen `--sys-color-on-surface`, `--sys-color-surface`, `--sys-color-outline` entfernt. Farben/Schrift werden nun aus `props.theme.body`, `surfaces[1]` und `border` abgeleitet, wie im 1.17-Theme-Modell vorhanden. Die Styles werden bei Theme-Wechsel neu berechnet. Diese für 1.17 belegten Felder werden nicht durch neuere Paper-/Surface-APIs ersetzt. | [demo-theme/variables.json](https://github.com/Esri/arcgis-experience-builder-sdk-resources/blob/16ccec0c21cfff1cb66e283eacaafc326ed6b95c/themes/demo-theme/variables.json), [Theme-Typ und Emotion](https://github.com/Esri/arcgis-experience-builder-sdk-resources/blob/16ccec0c21cfff1cb66e283eacaafc326ed6b95c/themes/demo-theme/style.ts) |
| Button-Styling | Statt allgemeiner Calcite-Farbwerte nun die in Calcite 3.0.3 dokumentierten `--calcite-button-background-color`, `--calcite-button-text-color`, `--calcite-button-corner-radius`. Dunkler Anzeigen-Button bleibt gemäss Vorlage. Zugänglicher Name wird über die dokumentierte `label`-Property gesetzt. | [Calcite 3.0.3 Button-CSS](https://github.com/Esri/calcite-design-system/blob/0b0b89f593ad0748c8b6d994c792e58e0703366e/packages/calcite-components/src/components/button/button.scss), [Button-Properties](https://github.com/Esri/calcite-design-system/blob/0b0b89f593ad0748c8b6d994c792e58e0703366e/packages/calcite-components/src/components/button/button.tsx) |
| Widget-Container | Die in den 1.17-Beispielen verwendete Klasse `jimu-widget` ergänzt; `box-sizing: border-box` verhindert zusätzliche Höhe durch Padding. | [Calcite-Widget](https://github.com/Esri/arcgis-experience-builder-sdk-resources/blob/16ccec0c21cfff1cb66e283eacaafc326ed6b95c/widgets/use-calcite-components/src/runtime/widget.tsx) |
| Build / Portal | `npm run build:prod` im ExB-Verzeichnis `client`, Ausgabe unter `client/dist-prod/widgets`, Hosting und Registrierung per Manifest entsprechen der Enterprise-11.5-Anleitung. | [Enterprise 11.5: Add custom widgets](https://doc.arcgis.com/en/experience-builder/11.5/configure-widgets/add-custom-widgets.htm) |

## Versionszuordnung und widersprüchliche Esri-Angaben

Die [Esri-Versionstabelle](https://developers.arcgis.com/experience-builder/guide/release-versions/) ordnet ExB 1.17 Enterprise 11.5, Maps SDK 4.32, React 18, Calcite 3.0.3 und empfohlenem Node.js 22 zu. Die separate [Calcite-Integrationsseite](https://developers.arcgis.com/documentation/app-builders/low-code/arcgis-experience-builder/calcite-components-in-a-custom-widget/) nennt dagegen Calcite 3.1.0 für ExB 1.17. Wegen dieser Abweichung wird keine eigene Calcite-Version festgeschrieben oder nachinstalliert. Massgeblich ist die mit der tatsächlichen ExB-1.17-Installation ausgelieferte `calcite-components`-Einbindung; die hier verwendeten Button-Eigenschaften sind bereits in 3.0.3 vorhanden.

## Durchgeführte lokale Prüfungen

- JSON-Dateien geparst, Manifestname mit Ordnername verglichen.
- Übersetzungsschlüssel in allen sechs Sprachdateien auf Vollständigkeit/Gleichheit geprüft.
- `git diff --check` ohne Befund.
- Import-/Ordnerstruktur und verwendete Grundmuster mit oben verlinkten 1.17-Quellen verglichen.

## Noch erforderliche SDK-Abnahme

- Build mit der vollständigen ExB-1.17-Installation, ohne Fehler und ohne zusätzliche Bibliotheksinstallation.
- Widget im Builder auffindbar; Karte wählen, speichern, neu laden.
- DE/FR/EN in Runtime und Settings; fehlende Karte und leere Themenliste.
- Helles/dunkles Experience-Theme sowie verwendetes SharedTheme prüfen; sichtbare, lesbare Buttons und Karten bei schmalem Panel.
- Derzeit deaktivierte Buttons verändern weder Karte noch Kameraposition.

Es wurden ausschliesslich Korrekturen am Grundgerüst vorgenommen. Themenverwaltung, Sichtbarkeitsschaltung und externe Dienste bleiben spätere Schritte.

## Erweiterung 0.6.0: externe Dienste pro Thema

- Native `esri/layers/WMSLayer` und `WMTSLayer`, keine zusätzliche Laufzeitbibliothek. Capabilities werden über `load()` gelesen; die temporären Vorschauobjekte werden danach zerstört.
- WMS-Auswahl über `allSublayers` / `findSublayerByName`, WMTS über `sublayers`, `tileMatrixSets` und `activeLayer`. Referenzen: [WMSLayer](https://developers.arcgis.com/javascript/latest/references/core/layers/WMSLayer/), [WMTSLayer](https://developers.arcgis.com/javascript/latest/references/core/layers/WMTSLayer/).
- Versionsprüfung der Dienst- und Sitzungslogik mit den offiziellen `@arcgis/core@4.32`-Deklarationen (`interfaces.d.ts`) und TypeScript 5.7.3 im Strict-Modus: keine Fehler. Für diesen isolierten Test wurden ausschliesslich die Modulnamen auf die offiziellen SDK-Typen abgebildet und `ImmutableObject` als Readonly-Typ ersetzt. Dies ersetzt keinen vollständigen ExB-Build.
- Bestehende Gruppen werden über `GroupLayer.layers` verwendet, niemals über Gruppen eines MapImage-Dienstes. Die SDK-Reihenfolge ist unten nach oben; die Konfiguration beschreibt die sichtbare Listenreihenfolge oben nach unten.
- Sichtbare zusätzliche Kinder aktivieren ihre übergeordneten Gruppen. Beim Reset werden die gespeicherten Gruppenmodi und Sichtbarkeiten wiederhergestellt.
- Vor einer Änderung werden alle neuen Dienste geladen. Bei einem Ladefehler bleibt die bisherige Karte erhalten. Neue Objekte werden bei Fehlern oder verworfenen asynchronen Aufträgen zerstört.
- Eigene Layer werden anhand ihrer Objektidentität verwaltet. Themenwechsel, Reset und Abbau der Widget-Instanz entfernen eigene Dienste; andere hinzugefügte Layer werden nicht gelöscht.
- [Esri Release Notes 1.17](https://developers.arcgis.com/experience-builder/guide/1.17/whats-new/) beschreiben die Option des Map-Layers-Widgets, zur Laufzeit hinzugefügte Layer anzuzeigen. Diese Option im verwendeten Standardwidget aktivieren.
- Automatisierte Regressionen: Position in Gruppen und Hauptebene, Reihenfolge, Startsichtbarkeit, übergeordnete Gruppen, erneutes Anzeigen ohne Duplikate, Themenwechsel, Reset, Fremdlayer-Erhalt, fehlende Ziele, Ladefehler, Abbruch während des Ladens und unabhängige Dialogentwürfe.
- TypeScript-/TSX-/JavaScript-Syntaxprüfung bestanden. Vollständiger ExB-Build und Darstellung realer WMS-/WMTS-Dienste sind auf der Zielinstallation zu prüfen.
