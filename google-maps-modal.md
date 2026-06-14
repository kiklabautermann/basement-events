# Google Maps Modal Implementierung

Um einen kleinen Kartenausschnitt auf der Website klickbar zu machen, der sich dann in einer großen, interaktiven Lightbox (Modal) öffnet (zoom- und scrollbar), kann folgender Code verwendet werden:

## 1. HTML (Struktur)

```html
<!-- Die kleine Vorschau (Preview) -->
<div class="map-preview-container" onclick="openMapModal()">
    <!-- Hier könnte auch ein statisches Bild der Karte sein, um Ladezeit zu sparen -->
    <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2662.3160212354714!2d11.575490076899538!3d48.13715397124355!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x479e75f5348abfff%3A0xeab50d8a5de2d385!2sMarienplatz!5e0!3m2!1sde!2sde!4v1700000000000!5m2!1sde!2sde" 
            width="100%" height="200" style="border:0; pointer-events: none;" allowfullscreen="" loading="lazy"></iframe>
    <div class="map-overlay-text">Klicken zum Vergrößern</div>
</div>

<!-- Das versteckte Modal für die große Ansicht -->
<div id="mapModal" class="map-modal">
    <div class="map-modal-content">
        <span class="close-btn" onclick="closeMapModal()">&times;</span>
        <!-- Die interaktive, große Karte -->
        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2662.3160212354714!2d11.575490076899538!3d48.13715397124355!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x479e75f5348abfff%3A0xeab50d8a5de2d385!2sMarienplatz!5e0!3m2!1sde!2sde!4v1700000000000!5m2!1sde!2sde" 
                width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy"></iframe>
    </div>
</div>
```

## 2. CSS (Styling & Animationen)

```css
/* Styling für die Vorschau */
.map-preview-container {
    position: relative;
    width: 100%;
    max-width: 400px;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}

.map-preview-container:hover {
    transform: scale(1.02);
}

.map-overlay-text {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.3);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 1.2rem;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.map-preview-container:hover .map-overlay-text {
    opacity: 1;
}

/* Styling für das Modal */
.map-modal {
    display: none; /* Standardmäßig versteckt */
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background-color: rgba(0, 0, 0, 0.85); /* Abgedunkelter Hintergrund */
    z-index: 1000;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(5px); /* Glassmorphism Effekt */
}

/* Wenn das Modal aktiv ist */
.map-modal.active {
    display: flex;
    animation: fadeIn 0.3s ease-in-out;
}

.map-modal-content {
    position: relative;
    width: 90%;
    height: 85%;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

/* Schließen Button */
.close-btn {
    position: absolute;
    top: -40px;
    right: 0;
    color: white;
    font-size: 40px;
    font-weight: bold;
    cursor: pointer;
    z-index: 1001;
}

.close-btn:hover {
    color: #ff4757;
}

@keyframes fadeIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}
```

## 3. JavaScript (Logik)

```javascript
function openMapModal() {
    document.getElementById('mapModal').classList.add('active');
    // Verhindert das Scrollen der Hintergrund-Seite, wenn das Modal offen ist
    document.body.style.overflow = 'hidden'; 
}

function closeMapModal() {
    document.getElementById('mapModal').classList.remove('active');
    // Erlaubt das Scrollen wieder
    document.body.style.overflow = 'auto';
}

// Optional: Schließen, wenn man außerhalb der Karte klickt
window.onclick = function(event) {
    const modal = document.getElementById('mapModal');
    if (event.target === modal) {
        closeMapModal();
    }
}
```
