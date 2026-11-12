# sc-gis-layer-views

Custom Widget für Experience Builder Developer Edition **1.17** und ArcGIS Enterprise **11.5**.

## Stand 0.3.1 — Layerauswahl pro Thema

Enthalten: Kartenverknüpfung, Themenverwaltung, Themenkarten und aufklappbarer Layerbaum pro Thema. Gruppen wählen rekursiv alle enthaltenen Layer; einzelne Layer können abgewählt werden. Teilweise ausgewählte Gruppen werden entsprechend markiert.
Noch nicht enthalten: Themenaktivierung, Reset und externe Dienste. Anzeigen und Reset sind deshalb bewusst deaktiviert. Es werden keine Kartendaten oder Sichtbarkeiten verändert.

## Herunterladen und installieren

1. Auf GitHub den Branch `development` wählen und über **Code → Download ZIP** herunterladen.
2. ZIP entpacken; den Ordner `sc-gis-layer-views-development` in `sc-gis-layer-views` umbenennen.
3. Diesen Ordner unter `client/your-extensions/widgets/sc-gis-layer-views/` der bestehenden ExB-1.17-Installation ablegen. `manifest.json` muss direkt darin liegen, ohne zusätzliche Ordnerebene.
4. Die Developer Edition nach deren Installationsanleitung starten/neustarten. Das Widget „Layer-Themen“ hinzufügen und in seinen Einstellungen ein vorhandenes Karten-Widget auswählen.
5. Themen in den Widget-Einstellungen erstellen, benennen und die gewünschten Layer auswählen. Gruppen mit dem Pfeil öffnen. Die Gruppen-Checkbox wählt alle Kinder aus. Themen lassen sich duplizieren, sortieren und entfernen. Die Experience anschliessend speichern.

## Kompilieren und bereitstellen

Abhängigkeiten kommen aus der vollständigen ExB-1.17-Installation, nicht aus einem separaten npm-Projekt in diesem Widget. Im Verzeichnis `client` der installierten Developer Edition `npm run build:prod` ausführen. Den erzeugten Widget-Ordner unter `client/dist-prod/widgets/` anhand seines Namens lokalisieren und vollständig auf den IIS-Webserver kopieren. Nicht den TypeScript-Quellordner als fertiges Widget veröffentlichen.

Nach erfolgreicher Abnahme den freigegebenen Stand nach `production` übernehmen. Den HTTPS-Link zur gebauten `manifest.json` im ArcGIS Enterprise Portal als Experience-Builder-Widget registrieren. Webserver-CORS, HTTPS und Zugriff müssen zur Portalumgebung passen.

Dieser Zwischenstand ist **nicht produktionsreif**. Build und visuelle Abnahme von 0.3.1 in ExB 1.17 stehen aus; lokal ist kein vollständiges ExB-SDK installiert. Die Vorgängerversion 0.2.1 wurde vom Nutzer als funktionierend bestätigt.

## Branches

- `development`: laufende Entwicklung und Download für die Abnahme.
- `production`: nur freigegebene Stände; derzeit leer.
- `main`: ursprünglicher leerer Ausgangsstand.

Fachliche Festlegungen: [Bauplan](docs/BAUPLAN.md).

