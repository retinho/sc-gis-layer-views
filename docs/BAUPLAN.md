# Vereinbarter Bauplan und Abnahmestand

Stand: 1.0.0, 12. November 2026. Ziel: Experience Builder Developer Edition 1.17, ArcGIS Enterprise 11.5. Vom Betreiber ausdrücklich für den produktiven Einsatz freigegeben. Quellstand auf production und development, Release-Tag v1.0.0.

## Produktionsfreigabe 1.0.0

Der Betreiber hat den Portal-Test des Standes 0.8.4 (`4dcac94`) erfolgreich bestätigt, insbesondere den URL-Themenstart ohne Öffnen des Themenwidgets. Anschliessend wurde die Übernahme nach production ausdrücklich beauftragt. 1.0.0 übernimmt diese Laufzeitlogik unverändert; ausschliesslich Manifest-Version und Dokumentation werden aktualisiert. Der neue Quellstand ist für den Build mit ExB 1.17 freigegeben. Kompilierung und Bereitstellung des mit 1.0.0 bezeichneten Builds auf dem Webserver erfolgen durch den Betreiber; ein Git-Push ist kein Server-Deployment.

## Umgesetzte Funktionen

- Start mit unverändertem WebMap-Zustand, ohne ausgewähltes Thema und ohne externe Dienste.
- Ein Thema ersetzt die bisherige Sichtbarkeitsauswahl vollständig. Gruppen und verschachtelte WebMap-Gruppen werden berücksichtigt; benötigte Eltern werden eingeschaltet.
- Reset stellt die gespeicherte WebMap-Sichtbarkeit wieder her und entfernt eigene externe Dienste vollständig. Deren Konfiguration bleibt gespeichert. Themenwechsel entfernt die Dienste des bisherigen Themas.
- Überschreibbare Bundesdienst-URLs als Vorgabe; lokaler Filter nach Dienst-Layername und ID. Bestehende individuelle URLs bleiben erhalten.
- WMS-/WMTS-Layer gehören jeweils einem Thema. Der Admin wählt Dienst-Layer, Anzeigename, Zielgruppe, Position, Reihenfolge und Sichtbarkeit beim Aktivieren. WMTS erfordert ein zur Karte passendes Kachelraster.
- Externe Dienste können in echten WebMap-Gruppen platziert werden, nicht in Untergruppen eines MapImage- oder WMS-Dienstes.
- Themen erstellen, benennen, duplizieren, löschen, sortieren. Ein gemeinsamer Name je Thema; separate Experiences pro Sprache.
- Grosser Konfigurationsdialog mit Entwurf, Übernehmen und Abbrechen. Gruppenwahl wählt alle aktuellen Kinder; einzelne Kinder bleiben abwählbar.
- WebMap-Abgleich für veraltete Layer-, Gruppen- und Positionsreferenzen. Eindeutige IDs werden zur neuen Zuordnung angeboten; Mehrdeutigkeiten manuell auflösen. Neue Layer werden nicht automatisch ausgewählt.
- Optionales Besteller-/E-Mail-Feld; im Frontend Eigentümerhinweis beim Darüberfahren.
- Manuelle Sichtbarkeitsänderungen über die Standard-Layerliste bleiben möglich. Erneutes Anzeigen stellt das Thema wieder her.
- Kartenausschnitt und Zoom bleiben bei Auswahl und Reset unverändert.
- Widget-Inhalt ab „Themen“, Reset, Trennlinie und Themenkarten. Symbolleiste und Panel-Kopf kommen aus der Experience.
- Übersetzungen Deutsch (CH), Französisch und Englisch. Calcite/Jimu-UI und Theme-Farben.

## Stabilitätskorrekturen 0.7.1

1. Eigene externe Dienste werden vor Entfernen und Rollback in ihrem aktuellen Container gesucht, einschliesslich verschachtelter Gruppen und SDK-Elternreferenz. Eine Verschiebung zur Laufzeit verhindert die Bereinigung nicht mehr. Andere Layer werden nicht gelöscht.
2. WebMap-Metadaten werden mit `load()` gelesen; operative Layer werden einzeln geladen. Einzelne Ausfälle werden nach Pfad erfasst. Nicht betroffene Themen und Reset bleiben verfügbar. Themen mit ausgefallenen ausgewählten Layern oder externen Platzierungszielen werden ohne Kartenänderung abgewiesen.
3. Übernehmen ist gesperrt, solange ausgewählte Referenzen fehlen, externe Konfigurationen ungültig sind oder keine vollständig geladene passende WebMap-Struktur vorliegt. Bei Teilausfällen wird der Abgleich ausgeblendet, damit nicht verfügbare Sublayer nicht versehentlich als gelöscht bereinigt werden.

