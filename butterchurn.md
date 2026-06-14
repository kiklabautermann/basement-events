# Implementierungsplan: Butterchurn Visualizer Integration

Dieser Plan beschreibt die technische Integration von **Butterchurn** (der WebGL-Portierung des legendären Milkdrop-Visualizers) in die Basement-Events Webseite, um die 3D-Experience mit dynamischen Visuals zu erweitern.

## 1. Übersicht & Zielsetzung
Ziel ist es, den rotierenden Globus im Fullscreen-Modus durch immersive, musikgesteuerte Visualisierungen zu ergänzen oder zu hinterlegen. Die Visuals sollen in Echtzeit auf die Musik des Mixcloud-Players reagieren.

## 2. Die technische Herausforderung: Audio-Quelle
**Problem:** Der Mixcloud-Player läuft in einem `<iframe>`. Aus Sicherheitsgründen (CORS - Cross-Origin Resource Sharing) erlaubt der Browser es nicht, den Audio-Stream eines Iframes einer fremden Domain direkt für die Web Audio API abzugreifen.

**Lösungsmöglichkeiten:**
1. **Mikrofon-Eingang (Empfohlen):** Der Nutzer gibt die Erlaubnis, das Mikrofon zu nutzen. Butterchurn analysiert dann das, was die Lautsprecher ausgeben (über das Mikrofon eingefangen). Dies funktioniert extrem zuverlässig für alle Audioquellen.
2. **System-Audio Capture:** Über `getDisplayMedia` kann der Nutzer einen Tab oder das System-Audio teilen. (Etwas komplexer in der Bedienung für den Endnutzer).
3. **Direkte Audio-Files:** Falls wir eigene MP3s hosten, könnten wir den Stream direkt anzapfen.

## 3. Implementierungsschritte

### Schritt 1: Bibliotheken einbinden
Wir benötigen die Butterchurn Core-Library und die Basis-Presets.
```html
<script src="https://unpkg.com/butterchurn"></script>
<script src="https://unpkg.com/butterchurn-presets"></script>
```

### Schritt 2: Canvas Integration
Ein zweites Canvas-Element wird im Hintergrund der Hero-Section (oder im Fullscreen-Container) platziert.
```html
<canvas id="butterchurn-canvas" style="position: absolute; top:0; left:0; width:100%; height:100%; z-index: -1;"></canvas>
```

### Schritt 3: Audio-Analyse Setup (JS)
Initialisierung der Web Audio API und Verbindung mit Butterchurn.
```javascript
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const visualizer = butterchurn.createVisualizer(audioContext, canvas, {
  width: window.innerWidth,
  height: window.innerHeight
});

// Mikrofon als Quelle nutzen
navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
  const source = audioContext.createMediaStreamSource(stream);
  visualizer.connectAudio(source);
  
  // Presets laden und starten
  const presets = butterchurnPresets.getPresets();
  const preset = presets['fractal - 01'];
  visualizer.loadPreset(preset, 0.0);
  
  renderVisualizer();
});
```

### Schritt 4: Synchronisation mit Fullscreen
* Wenn der Nutzer auf **"3D Experience & Sound"** klickt:
    1. AudioContext starten (Browser erfordern Nutzerinteraktion).
    2. Butterchurn Canvas einblenden.
    3. Den Globus dezent transparent machen oder als Overlay behalten.

## 4. UI-Erweiterungen im Fullscreen
* **Blending-Regler (Crossfader):** Ein horizontaler Schieberegler, um nahtlos zwischen dem 3D-Globus und den Butterchurn-Visuals zu blenden.
* **Preset-Switcher:** Ein kleiner "+ / -" Button im Fullscreen, um zwischen verschiedenen Visualisierungen zu wechseln.

### Implementierung des Blending-Reglers
Wir fügen ein Input-Element in den Fullscreen-Bereich ein:
```html
<input type="range" id="visualizer-blend" min="0" max="1" step="0.01" value="0.5">
```

Und steuern damit die Opacity des Butterchurn-Canvas sowie dezent die Material-Eigenschaften des Globus:
```javascript
const blendSlider = document.getElementById('visualizer-blend');
blendSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    // Butterchurn Canvas Deckkraft
    document.getElementById('butterchurn-canvas').style.opacity = val;
    
    // Optional: Globus Emissive-Stärke anpassen für besseren Kontrast
    globeMaterial.emissiveIntensity = 0.2 + (1 - val) * 0.5;
});
```

## 5. Nächste Schritte
1. Dummy-Implementation mit Mic-Input testen.
2. Performance-Check: Three.js (Globus) + Butterchurn (Visuals) gleichzeitig benötigen ordentlich GPU-Leistung.
3. Auswahl der besten "Basement-Style" Presets (eher dunkel, technoid, neon-lastig).

---
*Erstellt am: 27. Februar 2026*
