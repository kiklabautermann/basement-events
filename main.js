import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, updateDoc, doc, query, orderBy, onSnapshot, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';

// --- Firebase Configuration ---
// ERSETZE DIESES OBJEKT MIT DEINEN EIGENEN DATEN AUS DER FIREBASE CONSOLE!
const firebaseConfig = {
    apiKey: "AIzaSyD-VVwVCE_19RQbdSmxv_Dd55LWb_JJ2y4",
    authDomain: "basement-events.firebaseapp.com",
    projectId: "basement-events",
    storageBucket: "basement-events.firebasestorage.app",
    messagingSenderId: "4620636440",
    appId: "1:4620636440:web:b9e2daf0681a4f9d458e6d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Global State ---
let events = [];
let isLoggedIn = false;

// Wir nutzen nun Echtzeit-Listener von Firestore
function initData() {
    // Events Listener
    const qEvents = query(collection(db, "events"), orderBy("date", "asc"));
    onSnapshot(qEvents, (querySnapshot) => {
        events = [];
        querySnapshot.forEach((doc) => {
            events.push({ id: doc.id, ...doc.data() });
        });
        renderEvents(events);
        renderPastEvents(events);
        if (isLoggedIn) renderAdminEvents();
    });

    // Social Links Listener
    onSnapshot(doc(db, "settings", "socials"), (docSnap) => {
        if (docSnap.exists()) {
            console.log("Social Links geladen:", docSnap.data());
            renderSocialLinks(docSnap.data());
            if (isLoggedIn) fillSocialAdminForm(docSnap.data());
        } else {
            console.log("Social Links existieren noch nicht in Firestore.");
        }
    });
}

// --- 3D Scene Setup ---
let scene, camera, renderer, controls;
let globe, particles;
let moonPivot, moonMesh;

let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

let visualizer, audioContext, butterchurnCanvas, isVisualizerActive = false;
let presets = {}, presetNames = [], currentPresetIndex = 0, presetTimer;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

initData();
initThreeJS();
renderEvents(events);
renderPastEvents(events);
setupUI();

function initThreeJS() {
    const container = document.getElementById('canvas-container');

    // 1. Scene setup
    scene = new THREE.Scene();

    // 2. Camera setup
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 120;

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // 4. Lights - Day & Night Setup
    // Very low ambient light to keep the shadow side almost dark
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
    scene.add(ambientLight);

    // The Sun (Directional Light from far left)
    const sunLight = new THREE.DirectionalLight(0xffffee, 3.5);
    sunLight.position.set(-300, 50, -100); // Far left, slightly up and back
    scene.add(sunLight);

    // Subtle atmospheric rim lights (dimmed down)
    const neonLight = new THREE.PointLight(0x00f3ff, 0.5, 200);
    neonLight.position.set(50, 50, 50);
    scene.add(neonLight);

    const purpleLight = new THREE.PointLight(0x4a00e0, 0.5, 200);
    purpleLight.position.set(-50, -50, 50);
    scene.add(purpleLight);

    // 5. Wireframe Globe
    const geometry = new THREE.SphereGeometry(30, 64, 64);
    const material = new THREE.MeshStandardMaterial({
        color: 0x00f3ff,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
        emissive: 0x0055ff,
        emissiveIntensity: 0.1 // deeply reduced so light reveals it, not self-illumination
    });
    globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // 6. Particle system around globe
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 2000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 150;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.5,
        color: 0x00f3ff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // 7. Load Logo Textures
    const textureLoader = new THREE.TextureLoader();
    // Use timestamp to avoid caching the older, non-white version
    textureLoader.load('./assets/BASEMENT2025_12_bluewhite.svg?v=' + Date.now(), (texture) => {
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

        // Maintain original SVG aspect ratio
        const aspect = 1455.074 / 311.609;
        const arcLength = 65; // Slightly increased logic to fit visual width on curve
        const planeHeight = arcLength / aspect;
        const radius = 33; // Slightly larger diameter than globe
        const thetaLength = arcLength / radius;

        // Use CylinderGeometry to curve the logo. Centered at front by using -thetaLength/2
        const planeGeo = new THREE.CylinderGeometry(radius, radius, planeHeight, 64, 1, true, -thetaLength / 2, thetaLength);

        // Correct texture flipping natively caused by wrapping outside a cylinder
        // Removed texture flip since it resulted in mirrored text.
        texture.wrapS = THREE.RepeatWrapping;
        // texture.repeat.x = 1;
        // texture.offset.x = 0;

        const planeMat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const logoPlane = new THREE.Mesh(planeGeo, planeMat);

        // Cylinder natively generates geometry correctly offset from the origin
        logoPlane.position.set(0, 0, 0);
        logoPlane.rotation.set(0, 0, 0);

        // 7.1 Load Continent Texture
        const earthMap = textureLoader.load('./assets/earth-water.png');
        const earthGeo = new THREE.SphereGeometry(29.8, 64, 64);
        const earthMat = new THREE.MeshStandardMaterial({
            color: 0x00f3ff,
            transparent: true,
            opacity: 0.8,
            alphaMap: earthMap,
            emissive: 0x0055ff,
            emissiveIntensity: 0.1, // deeply reduced for shadow effect
            blending: THREE.AdditiveBlending
        });
        const earthMesh = new THREE.Mesh(earthGeo, earthMat);
        // Rotate map so Central Europe's longitude aligns behind the logo
        earthMesh.rotation.y = Math.PI - 0.3; // Offset to roughly 10° East

        // Group globe and logo to rotate together
        const globeGroup = new THREE.Group();
        globeGroup.add(globe);
        globeGroup.add(earthMesh);
        globeGroup.add(logoPlane);

        // Dynamische Anpassung für Mobile (Zentrierung)
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            globeGroup.scale.set(0.8, 0.8, 0.8); // Etwas größer als vorher (80%)
            globeGroup.position.y = 0; // Exakt im Zentrum
        } else {
            globeGroup.position.y = 5; // Dezent oberhalb der Mitte für Desktop
        }

        scene.add(globeGroup);

        // Remove standard globe, re-assign reference so animation loop uses the group
        scene.remove(globe);
        globe = globeGroup;
    });

    // 7.2 Moon System
    // Earth Radius = 30. Moon radius is ~27% of Earth's (30 * 0.27 = 8.1)
    const moonGeo = new THREE.SphereGeometry(8.1, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        wireframe: true,
        transparent: true,
        opacity: 0.8, // Make moon somewhat solid
        emissive: 0x666666,
        emissiveIntensity: 0.05, // Almost zero emissive so night side is dark
        blending: THREE.NormalBlending // Normal blending looks better for directional shadows
    });
    moonMesh = new THREE.Mesh(moonGeo, moonMat);

    // Orbit pivot for the Moon
    moonPivot = new THREE.Group();
    moonPivot.position.y = 15; // Match globe height
    // Slight orbital tilt matching roughly 5 degrees
    moonPivot.rotation.z = 5 * (Math.PI / 180);

    // Position moon at a stylized distance. 
    // True proportional distance is ~1800 units, but that would be off-screen.
    moonMesh.position.x = 85;
    moonPivot.add(moonMesh);
    scene.add(moonPivot);

    // 8. OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;

    // Resize listener
    window.addEventListener('resize', onWindowResize, false);

    // Parallax Effect Mouse Move
    document.addEventListener('mousemove', onMouseMove);

    animate();
}

