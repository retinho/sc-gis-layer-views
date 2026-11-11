# SC-GIS Layer Views

Custom Widget für **ArcGIS Enterprise 11.5 / Experience Builder Developer Edition 1.17 / ArcGIS Maps SDK 4.32**.

Das Widget speichert die Sichtbarkeit der operativen Layer sowie WMS-/WMTS-Dienste in einem teilbaren Link. Vordefinierte Ansichten werden im Einstellungsbereich gepflegt. Version 1.1.0 verbessert das bestehende Verhalten; Kartenausschnitt, Zoom und Layer-Reihenfolge sind weiterhin nicht Bestandteil einer gespeicherten Ansicht.

## Kompilieren und bereitstellen

1. Diesen Widget-Ordner nach `client/your-extensions/widgets/sc-gis-layer-views` der **Developer Edition 1.17** kopieren. Die Test-Abhängigkeiten werden für den Widget-Build nicht benötigt.
2. Den Entwicklungsserver bei neu hinzugefügten Dateien neu starten. Im Builder ein Karten-Widget auswählen und das Widget testen.
3. Im Verzeichnis `client` mit dem Build-Skript der Developer Edition kompilieren (`npm run build:prod`).
4. Den vollständigen generierten Widget-Ordner aus `client/dist/widgets/sc-gis-layer-views` auf dem Webserver bereitstellen, einschliesslich Manifest, Runtime, Settings und Übersetzungen. Nicht nur die TSX-Quelldateien hochladen.
5. Die HTTPS-URL der gehosteten `manifest.json` als Custom-Widget-Element im Enterprise-Portal verwenden. Beim Update dieselbe Widget-Identität beibehalten. Die Hosting-Konfiguration muss den Zugriff vom Portal erlauben (CORS).
6. Nach dem Update eine bestehende Experience und eine neu angelegte Experience prüfen. Browser-/Webserver-Caches bei Bedarf aktualisieren.

React, Jimu, ArcGIS und Calcite werden aus der Developer Edition verwendet. Keine zusätzlichen Laufzeitbibliotheken in den Widget-Ordner installieren. Calcite-Komponenten werden über den vom Host bereitgestellten Einstieg `calcite-components` importiert.

## Verhalten und Kompatibilität

- Sichtbar ausgewählte Unterlayer aktivieren beim Wiederherstellen alle übergeordneten WebMap-Gruppen, auch bei verschachtelten Gruppen und abweichender Reihenfolge der gespeicherten Einträge. Eine Unterlayer-Auswahl hat Vorrang vor einem gespeicherten `visible: false` der Eltern-Gruppe. Nur explizit ausgewählte Layer öffnen ihre Gruppen. Neue Ansichten speichern die Sichtbarkeit unter Berücksichtigung ausgeblendeter Eltern, damit ein ausgeschalteter Gruppenbaum beim erneuten Öffnen ausgeschaltet bleibt. Die SDK-Gruppenmodi `inherited` und `exclusive` bleiben erhalten: vererbte Gruppen schalten ihre Kinder gemeinsam, exklusive Gruppen erlauben nur einen direkten Unterlayer.

- Neue Ansichtslinks verwenden ein versioniertes JSON-Format (`version: 2`) und UTF-8/Base64url. Vorhandene App-Parameter, insbesondere `id`, sowie der URL-Hash bleiben erhalten.
- Historische Base64-Links ohne Versionsfeld sowie vollständig eingefügte URLs werden weiterhin gelesen. Bei alten WMTS-Links fehlt die aktive Layer-/Style-Auswahl; diese Information kann nachträglich nicht rekonstruiert werden. Solche Ansichten neu speichern.
- Vorhandene OGC-Layer werden über ID und Dienst-URL wiederverwendet. Alte Links ohne IDs werden pro Dienst einmal über Typ und URL zugeordnet. Basemaps und Ground-Layer werden nicht erfasst.
- Neue Dienste werden vor Kartenänderungen geladen. Fehlgeschlagene Lade- oder WMTS-Auswahlprüfungen lassen die bisherige Ansicht bestehen. Bei Kartenwechsel oder Unmount werden verspätete Ergebnisse verworfen.
- Vom Widget hinzugefügte Dienste tragen das Präfix `sc_ext_`. Dieses Präfix ist reserviert. Beim Wechsel der Ansicht werden nicht mehr benötigte, vom Widget hinzugefügte OGC-Layer auf oberster Kartenebene entfernt und freigegeben. Andere Layer werden nicht entfernt.
- Mehrere Widget-Instanzen auf derselben Karte teilen sich deren Zustand. Die zuletzt angeforderte Wiederherstellung gewinnt.
- WMS speichert Sichtbarkeit, Deckkraft und den Sublayer-Baum. WMTS speichert zusätzlich aktive Layer-ID, Style, Tile-Matrix-Set, Bildformat und den Dienstmodus. Benutzerdefinierte Dienstparameter, zeitabhängige Einstellungen und andere Layertypen werden nicht als neue externe Dienste rekonstruiert.
- Wiederhergestellte externe Dienste, die in der Zielkarte fehlen, werden auf oberster Kartenebene hinzugefügt. Eine fehlende Gruppenstruktur wird nicht nachgebildet.
- Ist die Zwischenablage nicht verfügbar, bleibt die erzeugte URL zum manuellen Kopieren sichtbar. Sehr grosse Zustände werden abgelehnt; Browser, Proxy und Webserver können bereits deutlich kürzere URL-Limits haben.
- Die Funktion zur Link-Erstellung ist für alle Nutzer sichtbar. Die frühere Beschriftung «Admin» war keine Berechtigungsprüfung.
- Die Oberflächen enthalten Englisch, Deutsch mit Schweizer Schreibweise und Französisch. Für Deutsch wird das Experience-Builder-Sprachpaket `de` verwendet. Eigene Namen vordefinierter Ansichten werden nicht automatisch übersetzt.
- Das Widget verwendet `JimuMapViewComponent`, weil es direkt den Zustand der ausgewählten Karte verändert. Es führt keine Feature-Abfragen durch und benötigt dafür keine zusätzliche DataSource-Abstraktion. Geometrien werden nicht transformiert; ein WMTS-Tile-Matrix-Set muss zur Zielkarte passen.