Technische Referenzen: [Kartenbindung](https://developers.arcgis.com/experience-builder/guide/use-map-widget-in-widget/), [Calcite in ExB](https://www.esri.com/arcgis-blog/products/experience-builder/developers/optimizing-custom-widgets-in-arcgis-experience-builder-with-jimu-ui-calcite-and-map-components).

## Prüfung gegen Esri 1.17

Quellenvergleich und Korrekturen sind im [Prüfbericht](docs/EXB-1.17-PRUEFUNG.md) dokumentiert. Als feste Referenz dienen die offiziellen Esri-Beispiele im Branch `1.17`, Commit `16ccec0c21cfff1cb66e283eacaafc326ed6b95c`. Die mit ExB gelieferten Bibliotheken unverändert verwenden; keine aktuelle Calcite-/React-Version separat installieren.

## Themenverwaltung 0.2.0

Namen und Reihenfolge werden in der Widget-Konfiguration gespeichert und direkt in den Themenkarten angezeigt. Duplizieren erzeugt eine eigene ID und setzt die Kopie hinter das Original. Sortieren erfolgt mit Nach oben / Nach unten. Leere Namen sind beim Bearbeiten erlaubt und sollten vor dem Speichern ausgefuellt werden.

Abnahme: Mehrere Themen anlegen und umbenennen, mittleres Thema duplizieren und entfernen, erste/letzte Position sortieren, Experience speichern und neu laden. Einstellungen und Themenkarten muessen uebereinstimmen. Anzeigen und Reset bleiben deaktiviert; die Karte wird nicht veraendert.

Das Grundgerüst 0.1.1 und die Themenverwaltung wurden vom Nutzer in ExB als funktionierend bestätigt.

## Korrektur 0.2.1

Die neutralen Verwaltungsbuttons und das Label des Themennamens erben jetzt die Textfarbe des Builder-Einstellungsbereichs. Dadurch verwenden sie im dunklen Builder nicht mehr die dunkle Calcite-Standardtextfarbe. Deaktivierte Sortierbuttons bleiben deaktiviert und werden weiterhin von Calcite abgeschwaecht. Die rote Loeschen-Aktion bleibt erhalten.

Vom Nutzer bestätigt: Die Kontrastkorrektur 0.2.1 funktioniert.

## Layerbaum 0.3.0

- Grundlage ist die gespeicherte WebMap aus der Datenquellen-Konfiguration des verknüpften Karten-Widgets. Zum Lesen wird eine separate WebMap ohne eigene MapView geladen. Die laufende Karte bleibt unverändert.
- WebMap-Gruppen, Untergruppen und MapImageLayer-Unterlayer werden aufgelöst. Andere operative Layer werden als ganze Layer angeboten; Basemap und Tabellen sind nicht Teil der Themenauswahl.
- Jede Auswahl speichert Portal/WebMap-ID und vollständige Layer-ID-Pfade, nicht den angezeigten Namen. Gleiche Namen und gleiche Unterlayer-IDs in verschiedenen Diensten bleiben unterscheidbar.
- Duplizieren kopiert auch die Layerauswahl. Bestehende Themen ohne Auswahl bleiben kompatibel.
- Ein Kartenwechsel übernimmt keine Auswahl stillschweigend in eine andere WebMap. Der Admin kann ein betroffenes Thema ausdrücklich auf die aktuelle WebMap umstellen; dabei wird seine alte Auswahl geleert.
- „Layerstruktur neu laden“ liest nach gespeicherten Änderungen an der WebMap erneut. Ladefehler und fehlende Layer überschreiben keine gespeicherten Verweise.
- Bei nicht erreichbaren Ressourcen kann die WebMap-Ladung fehlschlagen. Zugriff prüfen und erneut laden. Eine aktive Kartenansicht wird zum Konfigurieren nicht mehr benötigt.

### Prüfung

Lokale Syntaxprüfung aller TS-/TSX-Dateien und Tests der Auswahl-/Baumlogik erfolgreich. Der Adapter wurde anhand der von Esri veröffentlichten [Maps-SDK-4.32-Typdefinitionen](https://unpkg.com/@arcgis/core@4.32/interfaces.d.ts) geprüft. Die neue Settings-Abhängigkeit `jimu-arcgis` ist im Manifest eingetragen.

Die unabhängigen Logiktests lassen sich mit Node.js ab 22.13 ausführen: `node tests/layer-selection.mjs`. Sie prüfen verschachtelte Gruppen, Teil-Auswahl, Abwählen, leere Gruppen, stabile IDs, Reihenfolge, unveränderte Eingabedaten und das Beibehalten fehlender gespeicherter Verweise. Das ersetzt keinen ExB-SDK-Build.

In ExB prüfen: Gruppe wählen, Untergruppe öffnen, ein Kind abwählen, Teil-Markierung der Eltern kontrollieren; Thema duplizieren; Experience speichern und erneut öffnen. Anschliessend Kartenwechsel, „Layerstruktur neu laden“ sowie dunklen Builder prüfen. Die Karte und ihr Zoom dürfen sich dabei nicht verändern.

## Korrektur 0.3.1: WebMap im Einstellungsbereich

Der Nutzer meldete in 0.3.0 trotz ausgewaehlter Karte die Aufforderung, eine gespeicherte 2D-WebMap zu waehlen. Die bisherige Pruefung des Live-Kartenobjekts mit `instanceof WebMap` wies die Karte zurueck. Settings verwenden jetzt die konfigurierten `useDataSources` des Karten-Widgets aus `appStateInBuilder.appConfig`. Portal und Item-ID kommen aus `appConfig.dataSources`. Dadurch entfallen sowohl die Klassenpruefung als auch das Warten auf eine aktive MapView. Bei mehreren WebMaps bietet der Einstellungsbereich eine Auswahl an. Gespeicherte Themenauswahlen werden nicht geloescht.

Grundlagen im offiziellen Esri-Branch 1.17: [Builder-Konfiguration lesen](https://github.com/Esri/arcgis-experience-builder-sdk-resources/blob/16ccec0c21cfff1cb66e283eacaafc326ed6b95c/widgets/message-subscriber/src/actions/query-action-setting.tsx), [ReactRedux.useSelector](https://github.com/Esri/arcgis-experience-builder-sdk-resources/blob/16ccec0c21cfff1cb66e283eacaafc326ed6b95c/widgets/control-the-widget-state/src/runtime/widget.tsx), [DataSource-Metadaten](https://github.com/Esri/arcgis-experience-builder-sdk-resources/blob/16ccec0c21cfff1cb66e283eacaafc326ed6b95c/widgets/data-source-widgets/server-side-output/src/setting/setting.tsx).

Abnahme: Bestehende Experience mit ausgewaehltem Karten-Widget oeffnen. Unter einem Thema muss der Bereich Layerauswahl nach dem Laden den Baum zeigen. Eine aktive Kartenansicht ist dafuer nicht erforderlich. Der ExB-Build und diese visuelle Kontrolle stehen fuer 0.3.1 noch aus.