function onMouseMove(event) {
    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (visualizer) {
        visualizer.setDimensions(window.innerWidth, window.innerHeight);
    }
}

function animate() {
    requestAnimationFrame(animate);

    targetX = mouseX * .001;
    targetY = mouseY * .001;

    if (particles) {
        particles.rotation.y += 0.001;
        particles.rotation.x += 0.0005;
    }

    if (globe) {
        // Parallax effect added onto globe
        globe.rotation.y += 0.05 * (targetX - globe.rotation.y);
        globe.rotation.x += 0.05 * (targetY - globe.rotation.x);
    }

    if (moonPivot && moonMesh) {
        // Orbital rotation around Earth
        moonPivot.rotation.y += 0.003;
        // Moon rotation around its own axis (tidally locked)
        moonMesh.rotation.y += 0.003;
    }

    controls.update(); // required if damping enabled

    if (isVisualizerActive && visualizer) {
        visualizer.render();
    }

    renderer.render(scene, camera);
}


// --- UI Logic ---
function renderEvents(eventsData) {
    const grid = document.getElementById('events-grid');
    grid.innerHTML = '';

    // Filter to only show upcoming events (today or future)
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day
    const upcomingEvents = eventsData.filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= now;
    });

    upcomingEvents.forEach(event => {
        const formattedDate = new Date(event.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

        const card = document.createElement('div');
        card.className = 'event-card glass-panel';

        card.innerHTML = `
            <div class="event-date-badge">${formattedDate}</div>
            <img src="${event.imgUrl || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop'}" alt="Flyer" class="event-card-img">
            <div class="event-info">
                <h3>${event.title || event.venue.split(',')[0]}</h3>
                <div class="event-detail">
                    <span>🕒</span> ${event.start} - ${event.end}
                </div>
                <div class="event-detail">
                    <span>📍</span> ${event.venue}
                </div>
                <div class="event-djs">
                    <div class="lineup-label">🎵 Lineup:</div>
                    <ul class="lineup-list">
                        ${event.djs.split(',').map(dj => `<li>${dj.trim()}</li>`).join('')}
                    </ul>
                </div>
                ${event.price ? `<div class="event-detail"><span>💶</span> ${event.price}</div>` : ''}
                <div class="map-mini" data-venue="${encodeURIComponent(event.venue)}">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        style="border:0;" 
                        loading="lazy" 
                        allowfullscreen 
                        src="https://maps.google.com/maps?q=${encodeURIComponent(event.venue)}&t=&z=15&ie=UTF8&iwloc=&output=embed">
                    </iframe>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    // Add click listeners to map miniatures
    document.querySelectorAll('.map-mini').forEach(mapEl => {
        mapEl.addEventListener('click', (e) => {
            const venue = mapEl.dataset.venue;
            if (venue) {
                const iframe = document.getElementById('modal-map-iframe');
                iframe.src = `https://maps.google.com/maps?q=${venue}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                document.getElementById('map-modal').classList.remove('hidden');
            }
        });
    });
}

