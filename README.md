# sc-gis-layer-views

Custom Widget für Experience Builder Developer Edition **1.17** und ArcGIS Enterprise **11.5**.

## Stand 0.6.2 — Externe WMS-/WMTS-Dienste pro Thema

Enthalten: Kartenverknüpfung, Themenverwaltung, Themenkarten und aufklappbarer Layerbaum pro Thema. Gruppen wählen rekursiv alle enthaltenen Layer; einzelne Layer können abgewählt werden. Teilweise ausgewählte Gruppen werden entsprechend markiert.
„Anzeigen“ ersetzt jetzt die Sichtbarkeit der operativen Kartenlayer durch die Themenauswahl. Reset stellt die gespeicherte WebMap-Sichtbarkeit wieder her. Zusätzliche WMS-/WMTS-Layer werden pro Thema konfiguriert, beim Anzeigen eingefügt und bei Themenwechsel oder Reset vollständig entfernt.

## Herunterladen und installieren

1. Auf GitHub den Branch `development` wählen und über **Code → Download ZIP** herunterladen.
2. ZIP entpacken; den Ordner `sc-gis-layer-views-development` in `sc-gis-layer-views` umbenennen.
3. Diesen Ordner unter `client/your-extensions/widgets/sc-gis-layer-views/` der bestehenden ExB-1.17-Installation ablegen. `manifest.json` muss direkt darin liegen, ohne zusätzliche Ordnerebene.
4. Die Developer Edition nach deren Installationsanleitung starten/neustarten. Das Widget „Layer-Themen“ hinzufügen und in seinen Einstellungen ein vorhandenes Karten-Widget auswählen.
5. Themen in den Widget-Einstellungen erstellen. Über „Thema konfigurieren“ den grossen Dialog öffnen, Namen bearbeiten und Layer auswählen. Gruppen mit dem Pfeil öffnen; die Gruppen-Checkbox wählt alle Kinder aus. „Übernehmen“ übernimmt den Entwurf, „Abbrechen“ verwirft ihn. Themen lassen sich im Settingspanel weiterhin duplizieren, sortieren und entfernen. Die Experience anschliessend speichern.

## Kompilieren und bereitstellen

Abhängigkeiten kommen aus der vollständigen ExB-1.17-Installation, nicht aus einem separaten npm-Projekt in diesem Widget. Im Verzeichnis `client` der installierten Developer Edition `npm run build:prod` ausführen. Den erzeugten Widget-Ordner unter `client/dist-prod/widgets/` anhand seines Namens lokalisieren und vollständig auf den IIS-Webserver kopieren. Nicht den TypeScript-Quellordner als fertiges Widget veröffentlichen.

Nach erfolgreicher Abnahme den freigegebenen Stand nach `production` übernehmen. Den HTTPS-Link zur gebauten `manifest.json` im ArcGIS Enterprise Portal als Experience-Builder-Widget registrieren. Webserver-CORS, HTTPS und Zugriff müssen zur Portalumgebung passen.

Der Nutzer hat Layerbaum, Anzeigen, Reset und den grossen Konfigurationsdialog in ExB bestätigt. **0.6.2 ist zur Abnahme auf development bereit.** Lokal ist kein vollständiges ExB-SDK installiert; Build und Dienst-Darstellung dieser Erweiterung sind noch auf der Zielinstallation zu prüfen.

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

Abnahme der Verwaltung: Mehrere Themen anlegen und umbenennen, mittleres Thema duplizieren und entfernen, erste/letzte Position sortieren, Experience speichern und neu laden. Einstellungen und Themenkarten müssen übereinstimmen. Änderungen an der Themenkonfiguration allein schalten keine Kartenlayer um.

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

Der Nutzer hat bestätigt, dass in 0.3.1 der Layerbaum erscheint und Layer ausgewählt werden können.

## Themen anzeigen und Reset 0.4.0

- Aktionen in der Themenliste werden sofort in die aktuelle Builder-Konfiguration übernommen. Seit 0.5.0 bleiben Änderungen im Konfigurationsdialog bis „Übernehmen“ ein Entwurf. Die Experience danach speichern und für die öffentliche Anwendung veröffentlichen.
- Beim Start werden nur die gespeicherten Standardwerte geladen. Die Karte wird nicht automatisch umgeschaltet.
- „Anzeigen“ aktiviert alle ausgewählten Layer und ihre übergeordneten Gruppen und deaktiviert die übrigen operativen Layer. MapImageLayer-Unterlayer werden einzeln berücksichtigt. Die Basemap bleibt unverändert.
- Gruppen werden für eine Themenauswahl auf unabhängige Sichtbarkeit gestellt, damit auch bisher exklusive oder geerbte Gruppen mehrere individuell gewählte Kinder zulassen. Reset stellt zusätzlich zu den Sichtbarkeiten die gespeicherten Gruppenmodi wieder her.
- Manuelle Änderungen im Standard-Layerlisten-Widget sind weiterhin möglich. Erneutes „Anzeigen“ stellt die konfigurierte Auswahl wieder her.
- Reset verwendet die beim Laden separat aus dem Portal gelesene WebMap, keinen Snapshot der möglicherweise schon manuell geänderten Laufzeitkarte.
- Kartenausschnitt, Massstab, Kamera und Zoom werden weder gesetzt noch angefahren.
- Falsche WebMap-Zuordnung, noch unkonfigurierte Themen oder fehlende benötigte Layer führen zu einer Meldung statt einer Teil-Umschaltung. Bei einem Schreibfehler wird die vorherige Sichtbarkeit wiederherzustellen versucht.
- Zusätzliche WMS-/WMTS-Dienste werden in diesem Stand noch nicht hinzugefügt. Ihre Entfernung bei Themenwechsel/Reset folgt zusammen mit dieser Funktion. Fremde, von anderen Widgets hinzugefügte Layer werden durch Reset nicht gelöscht.

