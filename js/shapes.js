const SINGLE_NAIL_MODE = false;
const SINGLE_NAIL_ZOOM = 1;

const SHAPES = [
    {
        name: 'Square',
        description: 'Bold and classic, with a flat top and sharp corners.',
        bestFor: 'Strong, structured sets',
        length: 'Short to medium',
        durability: 4,
        image: 'images/shapes/square.png',
        imagePosition: 'center center',
        zoom: 1
    },
    {
        name: 'Round',
        description: 'Soft and natural, good for shorter nails and everyday wear.',
        bestFor: 'Short nails and everyday wear',
        length: 'Short',
        durability: 4,
        image: 'images/shapes/round.png',
        imagePosition: 'center center',
        zoom: 1
    },
    {
        name: 'Oval',
        description: 'Feminine and elongating, makes fingers look slender.',
        bestFor: 'Slender-looking fingers',
        length: 'Medium',
        durability: 3,
        image: 'images/shapes/oval.png',
        imagePosition: 'center center',
        zoom: 1
    },
    {
        name: 'Almond',
        description: 'Tapered, narrowing to a rounded point.',
        bestFor: 'Soft, elongating elegance',
        length: 'Medium to long',
        durability: 3,
        image: 'images/shapes/almond.png',
        imagePosition: 'center center',
        zoom: 1
    },
    {
        name: 'Coffin / Ballerina',
        description: 'Long, tapered, and flat-tipped for a dramatic finish.',
        bestFor: 'Dramatic statement sets',
        length: 'Long',
        durability: 2,
        image: 'images/shapes/coffin.png',
        imagePosition: 'center center',
        zoom: 1
    },
    {
        name: 'Stiletto',
        description: 'Long with a sharp pointed tip for an ultra-bold look.',
        bestFor: 'High-impact statement nails',
        length: 'Long',
        durability: 2,
        image: 'images/shapes/stiletto.png',
        imagePosition: 'center center',
        zoom: 1
    },
    {
        name: 'Squoval',
        description: 'Square edges softened into a gentle oval, the best of both.',
        bestFor: 'Most hands and nail beds',
        length: 'Short to medium',
        durability: 4,
        image: 'images/shapes/squoval.png',
        imagePosition: 'center center',
        zoom: 1
    },
    {
        name: 'Flare / Duck',
        description: 'Wide flared tip with a retro, expressive look.',
        bestFor: 'Retro, expressive looks',
        length: 'Long',
        durability: 2,
        image: 'images/shapes/flare.png',
        imagePosition: 'center center',
        zoom: 1
    }
];

const grid = document.getElementById('shapes-grid');
const cardStates = new WeakMap();
const cards = [];

const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
let reducedMotion = motionQuery.matches;
let finePointer = pointerQuery.matches;

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
}

function resetTilt(card) {
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
    card.style.setProperty('--photo-x', '0px');
    card.style.setProperty('--photo-y', '0px');
    card.style.setProperty('--glare-x', '50%');
    card.style.setProperty('--glare-y', '50%');
}

function createDurability(value) {
    const row = createElement('div', 'shape-durability');
    const label = createElement('span', 'shape-durability__label', 'Durability');
    const dots = createElement('span', 'dots');
    dots.setAttribute('role', 'img');
    dots.setAttribute('aria-label', `Durability: ${value} out of 5`);

    for (let index = 1; index <= 5; index += 1) {
        const dot = createElement('span', index <= value ? 'dot is-filled' : 'dot');
        dots.appendChild(dot);
    }

    row.append(label, dots);
    return row;
}

function createMetaRow(label, value) {
    const row = createElement('div', 'shape-meta__row');
    row.append(
        createElement('dt', '', label),
        createElement('dd', '', value)
    );
    return row;
}