Bei Teilausfällen zeigt das Frontend einen Hinweis. Reset kann nur die gespeicherten Sichtbarkeiten wiederherstellen, deren Strukturen verfügbar sind; eigene externe Dienste werden trotzdem entfernt. Nicht verfügbare Sublayerdetails werden nicht erfunden. Nach Wiederherstellung des Dienstes die Experience neu laden; im Dialog genügt „Layerstruktur neu laden“. Ein nicht erreichbares WebMap-Item selbst bleibt ein blockierender Kartenladefehler.

## Bestätigt und noch offen

Der Nutzer hat Kompilierung und die bisherige Bedienung bestätigt, darunter Layerbaum, Gruppenwahl, Dialog, Anzeigen, Reset, WMS, mehrere externe Dienste und Positionierung. Zuletzt wurde der Portal-Test von 0.8.4 als erfolgreich bestätigt. Daraus folgt keine separate Bestätigung jedes unten aufgeführten Spezialfalls.

Lokale Regressionen prüfen Sichtbarkeit, Gruppenmodi, Entwürfe, Abgleich, Platzierungen, Themenwechsel, Fehler-Rollback, Besitzbereinigung und Teilausfälle. Isolierte Strict-Typprüfung gegen SDK 4.32 und Syntaxprüfung ergänzen diese Tests. Ein vollständiges ExB-SDK ist lokal nicht installiert.

Betriebs- und Regressionstestliste für künftige Änderungen (nicht jeder Spezialfall wurde separat vom Betreiber bestätigt):

- Freigegebenen Stand kompilieren; bestehende gespeicherte Experience öffnen, speichern und neu laden.
- Eigenen Dienst in eine andere Gruppe/Hauptebene verschieben; Reset und Themenwechsel ohne zurückbleibende Einträge.
- Nicht benötigten WebMap-Dienst ausfallen lassen: anderes Thema und Reset bleiben nutzbar, Hinweis erscheint. Betroffenes Thema wird ohne Kartenänderung abgewiesen. Nach Wiederherstellung neu laden.
- Fehlende Referenz im Dialog: Übernehmen gesperrt; Zuordnen/Entfernen löst die Sperre. Bei Ladefehlern keine Bereinigung, erst Struktur erneut laden.
- Reales WMTS mit EPSG:2056 sowie unpassendes Kachelraster; Startsichtbarkeit und Positionierung in verschachtelten Gruppen.
- Dark/Light, Deutsch/Französisch/Englisch, schmale Darstellung, Dialogbedienung und Eigentümerhinweis.
- Gebauten Stand über IIS/HTTPS im Portal mit normalem Benutzerkonto prüfen; Standard-Layerliste muss dynamisch hinzugefügte Layer anzeigen.

## Freigabeablauf

Die ausdrückliche Abnahme und Produktionsfreigabe für 1.0.0 liegen vor. Production enthält die freigegebenen Entwicklungsdateien für den Build auf dem ExB-Server; development wird auf demselben Freigabestand gehalten. Tag v1.0.0 kennzeichnet diesen Stand. Bestehenden Build und Experience-Konfiguration für Rückfall sichern. Git-Push, Serverbereitstellung und Portal-Abnahme sind getrennte Schritte.

Zusätzliche Abnahme 0.7.2: neuen Dienst hinzufügen, WMS-/WMTS-Vorgaben prüfen, eigene URL überschreiben, Dienst laden und nach Namen/ID filtern. Bestehende Auswahl muss beim Filtern erhalten bleiben.

Versionsanzeige 0.7.3: Der Admin-Einstellungsbereich zeigt die Version des geladenen Widget-Manifests oberhalb der Kartenauswahl.

## Erweiterung 0.8.0: Startthema und Teilen

- Eigener URL-Parameter `thema=<ID>` mit automatisch erzeugter stabiler Themen-ID; ohne Parameter unveränderter Start.
- Start über AppConfigProcessor im Hintergrund, auch bei geschlossener Themenansicht und standardmässig aktiver Layer-Liste.
- Einmalige Anwendung nach Bereitschaft der aktiven verknüpften Karte; kein erneutes Anwenden nach Reset oder manueller Auswahl. Ein neuer Seitenaufruf wertet den Parameter erneut aus.
- Gemeinsame Laufzeitverwaltung für Hintergrund und Panel, damit Reset auch automatisch hinzugefügte Dienste kennt. Bereinigung beim Kartenwechsel/Zerstören der View; Panels dürfen geschlossen werden, ohne das Thema zu entfernen.
- Vereinfachung 0.8.1: Nur automatische Themen-ID und „URL-Zusatz kopieren“ im Dialog. Keine Zieladresse oder Widget-ID konfigurieren. Die ID referenziert die gespeicherte/veröffentlichte Konfiguration.
- Ungültige oder nicht passende Themen verändern die Karte nicht. Hinweise werden im Themenwidget angezeigt. Hintergrund wartet höchstens zwei Minuten auf die Karte; bei späterem Laden kann das Themenwidget geöffnet werden.

