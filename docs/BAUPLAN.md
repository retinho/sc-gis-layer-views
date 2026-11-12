# Vereinbarter Bauplan und Abnahmestand

Stand: 0.7.1 auf development, 12. November 2026. Ziel: Experience Builder Developer Edition 1.17, ArcGIS Enterprise 11.5. Keine Produktionsfreigabe erteilt.

## Umgesetzte Funktionen

- Start mit unverändertem WebMap-Zustand, ohne ausgewähltes Thema und ohne externe Dienste.
- Ein Thema ersetzt die bisherige Sichtbarkeitsauswahl vollständig. Gruppen und verschachtelte WebMap-Gruppen werden berücksichtigt; benötigte Eltern werden eingeschaltet.
- Reset stellt die gespeicherte WebMap-Sichtbarkeit wieder her und entfernt eigene externe Dienste vollständig. Deren Konfiguration bleibt gespeichert. Themenwechsel entfernt die Dienste des bisherigen Themas.
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

Der Nutzer hat Kompilierung und die bisherige Bedienung bestätigt, darunter Layerbaum, Gruppenwahl, Dialog, Anzeigen, Reset, WMS, mehrere externe Dienste und Positionierung. Zuletzt wurde der Stand 0.7.0 als funktionierend gemeldet. Daraus folgt keine separate Bestätigung jedes unten aufgeführten Spezialfalls.

Lokale Regressionen prüfen Sichtbarkeit, Gruppenmodi, Entwürfe, Abgleich, Platzierungen, Themenwechsel, Fehler-Rollback, Besitzbereinigung und Teilausfälle. Isolierte Strict-Typprüfung gegen SDK 4.32 und Syntaxprüfung ergänzen diese Tests. Ein vollständiges ExB-SDK ist lokal nicht installiert.

Vor Freigabe auf dem Zielsystem prüfen:

- 0.7.1 kompilieren; bestehende gespeicherte Experience öffnen, speichern und neu laden.
- Eigenen Dienst in eine andere Gruppe/Hauptebene verschieben; Reset und Themenwechsel ohne zurückbleibende Einträge.
- Nicht benötigten WebMap-Dienst ausfallen lassen: anderes Thema und Reset bleiben nutzbar, Hinweis erscheint. Betroffenes Thema wird ohne Kartenänderung abgewiesen. Nach Wiederherstellung neu laden.
- Fehlende Referenz im Dialog: Übernehmen gesperrt; Zuordnen/Entfernen löst die Sperre. Bei Ladefehlern keine Bereinigung, erst Struktur erneut laden.
- Reales WMTS mit EPSG:2056 sowie unpassendes Kachelraster; Startsichtbarkeit und Positionierung in verschachtelten Gruppen.
- Dark/Light, Deutsch/Französisch/Englisch, schmale Darstellung, Dialogbedienung und Eigentümerhinweis.
- Gebauten Stand über IIS/HTTPS im Portal mit normalem Benutzerkonto prüfen; Standard-Layerliste muss dynamisch hinzugefügte Layer anzeigen.

## Freigabeablauf

Development enthält die Entwicklungsdateien für den Build auf dem ExB-Server. Erst nach ausdrücklicher Abnahme Version 1.0.0 festlegen, geprüften Commit nach production übernehmen und als Release kennzeichnen. Bestehenden Build und Experience-Konfiguration für Rückfall sichern. Git-Push, Serverbereitstellung und Portal-Abnahme sind getrennte Schritte.
