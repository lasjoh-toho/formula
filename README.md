# Formeleditor für Moodle

Der Formeleditor aus der Pinnwand als Formel-Knopf für die beiden Moodle-Texteditoren:

| Plugin | Editor | Moodle | Ordner in Moodle |
| --- | --- | --- | --- |
| `tiny_formula` | TinyMCE | 4.1 und neuer | `lib/editor/tiny/plugins/formula` |
| `atto_formula` | Atto | 3.9 bis 4.4 (seit 4.3 nicht mehr Standard) | `lib/editor/atto/plugins/formula` |

## Wie es funktioniert

- Der Knopf **Formel** (Σ) öffnet einen Dialog mit dem Formeleditor (Symbolleiste, Vorschau, LaTeX-Quelltext, Umformen und Rechnen).
- Eingefügt wird LaTeX im Text: `\( … \)` für Formeln im Satz, `\[ … \]` für Formeln auf eigener Zeile (Kästchen „Auf eigener Zeile darstellen").
- Steht der Cursor in einer Formel (`\( \)`, `\[ \]` oder `$$ $$`), öffnet der Knopf diese Formel zum Bearbeiten.
- **Anzeige im Kurs:** übernimmt Moodles Filter **MathJax** (oder „TeX-Notation"), der genau diese Trennzeichen erkennt. Den Filter unter *Website-Administration → Plugins → Filter* aktivieren. Ohne Filter bleibt der LaTeX-Text sichtbar, es geht nichts verloren.
- Der Editor und KaTeX (lokal mitgeliefert, keine Verbindung ins Internet) laden erst beim ersten Klick auf den Knopf.

## Installation

1. Aus dem [Release „latest"](../../releases/tag/latest) `tiny_formula.zip` und/oder `atto_formula.zip` laden.
2. In Moodle unter *Website-Administration → Plugins → Plugin installieren* hochladen (oder den Ordner `formula` an die Stelle in der Tabelle kopieren).
3. TinyMCE: Der Knopf erscheint in der Werkzeugleiste und im Menü *Einfügen*. Wer die Werkzeugleiste angepasst hat, ergänzt `tiny_formula/tiny_formula` unter *Website-Administration → Plugins → Texteditoren → TinyMCE → Werkzeugleiste*.
4. Atto: Unter *Atto-Werkzeugleisteneinstellungen* eine Zeile wie `insert = link, media, formula` ergänzen.

## Aufbau des Repos

- `shared/web/` – der gemeinsame Teil: Formeleditor (`formeleditor/`), KaTeX (`katex/`) und der Dialog (`formula-dialog.js`, `.css`).
- `tiny/formula/` – das TinyMCE-Plugin (AMD-Module in `amd/src`).
- `atto/formula/` – das Atto-Plugin (YUI-Modul in `yui/src/button`).
- `tools/build.js` kopiert `shared/web` in beide Plugins (`web/`) und erzeugt `amd/build` und `yui/build`. Die gebauten Dateien sind eingecheckt, damit die Ordner direkt installierbar sind. Nach Änderungen: `npm install && npm run build`, dann `npm test`.
- Bei jedem Push auf `main` baut ein GitHub-Workflow beide ZIPs und aktualisiert den Release „latest".

## Stand und Grenzen

- Getestet mit echtem TinyMCE 6 und mit einer Attrappe der Atto-Schnittstelle in Chromium (Einfügen, Bearbeiten, Block/Inline). **Noch nicht in einem echten Moodle** ausprobiert.
- Die Beschriftungen im Formeleditor selbst sind bisher nur deutsch, Knopf und Dialogleiste sind Deutsch/Englisch.
- Die Formel erscheint im Editor als Text (`\( … \)`), nicht gerendert, wie beim Moodle-Formelknopf. Die Vorschau gibt es im Dialog.

## Lizenz

GPL 3 oder neuer (wie Moodle), siehe `LICENSE`. KaTeX liegt unter MIT (`shared/web/katex/LICENSE`).