Lokale Prüfung: Syntaxprüfung aller 14 TS-/TSX-Dateien sowie Logiktests für Gruppen, Unterlayer, Themenwechsel, leere Auswahl, wiederholtes Anzeigen, Reset einschliesslich Gruppenmodi, fehlende Layer und Rücknahme nach einem Schreibfehler erfolgreich. Kein vollständiger ExB-SDK-Build.

Abnahme in ExB: Zwei unterschiedliche Themen anzeigen, Sichtbarkeit in Karte und Standard-Layerliste vergleichen, einen Layer dort manuell ändern und dasselbe Thema erneut anzeigen. Danach Reset mit den gespeicherten WebMap-Defaults vergleichen. Währenddessen müssen Kartenausschnitt und Zoom gleich bleiben. Auch ein Thema mit verschachtelten Gruppen und Map-Service-Unterlayern prüfen.

## Dialog 0.5.0

Das Settingspanel zeigt die Kartenwahl und kompakte Themenkarten mit „Thema konfigurieren“. Der Jimu-UI-Dialog ist 900 Pixel breit, maximal Bildschirmbreite minus 32 Pixel. Er hat einen unabhängig scrollbareren Inhaltsbereich und einen sichtbaren Abschlussbereich. Der Dialog öffnet die zum Thema gehörende WebMap, sofern sie beim Karten-Widget konfiguriert ist.

„Übernehmen“ schreibt Name, WebMap-Zuordnung und Layerauswahl gemeinsam in die Builder-Konfiguration. „Abbrechen“, das Schliesskreuz und Escape schliessen ohne Übernahme. Ein Klick auf den Hintergrund schliesst den Dialog nicht versehentlich. Leere Namen sind nicht übernehmbar. Ein neu angelegtes Thema bleibt bei Abbrechen als unverändertes neues Thema in der Liste bestehen.

