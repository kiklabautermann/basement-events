Baue eine visuell atemberaubende, moderne und interaktive Single-Page-Webanwendung. Das zentrale visuelle Element der Seite ist ein interaktiver, rotierender 3D-Globus, auf den das SVG-Logo aus dem Pfad "assets/BASEMENT2025_12_bluewhite.svg" projiziert wird (entweder als Oberflächentextur des Globus oder um ihn herum schwebend/eingebettet). 
Bitte befolge diese spezifischen Anforderungen:
1. **Technologie-Stack:**
   - Verwende HTML5, Vanilla JavaScript und reines Vanilla CSS (kein Tailwind, es sei denn es wird absolut benötigt).
   - Nutze eine WebGL-Bibliothek wie `Three.js` (über CDN einbinden), um den interaktiven, rotierenden Globus zu rendern.
2. **Core Feature (Der Globus):**
   - Der Globus soll flüssig rotieren und leicht auf Mausbewegungen reagieren (Parallax-Effekt oder Drag-to-Rotate).
   - Das Logo "assets/BASEMENT2025_12_bluewhite.svg" soll elegant auf die Erdkugel gemappt werden, sodass es sich mit der Kugel dreht, oder so integriert sein, dass es als leuchtendes Hologramm aus dem Globus hervortritt.
   - Der Globus sollte eine Wireframe- oder Partikel-Optik haben, um besonders modern und "techy" zu wirken.
3. **Design & Ästhetik (Sehr wichtig!):**
   - **Farbschema:** Orientiere dich exakt am Logo (Blau und Weiß). Nutze einen tiefdunklen Hintergrund (z. B. Midnight Blue bis Fast-Schwarz) mit subtilen, leuchtenden blauen Akzenten (Neon/Cyan) und reinweißem Text für maximalen Kontrast.
   - **UI-Elemente:** Nutze Glassmorphismus (halbtransparente UI-Panels mit Hintergrund-Unschärfe / `backdrop-filter: blur`), leuchtende Ränder und weiche CSS-Verläufe.
   - **Typografie:** Binde eine moderne, saubere Google Font ein (z. B. 'Inter', 'Outfit' oder 'Space Grotesk').
   - **Animationen:** Füge weiche Fade-Ins hinzu, wenn die Seite lädt. UI-Elemente sollten subtile Hover-Effekte haben (z. B. leichtes Skalieren und verstärktes Leuchten).
4. **Struktur:**
   - Eine cleane, minimalistische Navigation (Header) mit transparentem Hintergrund.
   - Eine Hero-Section, die 100vh einnimmt. Der 3D-Globus steht hier im Zentrum.
   - Nutze einen starken weißen oder hellblauen Call-to-Action (CTA) Button mit einem modernen Glow-Hover-Effekt unter oder neben dem Globus.
5. **Entwicklungs-Richtlinien:**
   - Stelle sicher, dass die Anwendung vollständig responsiv ist und auch auf mobilen Geräten perfekt aussieht (der Canvas für den Globus muss sich dynamisch anpassen).
   - Schreibe sauberen, gut dokumentierten Code. Lege das CSS in einer separaten `style.css` und das JavaScript in einer `main.js` ab.
6. **Event-System & Adminverwaltung:**
   - Die Webseite soll zukünftige Veranstaltungen (Events) anzeigen.
   - Ein Adminbereich soll entwickelt werden, über den die Events bearbeitet und neue hinzugefügt werden können.
   - Jedes Event hat zwingend folgende Eigenschaften:
     - Datum
     - Startzeit und Endzeit
     - Veranstaltungsort (Venue) mit integrierter Google Maps Minianzeige
     - Ein Upload-Feld für ein Bild oder einen Flyer
     - Eine Liste von DJs, die auf dem Event spielen.
   - Die Darstellung der Events muss sich nahtlos und hochwertig in das bestehende Glassmorphism-/Neon-Design einfügen.

Mache das Design so "Premium" und beeindruckend wie möglich. Der Benutzer muss beim ersten Öffnen der Seite einen absoluten "Wow-Effekt" erleben!