function createCard(shape, index) {
    const card = createElement('article', 'shape-card');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-expanded', 'false');
    card.style.setProperty('--i', index);

    const backId = `shape-details-${index}`;
    card.setAttribute('aria-controls', backId);

    const tilt = createElement('div', 'shape-card__tilt');
    const flipper = createElement('div', 'shape-card__flipper');
    const front = createElement('div', 'shape-face shape-face--front');
    const back = createElement('div', 'shape-face shape-face--back');
    back.id = backId;

    const photo = createElement('div', 'shape-photo');
    photo.style.setProperty(
        '--image-position',
        SINGLE_NAIL_MODE ? 'center center' : (shape.imagePosition || 'center 30%')
    );
    photo.style.setProperty(
        '--zoom',
        String(SINGLE_NAIL_MODE ? SINGLE_NAIL_ZOOM : (shape.zoom || 1.4))
    );

    const placeholder = createElement('div', 'shape-photo__placeholder');
    placeholder.appendChild(createElement('span', '', shape.name));

    const image = document.createElement('img');
    image.alt = `${shape.name} nail shape. ${shape.description}`;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.width = 400;
    image.height = 500;

    const showImage = () => {
        photo.classList.add('is-loaded');
        photo.classList.remove('is-missing');
    };

    const showPlaceholder = () => {
        photo.classList.remove('is-loaded');
        photo.classList.add('is-missing');
        image.hidden = true;
    };

    image.addEventListener('load', showImage);
    image.addEventListener('error', showPlaceholder);
    image.src = shape.image;

    photo.append(placeholder, image);

    const glare = createElement('div', 'shape-glare');
    glare.setAttribute('aria-hidden', 'true');

    const frontInfo = createElement('div', 'shape-front-info');
    frontInfo.append(
        createElement('h2', 'shape-name', shape.name),
        createElement('p', 'shape-summary', shape.description)
    );

    front.append(photo, glare, frontInfo);
    front.setAttribute('aria-hidden', 'false');

    const backName = createElement('h3', 'shape-back-name', shape.name);
    const backDescription = createElement('p', 'shape-back-description', shape.description);
    const meta = createElement('dl', 'shape-meta');
    meta.append(
        createMetaRow('Best for', shape.bestFor),
        createMetaRow('Recommended length', shape.length)
    );

    const bookLink = createElement('a', 'book-link', 'Book This Shape');
    bookLink.href = 'index.html#book';
    bookLink.tabIndex = -1;
    bookLink.setAttribute('aria-label', `Book the ${shape.name} shape`);

    back.append(backName, backDescription, meta, createDurability(shape.durability), bookLink);
    back.setAttribute('aria-hidden', 'true');

    flipper.append(front, back);
    tilt.appendChild(flipper);
    card.appendChild(tilt);

    const label = `${shape.name} nail shape. ${shape.description}`;

    const setFlipped = (flipped) => {
        card.classList.toggle('is-flipped', flipped);
        card.setAttribute('aria-expanded', String(flipped));
        front.setAttribute('aria-hidden', String(flipped));
        back.setAttribute('aria-hidden', String(!flipped));
        bookLink.tabIndex = flipped ? 0 : -1;

        if (flipped) {
            resetTilt(card);
            card.setAttribute(
                'aria-label',
                `${label} Details are open. Activate to flip back, or press Escape.`
            );
        } else {
            card.setAttribute('aria-label', `${label} Activate to see details.`);
        }
    };

    setFlipped(false);

    cardStates.set(card, { setFlipped });

    card.addEventListener('click', (event) => {
        if (event.target.closest('a')) return;
        const state = cardStates.get(card);
        state.setFlipped(!card.classList.contains('is-flipped'));
    });

    card.addEventListener('keydown', (event) => {
        if (event.target.closest('a')) return;
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            const state = cardStates.get(card);
            state.setFlipped(!card.classList.contains('is-flipped'));
        }
    });

    card.addEventListener('pointermove', (event) => {
        if (!finePointer || reducedMotion || card.classList.contains('is-flipped')) return;

        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        const maxTilt = 12;

        card.style.setProperty('--tilt-x', `${(-y * maxTilt * 2).toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${(x * maxTilt * 2).toFixed(2)}deg`);
        card.style.setProperty('--photo-x', `${(-x * 16).toFixed(2)}px`);
        card.style.setProperty('--photo-y', `${(-y * 16).toFixed(2)}px`);
        card.style.setProperty('--glare-x', `${((x + 0.5) * 100).toFixed(2)}%`);
        card.style.setProperty('--glare-y', `${((y + 0.5) * 100).toFixed(2)}%`);
    });

    card.addEventListener('pointerleave', () => resetTilt(card));

    cards.push(card);
    return card;
}

SHAPES.forEach((shape, index) => {
    grid.appendChild(createCard(shape, index));
});

if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -8% 0px'
    });

    cards.forEach((card) => observer.observe(card));
} else {
    cards.forEach((card) => card.classList.add('is-visible'));
}

document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;

    document.querySelectorAll('.shape-card.is-flipped').forEach((card) => {
        const state = cardStates.get(card);
        if (state) state.setFlipped(false);
    });
});

function syncMotionPreference() {
    reducedMotion = motionQuery.matches;

    if (reducedMotion) {
        cards.forEach((card) => {
            resetTilt(card);
            card.classList.add('is-visible');
        });
    }
}

function syncPointerPreference() {
    finePointer = pointerQuery.matches;

    if (!finePointer) {
        cards.forEach(resetTilt);
    }
}

if (typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', syncMotionPreference);
    pointerQuery.addEventListener('change', syncPointerPreference);
} else {
    motionQuery.addListener(syncMotionPreference);
    pointerQuery.addListener(syncPointerPreference);
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
