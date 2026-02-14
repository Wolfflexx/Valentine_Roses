// CONFIGURACIÓN
const config = {
    roseColor: { h: 345, s: 80, l: 40 },
    stemColor: '#1b5e20',
    centerColor: '#4a0404',
    particleCount: 40
};

// DATOS DE LAS ROSAS
const rosesData = [
    { title: "Te volví a escribir jaja", text: "Aún recuerdo el día en que navegaba por Instagram y apareciste. Envié esa solicitud sin pensarlo demasiado… y mientras más pasa el tiempo, más claro tengo algo: si la vida me dejara elegir, la volvería a enviar una y mil veces." },
    { title: "Y aquí estamos otra vez xd", text: "Después de tanto tiempo, volver a hablar contigo fue como retomar algo que nunca se había ido del todo. Sin forzar nada, sin explicaciones largas. Solo fue natural… como si el tiempo hubiera esperado." },
    { title: "Esos pequeños momentos", text: "Amo esas pequeñas cosas que solo nosotros entendemos. Las risas sin motivo, las bromas simples, y esos momentos que no parecen importantes… pero que se quedan conmigo todo el día." },
    { title: "Lo que me enganchó", text: "Cuando salimos a pasear a los perros y corres delante de mí, muchas veces no me quedo atrás porque no pueda seguirte… me quedo atrás porque me gusta mirarte, admirarte, y pensar lo afortunado que soy de tenerte cerca." },
    { title: "Lo que me dejaste ver", text: "Estar contigo es simple. No tengo que pensar demasiado ni fingir nada. Tu voz se vuelve una melodía tranquila, y cada momento a tu lado se siente como un lugar seguro." },
    { title: "Esto que tenemos", text: "Cuando te veo dormir, veo a la persona que quiero cuidar. Cuando compartes tu comida con los perros, cuando te cansas, cuando sonríes sin darte cuenta… ahí entiendo que querer también es cuidar en silencio." },
    { title: "Lo que nunca cambiará", text: "Esto no es para decir algo nuevo. Es solo para reforzar lo que ya sabes. Que te quiero, que te elijo, y que si pudiera volver atrás, volvería a escribirte sin pensarlo." }
];

// ELEMENTOS DOM
const startBtn = document.getElementById('start-btn');
const introScreen = document.getElementById('intro');
const gardenScreen = document.getElementById('garden');
const rosesContainer = document.getElementById('roses-container');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const closeModalBtn = document.querySelector('.close-modal');
const outroScreen = document.getElementById('outro');
const finalMessageContainer = document.getElementById('final-message-container');
const repeatBtn = document.getElementById('repeat-btn');
const canvas = document.getElementById('garden-canvas');
const ctx = canvas.getContext('2d');

// ESTADO GLOBAL
let roses = [];
let particles = [];
let explosionPetals = []; // Array nuevo para la explosión final
let time = 0;
let currentRoseIndex = 0;
let animationId = null;
let gameActive = false; // Flag para controlar si se dibuja o no

// ---------------------------------------------------------------------
// CLASES FÍSICAS
// ---------------------------------------------------------------------

class Stem {
    constructor(x, y, len, angle, curvature) {
        this.x = x;
        this.y = y;
        this.len = len;
        this.angle = angle * (Math.PI / 180);
        this.curvature = curvature;
        this.growth = 0;
        this.targetGrowth = 1;
        this.speed = 0.003 + Math.random() * 0.002;
    }

    update() {
        if (this.growth < this.targetGrowth) {
            this.growth += this.speed;
        }
    }

    getPoint(t) {
        const endX = this.x + Math.cos(this.angle - Math.PI / 2) * this.len;
        const endY = this.y + Math.sin(this.angle - Math.PI / 2) * this.len;
        const midX = (this.x + endX) / 2;
        const midY = (this.y + endY) / 2;
        const sway = Math.sin(time * 0.002 + this.x) * 10 * this.growth;
        const controlX = midX + this.curvature * 100 + sway;
        const controlY = midY;
        const oneMinusT = 1 - t;
        const x = oneMinusT * oneMinusT * this.x + 2 * oneMinusT * t * controlX + t * t * endX;
        const y = oneMinusT * oneMinusT * this.y + 2 * oneMinusT * t * controlY + t * t * endY;
        return { x, y };
    }

