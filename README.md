# sc-gis-layer-views

Custom Widget für Experience Builder Developer Edition **1.17** und ArcGIS Enterprise **11.5**.

## Stand 0.2.1 — Grundgerüst

Enthalten: Karten-Widget-Auswahl, Kartenanbindung, lokalisierte Oberfläche, Themenkarten-Komponente und leere Standardkonfiguration.
Noch nicht enthalten: Layerbaum, Themenaktivierung, Reset und externe Dienste. Anzeigen und Reset sind deshalb bewusst deaktiviert. Es werden keine Kartendaten oder Sichtbarkeiten verändert.

## Herunterladen und installieren

1. Auf GitHub den Branch `development` wählen und über **Code → Download ZIP** herunterladen.
2. ZIP entpacken; den Ordner `sc-gis-layer-views-development` in `sc-gis-layer-views` umbenennen.
3. Diesen Ordner unter `client/your-extensions/widgets/sc-gis-layer-views/` der bestehenden ExB-1.17-Installation ablegen. `manifest.json` muss direkt darin liegen, ohne zusätzliche Ordnerebene.
4. Die Developer Edition nach deren Installationsanleitung starten/neustarten. Das Widget „Layer-Themen“ hinzufügen und in seinen Einstellungen ein vorhandenes Karten-Widget auswählen.
5. Themen lassen sich jetzt direkt in den Widget-Einstellungen erstellen, benennen, duplizieren, sortieren und entfernen. Die Experience anschliessend speichern. Die Startkonfiguration enthält keine Beispielthemen. Für eine reine Layout-Vorschau können vor dem Hinzufügen des Widgets in `config.json` Themenobjekte mit `id` und `name` eingetragen werden; dies schaltet noch keine Layer.

## Kompilieren und bereitstellen

Abhängigkeiten kommen aus der vollständigen ExB-1.17-Installation, nicht aus einem separaten npm-Projekt in diesem Widget. Im Verzeichnis `client` der installierten Developer Edition `npm run build:prod` ausführen. Den erzeugten Widget-Ordner unter `client/dist-prod/widgets/` anhand seines Namens lokalisieren und vollständig auf den IIS-Webserver kopieren. Nicht den TypeScript-Quellordner als fertiges Widget veröffentlichen.

Nach erfolgreicher Abnahme den freigegebenen Stand nach `production` übernehmen. Den HTTPS-Link zur gebauten `manifest.json` im ArcGIS Enterprise Portal als Experience-Builder-Widget registrieren. Webserver-CORS, HTTPS und Zugriff müssen zur Portalumgebung passen.

Dieser erste Zwischenstand ist **nicht produktionsreif**. Ein Build und eine visuelle Abnahme in ExB 1.17 stehen aus; lokal ist kein ExB-SDK installiert.

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

Das Grundgeruest 0.1.1 wurde vom Nutzer in ExB ohne sichtbare Fehler bestaetigt. Fuer 0.2.0 steht der Build in ExB 1.17 noch aus.

## Korrektur 0.2.1

Die neutralen Verwaltungsbuttons und das Label des Themennamens erben jetzt die Textfarbe des Builder-Einstellungsbereichs. Dadurch verwenden sie im dunklen Builder nicht mehr die dunkle Calcite-Standardtextfarbe. Deaktivierte Sortierbuttons bleiben deaktiviert und werden weiterhin von Calcite abgeschwaecht. Die rote Loeschen-Aktion bleibt erhalten.

Vom Nutzer bestaetigt: Themenverwaltung 0.2.0 funktioniert; Kontrastfehler im dunklen Builder gemeldet. 0.2.1 lokal auf JSON und Diff geprueft; visuelle Abnahme in ExB steht aus.