## Struktur

- `src/runtime/utils/view-state.ts`: Datenformat, Validierung, Kodierung und URL-Verarbeitung ohne SDK-Abhängigkeiten.
- `src/runtime/utils/map-state.ts`: Erfassen und Wiederherstellen des Kartenzustands.
- `src/runtime/hooks/use-map-views.ts`: Kartenbereitschaft, asynchrone Vorgänge, Zwischenablage und Benutzerstatus.
- `src/runtime/widget.tsx`: Laufzeitoberfläche.
- `src/setting/setting.tsx`: Kartenauswahl und vordefinierte Ansichten.
- `src/theme.ts`: Anbindung der Calcite-Farben an das Experience-Builder-Theme.

## Automatisierte Prüfungen

Optional, unabhängig vom Widget-Build, im Ordner `tests`:

```sh
npm install
npm test
```

Der Testlauf kompiliert die beiden Logikmodule mit `strict: true` gegen die Typen des Maps SDK **4.32.12** und führt Node-Tests aus. Die Karten-Tests nutzen kleine SDK-Doubles für Map-Mutationen und asynchrone Abläufe. Sie ersetzen weder einen SDK-Rendering-Test noch den vollständigen Developer-Edition-Build. Die Tests benötigen Node.js mit dem integrierten Test-Runner (zum Beispiel Node 20).

## Abnahme in Developer Edition und Enterprise

- [ ] Vollständiger Produktionsbuild in Developer Edition 1.17 ohne TypeScript-/Bundlerfehler.
- [ ] Fehlende Kartenauswahl und alte Konfiguration ohne `predefinedViews`.
- [ ] Ansichten hinzufügen, ändern und löschen; vollständige URLs und ungültige Daten eingeben.
- [ ] WMS mit Unterebenen; WMTS mit mehreren Styles/Tile-Matrix-Sets; Zielkarte in MN95.
- [ ] Dieselbe Ansicht mehrfach aktivieren: keine zusätzlichen Duplikate.
- [ ] Einen Dienst absichtlich unerreichbar machen: bestehende Ansicht bleibt bestehen.
- [ ] Während des Ladens Karte wechseln beziehungsweise Widget entfernen.
- [ ] Alten Link öffnen, neue URL mit Umlauten teilen und in einer veröffentlichten Experience öffnen.
- [ ] Zwischenablage verweigern und URL manuell kopieren.
- [ ] Tastaturbedienung, Screenreader-Rückmeldungen, schmales Panel und helles/dunkles App-Theme.
- [ ] Deutsche, französische und englische Oberfläche in Runtime und Settings.
- [ ] Gehostetes Widget im Enterprise-Portal laden; geschützte Dienste mit den üblichen Nutzerrechten prüfen.

## Referenzen

- [Esri: Release-Versionen für Enterprise 11.5](https://doc.arcgis.com/en/experience-builder/11.5/get-started/about-versions.htm)
- [Esri: Calcite in eigenen Widgets](https://developers.arcgis.com/documentation/app-builders/low-code/arcgis-experience-builder/calcite-components-in-a-custom-widget/)
- [Esri: Einbindung des Karten-Widgets](https://developers.arcgis.com/experience-builder/guide/use-map-widget-in-widget/)