    getAngle(t) {
        const endX = this.x + Math.cos(this.angle - Math.PI / 2) * this.len;
        const endY = this.y + Math.sin(this.angle - Math.PI / 2) * this.len;
        const midX = (this.x + endX) / 2;
        const midY = (this.y + endY) / 2;
        const sway = Math.sin(time * 0.002 + this.x) * 10 * this.growth;
        const controlX = midX + this.curvature * 100 + sway;
        const controlY = midY;
        const dx = 2 * (1 - t) * (controlX - this.x) + 2 * t * (endX - controlX);
        const dy = 2 * (1 - t) * (controlY - this.y) + 2 * t * (endY - controlY);
        return Math.atan2(dy, dx);
    }

    draw() {
        if (this.growth < 0.01) return;
        const points = [];
        for (let t = 0; t <= this.growth; t += 0.05) {
            points.push(this.getPoint(t));
        }
        points.push(this.getPoint(this.growth));
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = '#1b5e20';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }
}

class Leaf {
    constructor(stem, attachT, side) {
        this.stem = stem;
        this.attachT = attachT;
        this.side = side;
        this.size = 0;
        this.targetSize = 1;
    }

    update() {
        if (this.stem.growth > this.attachT) {
            if (this.size < this.targetSize) {
                this.size += 0.02;
            }
        }
    }

    draw() {
        if (this.size < 0.1) return;
        const origin = this.stem.getPoint(this.attachT);
        const stemAngle = this.stem.getAngle(this.attachT);
        const leafAngle = stemAngle + (this.side * Math.PI / 3);
        ctx.save();
        ctx.translate(origin.x, origin.y);
        ctx.rotate(leafAngle);
        ctx.scale(this.size, this.size);
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(10, -5, 20, -10, 30, 0);
        ctx.bezierCurveTo(20, 10, 10, 5, 0, 0);
        ctx.fill();
        ctx.strokeStyle = '#144414';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
    }
}

// Helper for responsive scale - AUMENTADO 20% MÁS
function getMobileScale() {
    if (window.innerWidth < 480) return 0.48;  // Era 0.4, ahora 20% más grande
    if (window.innerWidth < 768) return 0.6;   // Era 0.5, ahora 20% más grande
    return 1;  // Desktop: 100%
}

class RoseHead {
    constructor(stem) {
        this.stem = stem;
        this.bloomBy = 0;
        this.bloomed = false;
        this.exploding = false; // Estado para cuando explota al final
        this.visible = true;
    }

    bloom() {
        this.bloomed = true;
    }

    explode() {
        this.exploding = true;
        this.visible = false; // Hide the drawn flower
        // Generate particles at tip
        const tip = this.stem.getPoint(1);
        for (let i = 0; i < 40; i++) {
            explosionPetals.push(new ExplosionPetal(tip.x, tip.y));
        }
    }

    update() {
        if (this.exploding) return; // Stop logic if exploded
        if (this.bloomed && this.bloomBy < 1) {
            this.bloomBy += 0.01;
        }
    }

    draw() {
        if (!this.visible || this.stem.growth < 0.99) return;

        const origin = this.stem.getPoint(1);
        const angle = this.stem.getAngle(1) + Math.PI / 2;

        ctx.save();
        ctx.translate(origin.x, origin.y);
        ctx.rotate(angle);

        // Apply Mobile Scale - AHORA REDUCE MÁS EN MÓVIL
        const mobScale = getMobileScale();
        const baseScale = this.bloomBy > 0 ? 0.2 + (this.bloomBy * 1.5) : 0;
        const finalScale = baseScale * mobScale;

        if (finalScale <= 0) { ctx.restore(); return; }

        ctx.scale(finalScale, finalScale);

        // Calyx
        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        for (let i = -2; i <= 2; i++) {
            ctx.moveTo(0, 0);
            ctx.lineTo(i * 3, 10);
            ctx.lineTo(0, 0);
        }
        ctx.stroke();

        // Petals
        const grad = ctx.createRadialGradient(0, -20, 0, 0, -20, 60);
        grad.addColorStop(0, '#500000');
        grad.addColorStop(0.5, '#b11226');
        grad.addColorStop(1, '#e53935');
        ctx.fillStyle = grad;

        // Outer
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-30, -10, -30, -50, 0, -70);
        ctx.bezierCurveTo(30, -50, 30, -10, 0, 0);
        ctx.fill();

        // Middle
        ctx.fillStyle = 'rgba(177, 18, 38, 0.9)';
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.bezierCurveTo(-25, -20, -25, -60, 0, -80);
        ctx.bezierCurveTo(25, -60, 25, -20, 0, -10);
        ctx.fill();