function renderPastEvents(eventsData) {
    const grid = document.getElementById('past-events-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Filter to only show past events (before today)
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of day
    const pastEvents = eventsData.filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate < now;
    });

    pastEvents.forEach(event => {
        const formattedDate = new Date(event.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

        const card = document.createElement('div');
        card.className = 'event-card glass-panel';

        card.innerHTML = `
            <div class="event-date-badge">${formattedDate}</div>
            <img src="${event.imgUrl || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop'}" alt="Flyer" class="event-card-img">
            <div class="event-info">
                <h3>${event.title || event.venue.split(',')[0]}</h3>
                <div class="event-detail">
                    <span>🕒</span> ${event.start} - ${event.end}
                </div>
                <div class="event-detail">
                    <span>📍</span> ${event.venue}
                </div>
                <div class="event-djs">
                    <div class="lineup-label">🎵 Lineup:</div>
                    <ul class="lineup-list">
                        ${event.djs.split(',').map(dj => `<li>${dj.trim()}</li>`).join('')}
                    </ul>
                </div>
                ${event.price ? `<div class="event-detail"><span>💶</span> ${event.price}</div>` : ''}
                <div class="map-mini" data-venue="${encodeURIComponent(event.venue)}">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        style="border:0;" 
                        loading="lazy" 
                        allowfullscreen 
                        src="https://maps.google.com/maps?q=${encodeURIComponent(event.venue)}&t=&z=15&ie=UTF8&iwloc=&output=embed">
                    </iframe>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    // Add click listeners to map miniatures
    document.querySelectorAll('.map-mini').forEach(mapEl => {
        mapEl.addEventListener('click', (e) => {
            const venue = mapEl.dataset.venue;
            if (venue) {
                const iframe = document.getElementById('modal-map-iframe');
                iframe.src = `https://maps.google.com/maps?q=${venue}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                document.getElementById('map-modal').classList.remove('hidden');
            }
        });
    });
}

