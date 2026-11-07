const TYPES = [
    {
        name: 'Gel',
        video: 'videos/gel.webp',
        process: [
            'Nails are prepped, buffed and cleansed.',
            'A thin base gel is applied and cured under a UV/LED lamp.',
            'Two coats of colour are applied, each cured separately.',
            'A glossy top coat is cured and the nail is wiped clean.'
        ]
    },
    {
        name: 'Acrylic',
        video: 'videos/acrylic.webp',
        process: [
            'A tip or form is fitted to extend the nail.',
            'A brush picks up liquid and powder to form a bead.',
            'The bead is sculpted over the nail and air-dries hard.',
            'It is filed, shaped, then coloured and sealed.'
        ]
    },
    {
        name: 'Press-on',
        video: 'videos/press-on.webp',
        process: [
            'Measure and pick the size that fits each nail.',
            'Cleanse and lightly buff the natural nail.',
            'Apply nail glue or an adhesive tab.',
            'Press and hold for 10 to 30 seconds.'
        ]
    },
    {
        name: 'Builder Gel',
        video: 'videos/builder-gel.webp',
        process: [
            'Nails are prepped and a base gel is cured.',
            'Thick builder gel is applied to build strength and shape.',
            'It is cured, then filed into the final shape.',
            'Colour and a top coat are added and cured.'
        ]
    },
    {
        name: 'Dip Powder',
        video: 'videos/dip-powder.webp',
        process: [
            'Nails are prepped and a base resin is brushed on.',
            'The finger is dipped into coloured powder and tapped off.',
            'Dipping repeats for 2 to 3 layers of colour.',
            'An activator and top coat seal and harden it.'
        ]
    },
    {
        name: 'Fibreglass',
        video: 'videos/fiberglass.webp',
        process: [
            'Nails are prepped and cleansed.',
            'Fibreglass mesh or silk is cut to fit and placed on the nail.',
            'Resin and activator bond and harden it.',
            'It is buffed smooth and sealed with gel or polish.'
        ]
    }
];

const carouselHost = document.getElementById('nailtypes-carousel');
const cards = [];
const cardStates = new Map();
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let reducedMotion = motionQuery.matches;
let activeCard = null;
let activeGlow = null;
let carousel = null;

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
}

function pauseAndRewind(video) {
    if (video && typeof video.pause === 'function') video.pause();
    if (!video || typeof video.currentTime !== 'number') return;
    try {
        video.currentTime = 0;
    } catch (_) {
        // Some browsers defer seeking until metadata is available.
    }
}

function stopOthers(card) {
    cards.forEach((item) => {
        if (item.card !== card && item.card.classList.contains('is-active')) {
            deactivate(item.card, item.video);
        }
    });
}

async function playVideo(video) {
    if (!video || video.dataset.failed === 'true') return;
    if (typeof video.play !== 'function') return;
    try {
        await video.play();
    } catch (_) {
        console.warn(`Unable to play video: ${video.currentSrc || video.src}`);
    }
}

function createGlow(card) {
    if (typeof window.createGlowBorder !== 'function') return;
    if (activeGlow && activeGlow.card === card) {
        activeGlow.border.start();
        return;
    }
    if (activeGlow) {
        activeGlow.border.destroy();
        activeGlow = null;
    }
    const tilt = card.querySelector('.nailtype-card__tilt');
    if (!tilt) return;
    const border = window.createGlowBorder(tilt);
    if (!border) return;
    border.start();
    activeGlow = { card, border };
}

function destroyGlow(card) {
    if (!activeGlow || activeGlow.card !== card) return;
    activeGlow.border.destroy();
    activeGlow = null;
}

function activate(card, video, manual) {
    stopOthers(card);
    activeCard = card;
    card.classList.add('is-active');
    card.setAttribute('aria-expanded', 'true');
    createGlow(card);

    if (!reducedMotion || manual) {
        playVideo(video);
        const button = card.querySelector('.manual-play');
        if (button) button.textContent = 'Pause';
    }
}

function deactivate(card, video) {
    if (!card) return;
    card.classList.remove('is-active');
    card.setAttribute('aria-expanded', 'false');
    pauseAndRewind(video);
    destroyGlow(card);
    const button = card.querySelector('.manual-play');
    if (button) button.textContent = 'Play';
    if (activeCard === card) activeCard = null;
}

