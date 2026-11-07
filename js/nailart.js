/* 3D nail art scroll — add or rename image paths in the ART array below. */

const SHOW_LABELS = false;

const ART = [
    { src: 'images/arts/gothic.jpg', name: 'Gothic' },
    { src: 'images/arts/chrome.jpg', name: 'Chrome' },
    { src: 'images/arts/french.jpg', name: 'French' },
    { src: 'images/arts/ombre.jpg', name: 'Ombre' },
    { src: 'images/arts/marble.jpg', name: 'Marble' },
    { src: 'images/arts/cateye.jpg', name: 'Cat Eye' },
    { src: 'images/arts/glitter.jpg', name: 'Glitter' },
    { src: 'images/arts/floral.jpg', name: 'Floral' },
    { src: 'images/arts/charms.jpg', name: 'Charms' },
    { src: 'images/arts/minimal.jpg', name: 'Minimal' },
    { src: 'images/arts/tortoiseshell.jpg', name: 'Tortoiseshell' },
    { src: 'images/arts/jelly.jpg', name: 'Jelly' }
];

(function () {
    'use strict';

    const COPIES_PER_ROW = 5;
    const ROW_DURATIONS = [74, 92, 66];
    const SECTION_SELECTOR = '.nail-art';
    const SCENE_SELECTOR = '[data-nail-scene]';

    let tracks = [];
    let rateFrame = 0;
    let currentRate = 1;
    let targetRate = 1;
    let lastRateTime = 0;
    let parallaxFrame = 0;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

    function createCard(item) {
        const card = document.createElement('figure');
        card.className = 'nail-art__card';

        const media = document.createElement('div');
        media.className = 'nail-art__media';

        const img = document.createElement('img');
        img.className = 'nail-art__img';
        img.alt = item.name + ' nail art close-up';
        img.loading = 'lazy';
        img.decoding = 'async';

        img.addEventListener('load', function () {
            card.classList.add('is-loaded');
        }, { once: true });

        img.addEventListener('error', function () {
            card.classList.add('is-missing');
            card.classList.remove('is-loaded');
        }, { once: true });

        img.src = item.src;
        media.appendChild(img);
        card.appendChild(media);

        if (SHOW_LABELS) {
            const label = document.createElement('figcaption');
            label.className = 'nail-art__label';
            label.textContent = item.name;
            card.appendChild(label);
        }

        return card;
    }

    function updateLoopDistances() {
        tracks.forEach(function (track) {
            const set = track.querySelector('.nail-art__set');
            if (!set) return;

            const width = set.offsetWidth;
            if (width > 0) {
                track.style.setProperty('--na-loop', width + 'px');
            }
        });
    }

    function getTrackAnimations(track) {
        return track.getAnimations().filter(function (animation) {
            return typeof animation.animationName === 'string' &&
                animation.animationName.indexOf('na-marquee') === 0;
        });
    }

    function applyPlaybackRate(rate) {
        tracks.forEach(function (track) {
            getTrackAnimations(track).forEach(function (animation) {
                animation.playbackRate = rate;
            });
        });
    }

    function stepPlaybackRate(now) {
        const delta = Math.min(64, Math.max(1, now - lastRateTime));
        lastRateTime = now;
        const ease = 1 - Math.exp(-delta / 220);

        currentRate += (targetRate - currentRate) * ease;
        applyPlaybackRate(currentRate);

        if (Math.abs(targetRate - currentRate) > 0.001) {
            rateFrame = window.requestAnimationFrame(stepPlaybackRate);
        } else {
            currentRate = targetRate;
            applyPlaybackRate(currentRate);
            rateFrame = 0;
        }
    }

    function rampPlaybackRate(rate) {
        targetRate = rate;
        if (rateFrame) return;

        lastRateTime = performance.now();
        rateFrame = window.requestAnimationFrame(stepPlaybackRate);
    }

    function updateParallax() {
        parallaxFrame = 0;

        if (reducedMotion.matches) {
            section.style.setProperty('--na-parallax-z', '0px');
            section.style.setProperty('--na-parallax-rx', '0deg');
            return;
        }

        const rect = section.getBoundingClientRect();
        const viewportHeight = window.innerHeight || 1;
        const progress = Math.max(0, Math.min(1, (viewportHeight - rect.top) / (viewportHeight + rect.height)));
        const centered = progress - 0.5;

        section.style.setProperty('--na-parallax-z', (centered * 34).toFixed(2) + 'px');
        section.style.setProperty('--na-parallax-rx', (centered * 1.7).toFixed(3) + 'deg');
    }

    function requestParallax() {
        if (!parallaxFrame) {
            parallaxFrame = window.requestAnimationFrame(updateParallax);
        }
    }

    const section = document.querySelector(SECTION_SELECTOR);
    const scene = section ? section.querySelector(SCENE_SELECTOR) : null;

    if (!section || !scene) return;

    section.classList.add('is-paused');

    const groups = [];
    for (let index = 0; index < ART.length; index += 4) {
        groups.push(ART.slice(index, index + 4));
    }

    groups.forEach(function (group, rowIndex) {
        const row = document.createElement('div');
        row.className = 'nail-art__row';
        row.style.setProperty('--na-duration', (ROW_DURATIONS[rowIndex] || 76) + 's');

        const track = document.createElement('div');
        track.className = 'nail-art__track';

        for (let copy = 0; copy < COPIES_PER_ROW; copy += 1) {
            const set = document.createElement('div');
            set.className = 'nail-art__set';

            if (copy > 0) {
                set.setAttribute('aria-hidden', 'true');
            }

            group.forEach(function (item) {
                set.appendChild(createCard(item));
            });

            track.appendChild(set);
        }

        row.appendChild(track);
        scene.appendChild(row);
        tracks.push(track);
    });

    window.requestAnimationFrame(function () {
        updateLoopDistances();
        window.requestAnimationFrame(updateLoopDistances);
    });

    window.addEventListener('load', updateLoopDistances);
    window.addEventListener('resize', updateLoopDistances);

    if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(updateLoopDistances);
        tracks.forEach(function (track) {
            if (track.firstElementChild) {
                resizeObserver.observe(track.firstElementChild);
            }
        });
    }

    if ('IntersectionObserver' in window) {
        const visibilityObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                section.classList.toggle('is-paused', !entry.isIntersecting);
            });
        }, { threshold: 0.01 });

        visibilityObserver.observe(section);
    } else {
        section.classList.remove('is-paused');
    }

    if (finePointer.matches && !reducedMotion.matches) {
        section.addEventListener('pointerenter', function () {
            rampPlaybackRate(0.18);
        });

        section.addEventListener('pointerleave', function () {
            rampPlaybackRate(1);
        });
    }

    window.addEventListener('scroll', requestParallax, { passive: true });
    window.addEventListener('resize', requestParallax);

    reducedMotion.addEventListener('change', function () {
        if (reducedMotion.matches) {
            targetRate = 1;
            currentRate = 1;
            applyPlaybackRate(1);
        }
        requestParallax();
    });

    requestParallax();
})();