function renderAdminEvents() {
    const list = document.getElementById('admin-events-list');
    if (!list) return;
    list.innerHTML = '';

    events.forEach(event => {
        const item = document.createElement('div');
        item.style.background = 'rgba(255,255,255,0.05)';
        item.style.padding = '1rem';
        item.style.borderRadius = '8px';
        item.style.border = '1px solid var(--glass-border)';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';

        item.innerHTML = `
            <div>
                <h5 style="color: var(--neon-cyan); margin-bottom: 0.3rem; font-size: 1.1rem;">${event.title || event.venue.split(',')[0]}</h5>
                <div style="font-size: 0.8rem; color: #ccc;">📅 ${event.date}</div>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-direction: column;">
                <button class="btn-edit" data-id="${event.id}" style="background: transparent; color: #fff; border: 1px solid #fff; cursor: pointer; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; transition: background 0.3s; width: 60px;">BEARB.</button>
                <button class="btn-delete" data-id="${event.id}" style="background: transparent; color: #ff3366; border: 1px solid #ff3366; cursor: pointer; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; transition: background 0.3s; width: 60px;">LÖSCHEN</button>
            </div>
        `;
        list.appendChild(item);
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            editEvent(id);
        });
        btn.addEventListener('mouseover', e => e.target.style.background = '#fff');
        btn.addEventListener('mouseover', e => e.target.style.color = '#000');
        btn.addEventListener('mouseout', e => e.target.style.background = 'transparent');
        btn.addEventListener('mouseout', e => e.target.style.color = '#fff');
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            deleteEvent(id);
        });
        btn.addEventListener('mouseover', e => e.target.style.background = '#ff3366');
        btn.addEventListener('mouseover', e => e.target.style.color = '#fff');
        btn.addEventListener('mouseout', e => e.target.style.background = 'transparent');
        btn.addEventListener('mouseout', e => e.target.style.color = '#ff3366');
    });
}

function editEvent(id) {
    const event = events.find(e => e.id === id);
    if (!event) return;

    document.getElementById('form-title').innerText = 'Event bearbeiten';
    document.getElementById('btn-cancel-edit').classList.remove('hidden');

    document.getElementById('event-id').value = event.id;
    document.getElementById('event-title').value = event.title || '';
    document.getElementById('event-date').value = event.date;
    document.getElementById('event-start').value = event.start;
    document.getElementById('event-end').value = event.end;
    document.getElementById('event-venue').value = event.venue;
    document.getElementById('event-djs').value = event.djs;
    document.getElementById('event-price').value = event.price || '';
    document.getElementById('event-flyer').value = event.imgUrl || '';

    // Scroll to form if needed
    document.getElementById('event-form').scrollIntoView({ behavior: 'smooth' });
}

function deleteEvent(id) {
    if (confirm('Bist du sicher, dass du dieses Event löschen möchtest?')) {
        deleteDoc(doc(db, "events", id)).catch(err => {
            console.error("Fehler beim Löschen:", err);
            alert("Fehler beim Löschen des Events.");
        });
    }
}

