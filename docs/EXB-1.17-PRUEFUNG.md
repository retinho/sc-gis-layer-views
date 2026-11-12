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

## Korrektur 0.6.1: WMS-Unterlayer ohne unnötiges Klonen

Beim Anzeigen wurde der bereits geladene WMS-Unterlayer mit `clone()` kopiert. Die offizielle [SDK-4.32-Implementierung](https://js.arcgis.com/4.32/esri/layers/support/WMSSublayer.js) ruft darin bei vorhandenem Property `fullExtent.clone()` ohne Nullprüfung auf. Ein fehlender Extent kann deshalb eine Ausnahme verursachen. Da jede Dienstkonfiguration bereits eine eigene WMSLayer-Instanz erhält, wird nun der geladene Unterlayer direkt übernommen, wie im [Esri-Beispiel für WMSSublayer](https://developers.arcgis.com/javascript/latest/references/core/layers/support/WMSSublayer/) gezeigt. Damit bleiben auch Capabilities-Metadaten erhalten.

Der Nutzer meldet erfolgreiches Laden der angebotenen Layer von `https://wms.geo.admin.ch` im Dialog, aber einen Fehler beim Anzeigen. Die öffentlichen Capabilities wurden erfolgreich abgerufen (1068 benannte Layer; EPSG:2056 wird auf Hauptebene angeboten). Der konkrete vom Nutzer ausgewählte Layer und die ursprüngliche Ausnahme sind noch unbekannt; ein vollständiger Nachweis der Ursache in dessen ExB-Umgebung steht aus.

Regression mit fehlendem Extent und absichtlich fehlschlagender Clone-Methode bestanden; Auswahl, Metadatenerhalt, Kindersichtbarkeit, fehlender Layer und Koordinatensystemprüfung getestet. Bestehende Regressionen, Strict-Typprüfung der Dienstlogik gegen SDK 4.32 und Syntaxprüfung bestanden. Fehlertexte unterscheiden jetzt Capabilities-Laden, Layer-Vorbereitung und Kartenanwendung. ExB-Build und Wiederholung des konkreten Nutzerfalls stehen aus.

## Stabilitätskorrekturen 0.7.1

Die Prüfung von 0.7.0 zeigte einen reproduzierbaren Bereinigungsfehler nach einer Verschiebung eigener Layer zwischen Containern, eine globale Sperre bei einzelnen Dienst-Ausfällen und eine fehlende Übernahme-Sperre für veraltete Auswahlen. Diese Punkte sind in 0.7.1 korrigiert.

Die Bereinigung verwendet nun den aktuellen Layer-Container (SDK-parent beziehungsweise rekursive Gruppensuche). Die Ladephase trennt das Laden des WebMap-Items von einzelnen operativen Layern; Fehler werden mit ihrem Pfad erfasst. Eine fehlgeschlagene WebMap selbst bleibt blockierend. Teilweise geladene Strukturen werden nicht als Grundlage für eine endgültige Konfigurationsübernahme zugelassen. Details siehe Bauplan.

Regressionen für verschobene eigene Layer bei Reset/Themenwechsel/Abbau, Rollback an die tatsächliche Position, abgetrennte Gruppen, fehlende Reset-Sublayer und isolierte Ladefehler bestanden. Bestehende Regressionen ebenfalls bestanden. Isolierte Strict-Typprüfung der reinen Logik und SDK-Aufrufe gegen die offiziellen 4.32-Deklarationen sowie Syntaxprüfung aller Quelldateien bestanden. Keine lokale vollständige ExB-Kompilierung oder Browser-Abnahme behauptet.

## Erweiterung 0.8.0: URL-Start

Die Registrierung als `APP_CONFIG_PROCESSOR_EXTENSION` folgt dem offiziellen, versionsgebundenen 1.17-Beispiel `widgets/translation` (weiterhin Referenzcommit `16ccec0c21cfff1cb66e283eacaafc326ed6b95c`). Die [Esri-Dokumentation zu Extension Points](https://developers.arcgis.com/experience-builder/guide/extension-points/) beschreibt die Ausführung nach dem Laden der App-Konfiguration und vor den Widgets. Builder-Ausnahme über `window.jimuConfig.isInBuilder` wie im Beispiel.

Die aktive Karte wird über Jimu-Redux-MapView-Informationen und `MapViewManager.getJimuMapViewById` gefunden; der 1.17-MapView-Beispielcode verwendet den Manager ebenfalls. Es werden keine Panels geöffnet und keine Standardwidget-Konfigurationen verändert. Der eigene Query-Parameter wird über die Browser-URL-API gelesen; es werden keine nicht dokumentierten Esri-URL-Kommandos erfunden.

Controller-/Beobachter-Regressionen und Syntaxprüfung bestanden. Die isolierte Strict-Prüfung verwendet offizielle SDK-4.32-Typen und eine minimale typisierte JimuMapView-Schnittstelle für die verwendeten View-Felder; dies ist keine vollständige ExB-Typprüfung. Der komplette Build, das Laden der Extension im Enterprise-Portal, die Clipboard-Funktion und das Startverhalten im konkreten Layout bleiben Zielsystem-Abnahmen.