Verwendet werden `Modal` und `ModalHeader` aus `jimu-ui`. Die in den [ExB-1.17-Release-Notes](https://developers.arcgis.com/experience-builder/guide/1.17/whats-new/) entfernte Modal-Property `container` wird nicht verwendet. Die Builder-Seitenleiste und globale Modal-CSS-Regeln werden nicht überschrieben. Die bisherigen Calcite-Kontrastkorrekturen sind auch innerhalb des Dialogs lokal angebunden.

Prüfung: Syntaxprüfung und Logiktests inklusive unabhängiger Entwürfe, Abbrechen/erneutes Öffnen, gemeinsamer Übernahme und unveränderter übriger Themen erfolgreich. In ExB noch prüfen: Öffnen, Scrollen bei tiefen Gruppen, Tastaturfokus/Escape, Abbrechen, Übernehmen, erneut Öffnen, Speichern/Neuladen und Darstellung im dunklen Builder.

## Externe Dienste konfigurieren (0.6.0)

1. „Thema konfigurieren“ öffnen und unter dem Layerbaum „Dienst-Layer hinzufügen“ wählen.
2. WMS oder WMTS wählen, HTTPS-Dienstadresse eingeben und „Dienst laden“ anklicken. Bei WMTS den passenden Abfragemodus KVP oder REST wählen.
3. Einen angebotenen Layer wählen. Für mehrere Layer desselben Dienstes mehrere Einträge erstellen. Bei WMTS zusätzlich das Kachelraster wählen: Es muss dem Koordinatensystem der Karte entsprechen (beispielsweise EPSG:2056 für MN95).
4. Anzeigenamen, Zielgruppe und Position wählen. Vorhandene WebMap-Gruppen einschliesslich verschachtelter Gruppen sind möglich. Untergruppen innerhalb eines MapImage-Dienstes sind keine Container für externe Dienste.
5. „Beim Aktivieren dieses Themas sichtbar“ einschalten oder ausschalten. Ein ausgeschalteter Dienst wird beim Anzeigen ebenfalls hinzugefügt und ist anschliessend über die Standard-Layerliste einschaltbar. Bei Einträgen an derselben Position bestimmen die Pfeilaktionen ihre Reihenfolge.
6. „Übernehmen“ wählen und die Experience speichern. Abbrechen verwirft die Dienständerungen gemeinsam mit dem übrigen Themenentwurf.

Im Standard-Kartenlayer-Widget die Anzeige **zur Laufzeit hinzugefügter Layer** aktivieren. ExB 1.17 bietet diese Option; eine fest konfigurierte Layerauswahl kann neue Dienste ansonsten ausblenden.

Der Experience-Start bleibt unverändert. „Anzeigen“ lädt zunächst alle konfigurierten Dienste. Schlägt ein Dienst fehl, bleibt das bisherige Thema bestehen. Beim Themenwechsel werden dessen Dienste vollständig entfernt; Reset entfernt alle Dienste dieser Widget-Instanz und stellt die gespeicherte WebMap-Sichtbarkeit wieder her. Kartenausschnitt und Zoom bleiben unverändert. Andere Widgets hinzugefügte Layer werden nicht gelöscht. Beim Wechsel der verknüpften Karte oder Abbau der Widget-Instanz werden eigene Dienste ebenfalls entfernt.

Die Dienstadresse muss aus dem Browser erreichbar sein und dessen Zugriff erlauben (HTTPS, CORS, gegebenenfalls Anmeldung). Es werden keine separaten Zugangsdaten im Widget gespeichert. Bei WMTS wird ein nicht passendes Kachelraster mit einer Meldung abgelehnt; die Karte wird nicht auf ein anderes Koordinatensystem umgestellt.

### Abnahme dieser Erweiterung

- WMS und WMTS laden, konfigurieren, Experience speichern und neu laden.
- Je einen Dienst in der Hauptebene und einer verschachtelten Gruppe platzieren; Position und Namen in der Standard-Layerliste prüfen.
- Sichtbaren und zunächst ausgeschalteten Dienst prüfen. Letzteren über die Standard-Layerliste einschalten.
- Zwischen zwei Themen wechseln und dasselbe Thema mehrfach anzeigen: keine übrig gebliebenen Dienste oder Duplikate.
- Reset: gespeicherte WebMap-Sichtbarkeit, keine eigenen externen Dienste mehr, unveränderter Ausschnitt und Zoom.
- Ungültige Dienstadresse in einem weiteren Thema testen: verständliche Meldung und bisheriges Thema bleibt erhalten.

Lokal: `node tests/layer-selection.mjs` mit Node.js >=22.13 prüft die tatsächlichen reinen TypeScript-Module, einschliesslich Dienst-Lebenszyklus mit simulierten SDK-Collections. Die Netzwerk- und Darstellungsprüfung erfolgt in ExB.

## Korrektur 0.6.1

WMS-Unterlayer werden direkt aus der jeweils eigenen geladenen Dienstinstanz verwendet. Das unnötige Klonen entfällt und vermeidet einen möglichen SDK-4.32-Fehler bei fehlender Layer-Ausdehnung. Fehlermeldungen unterscheiden jetzt Laden, Vorbereiten und Anwenden der Dienste. Bestehende Themen müssen nicht neu konfiguriert werden.

Nach dem Aktualisieren und Kompilieren bitte dasselbe Thema erneut anzeigen und anschliessend Reset prüfen. Der konkrete Laufzeitfehler des gemeldeten WMS ist lokal nicht vollständig reproduziert; bei erneutem Fehler hilft die nun präzisere Meldung bei der Eingrenzung.

## Besteller und Speicherung (0.6.2)

Der Themendialog enthält ein optionales gemeinsames Textfeld „Besteller / E-Mail“, beispielsweise `Vorname Nachname, name@organisation.ch`. Übernehmen speichert es mit dem Themenentwurf; Abbrechen verwirft die Bearbeitung. Duplizieren übernimmt den Eintrag. Bestehende Themen bleiben kompatibel. Die Themenkarten zeigen das Feld nicht an.

Alle Themen stehen in der Experience-Konfiguration unter `widgets[widgetId].config.themes`. Die Datei `config.json` im Widget-Quellordner enthält nur die Ausgangskonfiguration. Individuelle Einstellungen werden über Esris `onSettingChange` an den Builder übergeben; danach die Experience speichern und für die Benutzer veröffentlichen. Im Portal gehören sie zum Experience-Item, bei Developer-Edition-Apps zu deren App-Konfigurationsdateien unter `server/public/apps/<appId>/`. Sie werden weder ins GitHub-Repository noch in die WebMap zurückgeschrieben.

Die Konfiguration wird mit der Experience geladen. Für Themenmetadaten ist dieser native Weg schlank und benötigt keine zusätzliche Datenbankabfrage. Karten- und Dienstladezeiten sind davon getrennt; insbesondere lädt das Widget beim Aktivieren die externen Dienste neu. Das Kontaktfeld wird zwar nur im Konfigurationsdialog angezeigt, ist als Teil der ausgelieferten App-Konfiguration technisch für berechtigte App-Benutzer einsehbar.

Vom Nutzer bestätigt: WMS-Aktivierung mit 0.6.1 funktioniert.
