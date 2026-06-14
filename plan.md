# Umsetzungsplan: 3D-Globus Single-Page-Webanwendung

Dieser Plan beschreibt die schrittweise Umsetzung der in `idea.md` formulierten Anforderungen für eine moderne, interaktive und visuell beeindruckende Single-Page-Webanwendung.

## Schritt 1: Projekt-Setup & Ressourcen
*   **Ordnerstruktur anlegen:** Erstellen der Basisstruktur mit `index.html`, `style.css`, `main.js` und dem Ordner `assets/` (für das Logo `BASEMENT2025_12_bluewhite.svg`).
*   **Abhängigkeiten einbinden:** In der `index.html` die nötigen externen Bibliotheken über CDN einbinden, primär Three.js (inkl. OrbitControls für Interaktivität) und eine moderne Google Font (z.B. 'Inter' oder 'Space Grotesk').
*   **HTML-Grundgerüst:** Basis-Tags setzen, SEO-Meta-Daten hinzufügen (Titel, Description, Viewport für Mobile).

## Schritt 2: Design-System & Globales Styling (CSS)
*   **Basis-Styling:** CSS-Reset durchführen. Definition von CSS-Variablen für das im Logo vorgegebene Farbschema (Tiefes Midnight-Blue `#0a0a1a`, leuchtendes Neon-/Cyan-Blau `#00f3ff`, Reinweiß `#ffffff`).
*   **Hintergrund & Typografie:** Einrichten eines tiefdunklen Hintergrunds. Anwenden der gewählten Google Font als Standard-Typografie mit passendem Line-Height und Letter-Spacing.
*   **Glow- & Glassmorphism-Utilities:** Hilfsklassen für Glassmorphismus (z.B. `backdrop-filter: blur(10px)`, halbtransparente Ränder) sowie für leuchtende Neon-Schatten (`box-shadow`) erstellen.

## Schritt 3: Strukturierung des User Interface (HTML & CSS)
*   **Navigation:** Einen simplen, eleganten Header am oberen Bildschirmrand platzieren (transparent oder leichter Glassmorphism-Effekt).
*   **Hero-Section:** Eine 100vh hohe Hero-Sektion designen, die den gesamten Viewport füllt. Diese dient als Hintergrund für den 3D-Content.
*   **UI-Elemente:** Ein Glassmorphismus-Panel in den Vordergrund stellen, das Titel, Sub-Headline und den primären Call-to-Action (CTA) Button enthält.
*   **CTA-Button:** Programmierung eines modernen Hover-Effekts für den Button (sanftes Skalieren und Intensivierung des Neon-Glows, weiche Transitions).

## Schritt 4: 3D-Scene & Wireframe-Globus (Three.js & JS)
*   **Infrastruktur:** In `main.js` die Basis-Szene von Three.js aufbauen (Scene, PerspectiveCamera, WebGLRenderer) und an das Vollbild-Canvas im HTML binden.
*   **Globus-Objekt:** Eine Kugel (SphereGeometry) erstellen und mit einem Material im Wireframe- oder Partikel-Look versehen, um den gewünschten *"techy"* Vibe zu erzielen (z.B. weiße oder blaue Linienstruktur).
*   **Rotation:** Eine einfache Animationsschleife (requestAnimationFrame) implementieren, die den Globus sanft um seine eigene Achse (Y-Achse) rotieren lässt.

## Schritt 5: Texturierung & Logo-Hologramm
*   **Logo-Mapping:** Das SVG-Logo laden. Entweder als Textur direkt auf eine leicht größere, transparente Kugel über dem Wireframe-Globus projizieren oder als separate Ebene ausrichten.
*   **Licht und Effekte:** Lichtquellen hinzufügen (Ambient Light für Grundhelligkeit, Point Lights in Neon/Cyan), um Reflexionen und einen leuchtenden, holografischen Effekt auf dem Globus und dem Logo zu betonen.

## Schritt 6: Interaktivität & Animationen
*   **Maussteuerung/Parallax:** OrbitControls von Three.js so konfigurieren, dass Nutzer den Globus per Drag-and-Drop sanft rotieren können (mit Damping/Trägheit für Premium-Gefühl). Alternativ einen Parallax-Effekt auf Basis der Mauskoordinaten (`mousemove`) programmieren, bei dem die Szene der Maus leicht folgt.
*   **Responsive Design:** Einen Event-Listener für `resize` in `main.js` hinzufügen, damit Kamera-Seitenverhältnis (`aspect`) und Renderer-Größe stets an Fensteränderungen oder mobile Screens angepasst werden.
*   **Load-Animationen:** Weiche CSS-Keyframe-Animationen (`animation: fadeIn 1.5s ease-out`) für das erstmalige Einblenden der UI-Komponenten nach dem Laden der Seite implementieren.

## Schritt 7: Event-Datenmodell & Admin-Backend
*   **Datenstruktur:** Definition des Event-Modells (Datum, Startzeit, Endzeit, Veranstaltungsort, Flyer-Image-URL/-Pfad, Liste der DJs).
*   **Admin-Bereich:** Implementierung einer Administrations-Oberfläche zur Bearbeitung der Events (inklusive Upload-Funktion für Bilder/Flyer).
*   **Backend/Headless CMS:** Bereitstellen eines passenden Backends, um Event-Daten und Uploads sicher zu speichern und abzurufen.

## Schritt 8: Event-UI & Google Maps Integration
*   **UI-Komponenten:** Gestaltung responsiver Event-Karten oder einer Liste im bestehenden Premium-Design (Dark Mode, Glassmorphism, leuchtende Akzente).
*   **Google Maps:** Einbinden der Google Maps API zur Darstellung einer Minianzeige des Veranstaltungsorts innerhalb der Event-Details.
*   **Frontend-Darstellung:** Dynamisches Rendern der chronologisch sortierten, zukünftigen Events auf der Webseite, beispielsweise als neue Sektion.

## Schritt 9: Polishing & "Wow-Effekt" Feinschliff
*   **Testing:** Testen der Anwendung auf flüssige 60 Frames pro Sekunde (Performance-Optimierungen bei Three.js) sowie Testen der Event- und Upload-Funktionen.
*   **Mobile Optimierung:** Überprüfen, ob die UI auf Smartphones gut proportioniert ist und weder der Globus noch die Event-Karten das Layout zerschießen.
*   **Ästhetisches Tuning:** Feinabstimmung der Farben, Glow-Intensitäten, Typografie-Gewichte und Animation-Timings, um ein extrem hochwertiges, rundes Gesamtbild zu erschaffen.
*   **Code-Dokumentation:** Letzter Check, ob der Code sauber strukturiert, ungenutzte Elemente entfernt und relevante Blöcke dokumentiert/kommentiert wurden.