function prefillNewEventForm() {
    let nextNum = 34; // default starting point
    if (events && events.length > 0) {
        let maxNum = 0;
        events.forEach(e => {
            const match = e.title ? e.title.match(/Basement#(\d+)/i) : null;
            if (match && parseInt(match[1]) > maxNum) {
                maxNum = parseInt(match[1]);
            }
        });
        if (maxNum > 0) {
            nextNum = maxNum + 1;
        }
    }

    document.getElementById('event-form').reset();
    document.getElementById('event-id').value = '';
    document.getElementById('form-title').innerText = 'Neues Event erstellen';
    document.getElementById('btn-cancel-edit').classList.add('hidden');

    document.getElementById('event-title').value = `Basement#${nextNum}`;
    document.getElementById('event-venue').value = 'Werni’s Kellerbar Brodlaube 19, Rheinfelden';
    document.getElementById('event-price').value = 'Kostenlos';
    document.getElementById('event-start').value = '21:00';
    document.getElementById('event-end').value = '04:00';
}

function setupUI() {
    const navAdmin = document.getElementById('nav-admin');
    const sections = {
        hero: document.getElementById('hero'),
        events: document.getElementById('events'),
        admin: document.getElementById('admin'),
        shop: document.getElementById('shop'),
        footer: document.querySelector('.social-footer')
    };

    const adminViews = {
        login: document.getElementById('admin-login-view'),
        dashboard: document.getElementById('admin-dashboard-view')
    };

    const btnCancelEdit = document.getElementById('btn-cancel-edit');

    // Navigation Updates
    navAdmin.addEventListener('click', (e) => {
        e.preventDefault();
        sections.events.classList.add('hidden');
        sections.admin.classList.remove('hidden');

        if (isLoggedIn) {
            adminViews.login.classList.add('hidden');
            adminViews.dashboard.classList.remove('hidden');
            renderAdminEvents();
            prefillNewEventForm();
        } else {
            adminViews.dashboard.classList.add('hidden');
            adminViews.login.classList.remove('hidden');
        }
        window.scrollTo(0, sections.admin.offsetTop);
    });

    // Map Modal Handlers
    const mapModal = document.getElementById('map-modal');
    const closeMapModal = document.getElementById('close-map-modal');
    const modalMapIframe = document.getElementById('modal-map-iframe');

    const closeModal = () => {
        mapModal.classList.add('hidden');
        modalMapIframe.src = ''; // Clear iframe source on close
    };

    closeMapModal.addEventListener('click', closeModal);
    mapModal.addEventListener('click', (e) => {
        // Close if click is outside modal-content (on the background overlay)
        if (e.target.id === 'map-modal') {
            closeModal();
        }
    });

    document.querySelectorAll('.main-nav a:not(#nav-admin)').forEach(link => {
        link.addEventListener('click', () => {
            sections.admin.classList.add('hidden');
            sections.events.classList.remove('hidden');
        });
    });

    // Firebase Auth State Tracking
    onAuthStateChanged(auth, (user) => {
        if (user) {
            isLoggedIn = true;
            // Falls wir gerade im Admin-Bereich sind, Dashboard zeigen
            if (!sections.admin.classList.contains('hidden')) {
                adminViews.login.classList.add('hidden');
                adminViews.dashboard.classList.remove('hidden');
                renderAdminEvents();
                prefillNewEventForm();
            }
        } else {
            isLoggedIn = false;
            adminViews.dashboard.classList.add('hidden');
            if (!sections.admin.classList.contains('hidden')) {
                adminViews.login.classList.remove('hidden');
            }
        }
    });

    // Login Form Submit (Firebase Auth)
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = "basement.events@proton.me"; // Deine Admin-Email
        const pwd = document.getElementById('admin-password').value;

        try {
            await signInWithEmailAndPassword(auth, email, pwd);
            document.getElementById('login-error').style.display = 'none';
            document.getElementById('login-form').reset();
        } catch (error) {
            console.error("Login Fehler:", error);
            document.getElementById('login-error').style.display = 'block';
            document.getElementById('admin-password').value = '';
        }
    });

    // Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
        signOut(auth).catch(err => console.error("Logout Fehler:", err));
    });

    // Cancel Edit
    btnCancelEdit.addEventListener('click', () => {
        prefillNewEventForm();
    });

    // Form Event Create/Edit Submit
    document.getElementById('event-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("Speichervorgang gestartet...");

        const idField = document.getElementById('event-id').value;
        const eData = {
            title: document.getElementById('event-title').value,
            date: document.getElementById('event-date').value,
            start: document.getElementById('event-start').value,
            end: document.getElementById('event-end').value,
            venue: document.getElementById('event-venue').value,
            djs: document.getElementById('event-djs').value,
            price: document.getElementById('event-price').value,
            imgUrl: document.getElementById('event-flyer').value || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=800&auto=format&fit=crop'
        };

        try {
            if (idField) {
                // Update existing in Firestore
                await updateDoc(doc(db, "events", idField), eData);
                alert('Event erfolgreich aktualisiert!');
            } else {
                // Create new in Firestore
                await addDoc(collection(db, "events"), eData);
                alert('Event erfolgreich erstellt!');
            }
            prefillNewEventForm();
        } catch (err) {
            console.error("Save Error:", err);
            alert("Fehler beim Speichern des Events.");
        }
    });

    // Social Form Submit
    document.getElementById('social-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const socialData = {
            mixcloud: { url: document.getElementById('social-mixcloud').value, show: document.getElementById('show-mixcloud').checked },
            soundcloud: { url: document.getElementById('social-soundcloud').value, show: document.getElementById('show-soundcloud').checked },
            facebook: { url: document.getElementById('social-facebook').value, show: document.getElementById('show-facebook').checked },
            instagram: { url: document.getElementById('social-instagram').value, show: document.getElementById('show-instagram').checked }
        };

        try {
            const settingsRef = doc(db, "settings", "socials");
            await setDoc(settingsRef, socialData, { merge: true });
            alert('Social Links erfolgreich gespeichert!');
        } catch (err) {
            console.error("Social Save Error:", err);
            alert("Fehler beim Speichern der Social Links.");
        }
    });

    // Fullscreen View Logic
    const btnFullscreen = document.getElementById('btn-fullscreen-view');
    const btnButterchurn = document.getElementById('btn-butterchurn-view');
    const btnPublicFullscreen = document.getElementById('btn-public-fullscreen');
    const btnCloseFullscreen = document.getElementById('btn-close-fullscreen');

    const btnPrevPreset = document.getElementById('btn-prev-preset');
    const btnNextPreset = document.getElementById('btn-next-preset');
    const presetNameDisplay = document.getElementById('preset-name');
    const presetIntervalInput = document.getElementById('preset-interval');

    const playerContainer = document.getElementById('fullscreen-player-container');
    const butterchurnContainer = document.getElementById('butterchurn-controls');
    const bottomBar = document.getElementById('experience-bottom-bar');
    const bCanvas = document.getElementById('butterchurn-canvas');
    const blendSlider = document.getElementById('visualizer-blend');
    const presetAutoCycle = document.getElementById('preset-auto-cycle');
    const header = document.querySelector('.glass-header');
    const heroContent = document.querySelector('.hero-content');
    const scrollIndicator = document.querySelector('.scroll-indicator');

    const loadPresetByIndex = (index) => {
        if (!visualizer || presetNames.length === 0) return;
        currentPresetIndex = (index + presetNames.length) % presetNames.length;
        const name = presetNames[currentPresetIndex];
        visualizer.loadPreset(presets[name], 1.5); // 1.5s Übergang
        if (presetNameDisplay) presetNameDisplay.innerText = name;
        resetPresetTimer();
    };

    const resetPresetTimer = () => {
        clearTimeout(presetTimer);
        if (!isVisualizerActive || !presetAutoCycle || !presetAutoCycle.checked) return;
        const interval = parseInt(presetIntervalInput.value) * 1000 || 90000;
        presetTimer = setTimeout(() => {
            if (isVisualizerActive) loadPresetByIndex(currentPresetIndex + 1);
        }, interval);
    };

    const initButterchurn = async () => {
        if (visualizer) {
            if (audioContext && audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            isVisualizerActive = true;
            resetPresetTimer();
            return;
        }

        if (typeof Butterchurn === 'undefined' || typeof butterchurnPresets === 'undefined') {
            console.error("Butterchurn oder Presets fehlen.");
            return;
        }

        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();

            butterchurnCanvas = bCanvas;
            butterchurnCanvas.width = window.innerWidth;
            butterchurnCanvas.height = window.innerHeight;

            // CDN Fix: Manche Versionen legen Butterchurn unter window.butterchurn.default ab
            let bcEngine = typeof Butterchurn !== 'undefined' ? Butterchurn : (typeof butterchurn !== 'undefined' ? butterchurn : null);
            if (bcEngine && bcEngine.default) bcEngine = bcEngine.default;

            if (!bcEngine || typeof bcEngine.createVisualizer !== 'function') {
                throw new Error("Butterchurn Engine konnte nicht gefunden werden.");
            }

            visualizer = bcEngine.createVisualizer(audioContext, butterchurnCanvas, {
                width: window.innerWidth,
                height: window.innerHeight,
                pixelRatio: window.devicePixelRatio || 1
            });

            // Zuerst Presets laden, damit der User sofort etwas sieht
            let presetLib = typeof butterchurnPresets !== 'undefined' ? butterchurnPresets : null;
            if (presetLib && presetLib.default) presetLib = presetLib.default;

            if (presetLib) {
                try {
                    if (typeof presetLib.getPresets !== 'function' && typeof presetLib === 'function') {
                        const instance = new presetLib();
                        presets = instance.getPresets();
                    } else {
                        presets = presetLib.getPresets();
                    }
                    presetNames = Object.keys(presets);
                    if (presetNames.length > 0) {
                        loadPresetByIndex(Math.floor(Math.random() * presetNames.length));
                    }
                } catch (e) {
                    console.error("Presets Load Error:", e);
                }
            }

            if (presetNameDisplay) presetNameDisplay.innerText = "Warte auf Mikrofon...";

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = audioContext.createMediaStreamSource(stream);
            visualizer.connectAudio(source);

            // Namen wieder herstellen nach Mic-Erfolg
            if (presetNames.length > 0) {
                presetNameDisplay.innerText = presetNames[currentPresetIndex];
            }

            isVisualizerActive = true;
            resetPresetTimer();
            console.log("Butterchurn Visualizer erfolgreich gestartet.");
        } catch (err) {
            console.error("Butterchurn Start-Fehler:", err);
            alert("Visualizer Fehler: " + err.message);
        }
    };

    btnPrevPreset.addEventListener('click', () => loadPresetByIndex(currentPresetIndex - 1));
    btnNextPreset.addEventListener('click', () => loadPresetByIndex(currentPresetIndex + 1));
    presetIntervalInput.addEventListener('change', resetPresetTimer);
    if (presetAutoCycle) presetAutoCycle.addEventListener('change', resetPresetTimer);

    const toggleFullscreenUI = (show, withVisualizer = false) => {
        if (show) {
            header.classList.remove('hidden');
            heroContent.classList.remove('hidden');
            scrollIndicator.classList.remove('hidden');
            sections.events.classList.remove('hidden');
            sections.shop.classList.remove('hidden');
            sections.footer.classList.remove('hidden');
            if (isLoggedIn) sections.admin.classList.remove('hidden');
            btnCloseFullscreen.classList.add('hidden');
            bottomBar.classList.add('hidden');
            bCanvas.classList.add('hidden');
            butterchurnContainer.classList.add('hidden');
            isVisualizerActive = false;
            clearTimeout(presetTimer);
        } else {
            header.classList.add('hidden');
            heroContent.classList.add('hidden');
            scrollIndicator.classList.add('hidden');
            sections.events.classList.add('hidden');
            sections.admin.classList.add('hidden');
            sections.shop.classList.add('hidden');
            sections.footer.classList.add('hidden');
            btnCloseFullscreen.classList.remove('hidden');
            bottomBar.classList.remove('hidden');

            if (withVisualizer) {
                bCanvas.classList.remove('hidden');
                bCanvas.style.zIndex = "10000";
                bCanvas.style.pointerEvents = "none";
                butterchurnContainer.classList.remove('hidden');
                initButterchurn();
                bCanvas.style.opacity = blendSlider.value;
            }

            window.scrollTo(0, 0);
        }
    };

    const enterFullscreen = () => toggleFullscreenUI(false, false);
    const enterButterchurn = () => toggleFullscreenUI(false, true);

    const exitFullscreen = () => {
        toggleFullscreenUI(true);
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen();
        }
    };

    // Blending Logic
    blendSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        if (bCanvas) bCanvas.style.opacity = val;
        // Fade out Three.js scene as visualizer fades in
        const threeCanvas = document.getElementById('canvas-container');
        if (threeCanvas) threeCanvas.style.opacity = 1 - (val * 0.8); // Bleibt minimal sichtbar für Tiefe
    });

    btnFullscreen.addEventListener('click', enterFullscreen);
    if (btnButterchurn) btnButterchurn.addEventListener('click', enterButterchurn);
    if (btnPublicFullscreen) btnPublicFullscreen.addEventListener('click', enterFullscreen);
    btnCloseFullscreen.addEventListener('click', exitFullscreen);

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
            toggleFullscreenUI(true);
        }
    });
}