        // Inner
        ctx.fillStyle = '#6d0000';
        ctx.beginPath();
        ctx.arc(0, -30, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
    }
}

class RoseEntity {
    constructor(d, index, total) {
        this.index = index;

        // Responsive Fan Logic
        const isMobile = window.innerWidth < 768;
        const isSmallMobile = window.innerWidth < 480;
        const fanAngle = isSmallMobile ? 45 : (isMobile ? 50 : 60);

        const startAngle = -fanAngle / 2;
        const step = fanAngle / (total - 1);
        const myAngle = startAngle + (index * step);

        // Responsive Length Logic - TALLOS MÁS CORTOS EN MÓVIL
        const baseLen = isSmallMobile ? canvas.height * 0.35 : (isMobile ? canvas.height * 0.40 : canvas.height * 0.6);
        const len = baseLen + Math.random() * (isMobile ? 40 : 100);

        // CENTRAR VERTICALMENTE EN MÓVIL - Ajustar posición Y inicial
        const startY = isMobile ? canvas.height * 0.7 : canvas.height + 20;

        this.stem = new Stem(canvas.width / 2, startY, len, myAngle, (Math.random() - 0.5) * 1.5);
        this.head = new RoseHead(this.stem);

        this.leaves = [];
        this.leaves.push(new Leaf(this.stem, 0.3, -1));
        this.leaves.push(new Leaf(this.stem, 0.5, 1));
        this.leaves.push(new Leaf(this.stem, 0.7, -1));
    }

    update() {
        this.stem.update();
        this.leaves.forEach(l => l.update());
        this.head.update();
    }

    draw() {
        this.stem.draw();
        this.leaves.forEach(l => l.draw());
        this.head.draw();
    }

    checkHit(mx, my) {
        if (!this.head.bloomed || !this.head.visible) return false;
        const tip = this.stem.getPoint(1);
        const dx = mx - tip.x;
        const dy = my - tip.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Adjust hit area for mobile - MÁS GRANDE PARA FACILITAR CLICK
        const hitRadius = window.innerWidth < 480 ? 60 : (window.innerWidth < 768 ? 70 : 60);
        return dist < hitRadius;
    }
}

