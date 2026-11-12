# Vereinbarter Bauplan

Ziel: Experience Builder Developer Edition 1.17, ArcGIS Enterprise 11.5.

- Start mit unverändertem WebMap-Zustand, ohne ausgewähltes Thema und ohne externe Dienste.
- Ein Thema ersetzt die bisherige Sichtbarkeitsauswahl vollständig.
- Gruppen und verschachtelte WebMap-Gruppen berücksichtigen; Eltern passend einschalten.
- Reset stellt die in der WebMap gespeicherte Sichtbarkeit wieder her und entfernt zusätzliche Dienste vollständig. Deren Konfiguration bleibt gespeichert.
- Themenwechsel entfernt externe Dienste des bisherigen Themas.
- WMS/WMTS-Dienste gehören jeweils genau einem Thema. Admin wählt nach URL-Eingabe angebotene Layer, Position (auch innerhalb von Gruppen), Reihenfolge und Sichtbarkeit beim Aktivieren des Themas.
- Admin verwaltet Themen: erstellen, benennen, duplizieren, löschen, sortieren.
- Ein gemeinsamer Themenname, da separate Experiences pro Sprache.
- Layerbaum mit Checkboxen: Gruppe wählt rekursiv alle Kinder; einzelne Kinder abwählbar, teilweise ausgewählte Gruppen darstellen.
- Manuelle Sichtbarkeitsänderungen im Standard-Layerlisten-Widget bleiben möglich. Erneutes Anzeigen stellt das Thema wieder her.
- Kartenausschnitt und Zoom bleiben bei Auswahl und Reset unverändert.
- Oberfläche beginnt bei „Themen“ mit Reset rechts, Trennlinie und weissen Themenkarten mit grauem Rahmen/Schatten, Name links, dunklem Anzeigen-Button rechts.
- Symbolleiste und Panel-Kopf kommen aus der Experience.
- UI-Texte Deutsch (CH), Französisch, Englisch; Calcite, Jimu-UI, SharedTheme und Light/Dark berücksichtigen.

## Ausbauschritte

1. Grundgerüst, Kartenbindung, Übersetzungen und Themenkarten (aktueller Stand).
2. Admin-Themenverwaltung und rekursiver Layerbaum.
3. Themenaktivierung und Reset anhand gespeicherter WebMap, ohne Kameraänderungen.
4. Externe WMS-/WMTS-Dienste und Positionierung.
5. Abnahme in ExB 1.17 inklusive Standard-Layerliste, Gruppen, Dark Mode, MN95 und Portal.

## Noch zu prüfen

Map-Service-Sublayer sind keine GroupLayer: Positionierung externer Dienste kann nur in echten Gruppen erfolgen. ExB-Layerlisten-Verhalten mit dynamisch ergänzten Diensten ist in der Zielumgebung zu verifizieren.