function renderSocialLinks(data) {
    const container = document.getElementById('social-links-container');
    if (!container) return;
    container.innerHTML = '';

    const icons = {
        mixcloud: '<svg class="social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2.614 17.525c.343-.45.857-.675 1.542-.675.686 0 1.2.225 1.543.675.343.45.514 1.05.514 1.8 0 .75-.171 1.35-.514 1.8-.343.45-.857.675-1.543.675-.685 0-1.199-.225-1.542-.675-.343-.45-.515-1.05-.515-1.8 0-.75.172-1.35.515-1.8zm6.571 0c.343-.45.857-.675 1.543-.675.686 0 1.2.225 1.543.675.343.45.514 1.05.514 1.8 0 .75-.171 1.35-.514 1.8-.343.45-.857.675-1.543.675-.686 0-1.2-.225-1.543-.675-.343-.45-.514-1.05-.514-1.8 0-.75.171-1.35.514-1.8zm11.238-6c.712-.132 1.282-.435 1.708-.909.427-.474.641-1.125.641-1.954s-.214-1.48-.641-1.954c-.426-.474-.996-.777-1.708-.909-.713-.132-1.464-.176-2.254-.132s-1.472.193-2.049.447c-.576-.254-1.168-.403-1.776-.447s-1.291-.013-2.049.132c-.757.145-1.42.441-1.986.887-.567.445-.85.954-.85 1.527s.283 1.082.85 1.527c.566.446 1.229.742 1.986.887.758.145 1.441.189 2.049.132s1.2-.193 1.776-.447c.577.254 1.259.403 2.049.447.789.044 1.54.088 2.254-.044z"/></svg>',
        soundcloud: '<svg class="social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7 17.5h-1v-2.5h1v2.5zm2 0h-1v-4.5h1v4.5zm2 0h-1v-6.5h1v6.5zm2 0h-1v-8.5h1v8.5zm2 0h-1v-10.5h1v10.5zm2 0h-1v-9.5h1v9.5zm2 0h-1v-7.5h1v7.5zm2-1.5c0 .828-.672 1.5-1.5 1.5s-1.5-.672-1.5-1.5.672-1.5 1.5-1.5 1.5.672 1.5 1.5zm1.5-.5c0 1.105-.895 2-2 2s-2-.895-2-2 .895-2 2-2 2 .895 2 2z"/></svg>',
        facebook: '<svg class="social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796V23.93c5.737-.899 10.125-5.864 10.125-11.857z"/></svg>',
        instagram: '<svg class="social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>'
    };

    for (const [key, val] of Object.entries(data)) {
        if (val.show && val.url) {
            const a = document.createElement('a');
            a.href = val.url;
            a.target = '_blank';
            a.className = 'social-link-item';
            a.innerHTML = icons[key] || '';
            container.appendChild(a);
        }
    }
}

function fillSocialAdminForm(data) {
    if (data.mixcloud) {
        document.getElementById('social-mixcloud').value = data.mixcloud.url || '';
        document.getElementById('show-mixcloud').checked = data.mixcloud.show || false;
    }
    if (data.soundcloud) {
        document.getElementById('social-soundcloud').value = data.soundcloud.url || '';
        document.getElementById('show-soundcloud').checked = data.soundcloud.show || false;
    }
    if (data.facebook) {
        document.getElementById('social-facebook').value = data.facebook.url || '';
        document.getElementById('show-facebook').checked = data.facebook.show || false;
    }
    if (data.instagram) {
        document.getElementById('social-instagram').value = data.instagram.url || '';
        document.getElementById('show-instagram').checked = data.instagram.show || false;
    }
}