Der Portal-Test mit geschlossenem Themenpanel wurde für 0.8.4 vom Betreiber als erfolgreich bestätigt.

Die folgenden Korrekturabschnitte sind historische Prüfstände. Frühere offene Freigabehinweise werden durch die Produktionsfreigabe 1.0.0 oben abgelöst.

## Korrektur Hintergrundstart 0.8.2

Der Manifest-Eintrag lautet jetzt `APP_CONFIG_PROCESSOR`, wie im offiziellen ExB-1.17-Beispiel. Der vorherige Wert `APP_CONFIG_PROCESSOR_EXTENSION` registrierte den Hintergrundstart nicht; deshalb wirkte nur der Fallback beim Öffnen des Panels. Eine Regression prüft nun auch den Manifest-Vertrag und das Vorhandensein des Erweiterungsmoduls.

Abnahme nach vollständigem Austausch einschliesslich manifest.json: Client neu starten, Experience speichern/veröffentlichen, Seite vollständig neu laden und mit `?thema=<ID>` bei geschlossenem Themenpanel testen. Standard-Layerliste bleibt geöffnet. Thema muss ohne Öffnen des Themenwidgets aktiv werden. Danach Reset sowie Start ohne Parameter prüfen. Vollständiger ExB-Build und Abnahme durch den Betreiber stehen aus.

## Hintergrundstart auf separatem Widget-Webserver (0.8.3)

0.8.2 startet laut Portal-Abnahme weiterhin erst beim Öffnen des Panels. Zwei Lücken im bisherigen Startpfad wurden korrigiert: `properties.notShareDynamicModules: true` hält dynamische Module im eigenen Widget-Ordner (statt im gemeinsamen `widgets/chunks`); vor dem Import der SDK-abhängigen Laufzeit wird die SDK-Bereitschaft über `loadArcGISJSAPIModules` hergestellt. Der Vorgang blockiert das Verarbeiten der App-Konfiguration nicht. Fehler werden mit `[sc-gis-layer-views] URL theme background startup failed` in der Browserkonsole ausgegeben.

Quelle: [Esri WidgetManifestProperties](https://developers.arcgis.com/experience-builder/api-reference/jimu-core/WidgetManifestProperties/) und SDK-Loader im offiziellen ExB-1.17-Beispiel `widgets/add-layers`. Regressionen prüfen private Chunks sowie Reihenfolge und Fehlerweitergabe beim Start. Ohne Zugriff auf den ausgelieferten Build und die Portal-Konsole ist die konkrete verbleibende Fehlerursache nicht abschliessend nachgewiesen.

Deployment: vollständigen Produktionsbuild des Widgets einschliesslich `chunks`, `extensions` und Manifest auf den Widget-Webserver übertragen. Experience speichern/veröffentlichen, Browsercache umgehen und URL-Thema bei geschlossenem Themenpanel prüfen. Falls es weiterhin nicht startet: Browserkonsole und Netzwerkfehler vor dem Öffnen des Panels prüfen (fehlendes Erweiterungsmodul, fehlender Chunk, SDK-Fehler). Vollständiger ExB-Build und Portal-Laufzeitabnahme stehen aus. Keine Produktionsfreigabe.

## Portal-Chunkpfad korrigiert (0.8.4)

Die Portal-Konsole aus der Abnahme von 0.8.3 belegt: Der Config-Processor läuft, aber der dynamische Import von `url-startup` fordert seinen Chunk unter `/portal/apps/experiencebuilder/cdn/378/widgets/sc-gis-layer-views/chunks/` an. Dort antwortet der Server mit 404/HTML; daraus folgen MIME-Fehler und ChunkLoadError. `notShareDynamicModules` allein korrigiert diesen Lade-Basispfad nicht.

Der Startimport nutzt jetzt `webpackMode: "eager"`: Laufzeitcode wird im Erweiterungsbundle mitgeliefert und erst nach SDK-Bereitschaft ausgeführt. Für diesen Import gibt es keinen separaten Chunk-Request mehr. Siehe [Webpack import modes](https://webpack.js.org/api/module-methods/#webpackmode). Keine Änderung von Portal-Dateien oder MIME-Konfiguration nötig.

Abnahme: vollständig neu bauen und Widget auf dem Webserver ersetzen, Cache umgehen, URL-Thema mit geschlossenem Panel starten. Im Netzwerk darf kein Request für `sc-gis-layer-views_src_runtime_url-startup_ts.js` mehr entstehen. Danach Anzeigen/Reset prüfen. Lokale Regressionen ersetzen keinen vollständigen ExB-Build oder Portal-Test; Produktionsfreigabe steht weiterhin aus.