// ---------------------------------------------------------------------
// PARTICLES (EXPLOSIÓN)
// ---------------------------------------------------------------------
class ExplosionPetal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4; // Spread speed
        this.vy = (Math.random() - 1) * 3;   // Initial up push
        this.gravity = 0.05 + Math.random() * 0.05;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 5;
        this.size = Math.random() * 5 + 3;
        this.opacity = 1;
        this.color = `hsl(${340 + Math.random() * 20}, 80%, 50%)`;
    }

    update() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        this.opacity -= 0.005; // Slow fade
    }

    draw() {
        if (this.opacity <= 0) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        // Draw simple petal shape
        ctx.beginPath();
        ctx.ellipse(0, 0, this.size, this.size / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// ---------------------------------------------------------------------
// PARTICLES (AMBIENTE)
// ---------------------------------------------------------------------
class Particle {
    constructor() { this.init(); }
    init() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedY = Math.random() * 0.5 + 0.2;
        this.opacity = Math.random() * 0.5 + 0.2;
    }
    update() {
        this.y -= this.speedY;
        if (this.y < 0) {
            this.y = canvas.height;
            this.x = Math.random() * canvas.width;
        }
    }
    draw() {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ---------------------------------------------------------------------
// UI & LOGIC
// ---------------------------------------------------------------------

function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    startBtn.addEventListener('click', startSequence);
    closeModalBtn.addEventListener('click', closeModal);
    repeatBtn.addEventListener('click', reset);

    // Canvas Click
    canvas.addEventListener('click', handleCanvasClick);

    // Default: Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function handleCanvasClick(e) {
    if (!gameActive) return; // No click if not active or in sequence
    // Check if waiting for explosion? Should prevent click?
    // User requested "el usuario ya no puede hacer click... durante secuencia"
    // So if currentRoseIndex >= roses.length (finished), block interaction.
    // Check logic inside handleRoseClick

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = roses.length - 1; i >= 0; i--) {
        if (roses[i].checkHit(x, y)) {
            handleRoseClick(i);
            break;
        }
    }
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function startSequence() {
    gameActive = true;
    introScreen.classList.remove('active');
    introScreen.classList.add('hidden');
    gardenScreen.classList.remove('hidden');
    gardenScreen.classList.add('active');

    // Init arrays
    roses = [];
    particles = [];
    explosionPetals = [];
    currentRoseIndex = 0;

    // Start Loop
    if (animationId) cancelAnimationFrame(animationId);
    animate();

    // Create roses
    rosesData.forEach((d, i) => {
        roses.push(new RoseEntity(d, i, rosesData.length));
    });

    // Create dust - MÁS PARTÍCULAS EN MÓVIL para llenar espacio vacío
    const particleCount = window.innerWidth < 768 ? 80 : 50;
    for (let i = 0; i < particleCount; i++) particles.push(new Particle());

    // Auto-bloom first
    setTimeout(() => {
        bloomRose(0);
    }, 2000);
}

function bloomRose(index) {
    if (index < roses.length) {
        roses[index].head.bloom();
        currentRoseIndex = index;
    } else {
        finish();
    }
}

function handleRoseClick(index) {
    // Prevent clicking other roses out of overflow
    if (index !== currentRoseIndex && index <= currentRoseIndex) {
        // Allow re-reading old roses? User didn't specify.
        // Assuming linear flow, we usually click the newly bloomed one.
        if (roses[index].head.bloomed) {
            openModal(index);
        }
    } else {
        // If it's the current active one
        if (roses[index].head.bloomed) {
            openModal(index);
        }
    }
}

function openModal(index) {
    const d = rosesData[index];
    modalTitle.innerText = d.title;
    modalText.innerText = d.text;
    modal.classList.remove('hidden');
    void modal.offsetWidth;
    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
    setTimeout(() => {
        modal.classList.add('hidden');
        if (currentRoseIndex + 1 < roses.length) {
            bloomRose(currentRoseIndex + 1);
        } else {
            finish();
        }
    }, 500);
}

function finish() {
    // TRIGGER EXPLOSION OF FINAL ROSE
    // TRIGGER EXPLOSION OF ALL ROSES
    roses.forEach(rose => {
        rose.head.explode(); // Spawns particles for each rose
    });

    // Wait for explosion to settle (2.5s)
    setTimeout(() => {
        // Start Outro transition
        gardenScreen.style.opacity = 0;

        setTimeout(() => {
            gardenScreen.classList.add('hidden');
            outroScreen.classList.remove('hidden');
            outroScreen.classList.add('active');

            showFinalTexts();
        }, 2000);
    }, 2500);
}

function showFinalTexts() {
    const lines = [
        "No sé qué va a pasar mañana,",
        "pero sí sé lo que siento hoy…",
        "y es tan real, que no se va con el tiempo.",
        "Porque aunque el mundo se mueva,",
        "aunque todo cambie…",
        "yo no voy a cambiar lo que siento por ti."
    ];
    finalMessageContainer.innerHTML = '';

    // Create all lines immediately for CSS to animate
    lines.forEach((txt, i) => {
        const p = document.createElement('p');
        p.innerText = txt;
        p.classList.add('final-line'); // Logic class
        p.style.animationDelay = `${i * 1.2}s`; // Stagger delay via JS-to-CSS
        finalMessageContainer.appendChild(p);
    });

    // Show Repeat Button after all text (approx 8s)
    setTimeout(() => {
        repeatBtn.classList.remove('hidden');
        repeatBtn.style.opacity = 1;
    }, lines.length * 1200 + 2000);
}

// RESET COMPLETO
function reset() {
    // 1. Stop Animation
    gameActive = false;
    if (animationId) cancelAnimationFrame(animationId);
    animationId = null;

    // 2. Clear Data
    roses = [];
    particles = [];
    explosionPetals = [];
    currentRoseIndex = 0;

    // 3. Clean UI
    outroScreen.classList.remove('active');
    outroScreen.classList.add('hidden');

    gardenScreen.style.opacity = 1; // Reset opacity for next time
    gardenScreen.classList.remove('active');
    gardenScreen.classList.add('hidden');

    introScreen.classList.remove('hidden');
    introScreen.classList.add('active');

    repeatBtn.classList.add('hidden');
    repeatBtn.style.opacity = 0;

    finalMessageContainer.innerHTML = '';

    // 4. Force Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function animate() {
    if (!gameActive) return; // Safety check

    animationId = requestAnimationFrame(animate);
    time++;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Particles (Dust)
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Draw Roses
    roses.forEach(r => {
        r.update();
        r.draw();
    });

    // Draw Explosion Petals
    explosionPetals.forEach(p => {
        p.update();
        p.draw();
    });
}

document.addEventListener('DOMContentLoaded', init);