function toggleCardVideo(card, video) {
    if (card.classList.contains('is-active')) {
        pauseAndRewind(video);
        const button = card.querySelector('.manual-play');
        if (button) button.textContent = 'Play';
    } else {
        activate(card, video, true);
    }
}

function createCard(type, index) {
    const card = createElement('article', 'nailtype-card');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-expanded', 'false');
    card.style.setProperty('--i', index);

    const tilt = createElement('div', 'nailtype-card__tilt');
    const inner = createElement('div', 'nailtype-card__inner');
    const placeholder = createElement('div', 'nailtype-placeholder');
    placeholder.appendChild(createElement('span', '', type.name));

    const video = document.createElement('img');
    video.className = 'nailtype-animation';
    video.setAttribute('alt', `${type.name} nail application animation`);
    video.src = type.video;

    video.addEventListener('load', () => {
        card.classList.add('has-video');
    });
    video.addEventListener('error', () => {
        if (!video.error) return;
        video.dataset.failed = 'true';
        card.classList.remove('has-video');
        console.warn(`Missing or unsupported video: ${type.video}`);
    });

    if (typeof video.load === 'function') video.load();

    const processOverlay = createElement('div', 'process-overlay');
    processOverlay.appendChild(createElement('h2', 'process-name', type.name));
    const processLines = createElement('ul', 'process-lines');
    type.process.forEach((line, lineIndex) => {
        const item = createElement('li', '', line);
        item.style.setProperty('--line', lineIndex + 1);
        processLines.appendChild(item);
    });
    processOverlay.appendChild(processLines);
    inner.append(placeholder, video, processOverlay);

    const manualPlay = createElement('button', 'manual-play', 'Play');
    manualPlay.type = 'button';
    manualPlay.hidden = !reducedMotion;
    manualPlay.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleCardVideo(card, video);
    });
    inner.appendChild(manualPlay);

    tilt.appendChild(inner);
    card.appendChild(tilt);

    const state = { card, video, type };
    cards.push(state);
    cardStates.set(card, state);

    card.addEventListener('focus', () => activate(card, video, false));
    card.addEventListener('blur', () => deactivate(card, video));
    card.addEventListener('mouseenter', () => {
        if (reducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        activate(card, video, false);
    });
    card.addEventListener('mouseleave', () => {
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        deactivate(card, video);
    });

    return card;
}

const COPIES = 3;
for (let copy = 0; copy < COPIES; copy += 1) {
    TYPES.forEach((type, index) => createCard(type, copy * TYPES.length + index));
}

const initialCardWidth = Math.min(340, Math.max(240, window.innerWidth - 48));
const initialCardHeight = Math.round(initialCardWidth * 1.25);

if (carouselHost && typeof window.createSmearCarousel === 'function') {
    carousel = window.createSmearCarousel(carouselHost, {
        items: cards.map((state) => state.card),
        cardWidth: initialCardWidth,
        cardHeight: initialCardHeight,
        gap: 26,
        rounded: 22,
        rotation: 90,
        speed: 40,
        background: 'transparent',
        edgeColor: '#17121D',
        reducedMotion,
        onFocusChange: (card) => {
            if (!card) {
                if (activeCard && !activeCard.contains(document.activeElement)) {
                    const state = cardStates.get(activeCard);
                    if (state) deactivate(state.card, state.video);
                }
                return;
            }
            const state = cardStates.get(card);
            if (state) activate(state.card, state.video, false);
        },
        onCardClick: (card) => {
            const state = cardStates.get(card);
            if (state) toggleCardVideo(state.card, state.video);
        }
    });
}

function updateMediaPreferences() {
    reducedMotion = motionQuery.matches;
    cards.forEach((state) => {
        const button = state.card.querySelector('.manual-play');
        if (button) button.hidden = !reducedMotion;
        if (reducedMotion && state.card.classList.contains('is-active')) {
            pauseAndRewind(state.video);
            if (button) button.textContent = 'Play';
        }
    });
    if (carousel) carousel.setReducedMotion(reducedMotion);
}

motionQuery.addEventListener('change', updateMediaPreferences);

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cards.forEach((state) => {
            if (!state.video.paused) pauseAndRewind(state.video);
        });
    }
});

window.addEventListener('pagehide', () => {
    cards.forEach((state) => pauseAndRewind(state.video));
    if (carousel) {
        carousel.destroy();
        carousel = null;
    }
    if (activeGlow) {
        activeGlow.border.destroy();
        activeGlow = null;
    }
});

document.getElementById('year').textContent = new Date().getFullYear();
