(function () {
    "use strict";

    const __originkitPresetProps = {
        background: "#17121D",
        baseColor: "#51405F",
        accentColor: "#B09BB8",
        speed: 31,
        scale: 45,
        arms: 3,
        twinkle: 14,
        advanced: {
            eye: 5,
            haze: 12,
            lens: 35,
            seed: 0,
            spin: 12,
            wind: 140,
            grain: 0,
            centerX: 50,
            centerY: 51,
            dotSize: 100,
            dustDim: 29,
            armNoise: 50,
            dotDrift: 10,
            dustSize: 100,
            parallax: 4,
            vignette: 0,
            bokehSize: 100,
            bokehSoft: 35,
            dotBright: 85,
            dustDrift: 30,
            twinkleHz: 20,
            bokehCycle: 1400,
            dotDensity: 100,
            dustBright: 62,
            armContrast: 60,
            bokehAspect: 160,
            bokehGrowth: 325,
            dustDensity: 100,
            bokehOpacity: 100
        }
    };
    window.__originkitPresetProps = __originkitPresetProps;

    const CONFIG = {
        particleCount: 350,
        colors: ["#E8DDEB", "#796487", "#B09BB8"],
        speed: 3,
        density: 100,
        starSize: 8,
        focalDepth: 13,
        turbulence: 1,
        brightness: 70,
        glitterIntensity: 4,
        trailAmount: 90,
        reverse: false
    };

    const canvas = document.querySelector(".hero-glitter");
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    const hero = canvas.closest(".hero");
    if (!ctx || !hero) return;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    let reducedMotion = reducedMotionQuery.matches;

    const size = { w: 0, h: 0, dpr: 1 };
    const stars = [];
    let rafId = null;
    let elapsed = 0;
    let lastTime = performance.now();
    let heroVisible = true;
    let pageVisible = !document.hidden;
    let revealFinished = false;

    let resizeObserver = null;
    let intersectionObserver = null;
    let loadedObserver = null;
    let revealTimer = null;
    let mediaListener = null;
    let visibilityListener = null;
    let pageHideListener = null;

    const palette = CONFIG.colors.map(parseColor).slice(0, 3);
    while (palette.length < 3) palette.push([255, 255, 255, 1]);
    const rgbStrings = palette.map(function (color) {
        return "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
    });

    function parseColor(input) {
        if (typeof input !== "string" || !input.trim()) return [255, 255, 255, 1];
        const value = input.trim();
        if (value.charAt(0) === "#") {
            let hex = value.slice(1);
            if (hex.length === 3) {
                hex = hex.split("").map(function (character) {
                    return character + character;
                }).join("");
            }
            const number = parseInt(hex, 16);
            return [(number >> 16) & 255, (number >> 8) & 255, number & 255, 1];
        }
        const match = value.match(/rgba?\(([^)]+)\)/i);
        if (match) {
            const parts = match[1].split(",").map(function (part) {
                return parseFloat(part.trim());
            });
            return [
                parts[0] || 0,
                parts[1] || 0,
                parts[2] || 0,
                parts[3] == null ? 1 : parts[3]
            ];
        }
        return [255, 255, 255, 1];
    }

    function getSettings() {
        return {
            reverse: CONFIG.reverse,
            stepZ: CONFIG.speed * 0.0008,
            focalDepth: CONFIG.focalDepth / 100,
            starScale: CONFIG.starSize * 0.15,
            turbulence: CONFIG.turbulence * 0.2,
            glitter: CONFIG.glitterIntensity * 0.1,
            brightness: Math.min(1, CONFIG.brightness / 100),
            trail: CONFIG.trailAmount / 100
        };
    }

    function getParticleCount() {
        const count = Math.max(1, Math.floor(CONFIG.particleCount));
        return mobileQuery.matches ? Math.max(1, Math.round(count * 0.4)) : count;
    }

    function makeStar() {
        return {
            x: 0,
            y: 0,
            z: 0,
            px: NaN,
            py: NaN,
            seed: 0,
            vmul: 1,
            colorIdx: 0,
            flashUntil: 0,
            nextFlash: 0
        };
    }

    function syncCount() {
        const count = getParticleCount();
        if (stars.length > count) {
            stars.length = count;
            return;
        }
        while (stars.length < count) {
            const star = makeStar();
            resetStar(star, true);
            stars.push(star);
        }
    }

    function resetStar(star, initial) {
        const settings = getSettings();
        const angle = Math.random() * Math.PI * 2;
        const radius = (0.2 + Math.random() * 0.8) * (CONFIG.density / 15);
        star.x = Math.cos(angle) * radius;
        star.y = Math.sin(angle) * radius;

        if (settings.reverse) {
            star.z = initial
                ? settings.focalDepth + Math.random() * (1 - settings.focalDepth)
                : settings.focalDepth;
        } else {
            star.z = initial ? Math.random() : 1;
        }

        star.px = NaN;
        star.py = NaN;
        star.seed = Math.random() * 1000;
        star.vmul = 0.6 + Math.random() * 0.8;
        star.colorIdx = Math.floor(Math.random() * 3);
        star.flashUntil = 0;
        star.nextFlash = elapsed + 1 + Math.random() * 4 * (1 / Math.max(0.0001, settings.glitter));
    }

    function resize(entry) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const contentRect = entry && entry.contentRect;
        const rectWidth = contentRect && contentRect.width;
        const rectHeight = contentRect && contentRect.height;
        const w = Math.max(1, Math.floor(rectWidth || hero.clientWidth || hero.getBoundingClientRect().width || 600));
        const h = Math.max(1, Math.floor(rectHeight || hero.clientHeight || hero.getBoundingClientRect().height || 400));

        if (size.w === w && size.h === h && size.dpr === dpr) return;

        size.w = w;
        size.h = h;
        size.dpr = dpr;
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        syncCount();
    }

    function drawFrame(deltaSeconds) {
        const settings = getSettings();
        syncCount();

        const w = size.w;
        const h = size.h;
        if (!w || !h) return;

        const cx = w / 2;
        const cy = h / 2;
        const projectionScale = Math.min(w, h) * 0.9;
        const dt = Math.max(0.001, Math.min(0.1, deltaSeconds)) * 60;
        const keep = Math.pow(Math.min(0.98, Math.max(0, settings.trail)), dt);
        const trailAlpha = Math.max(0.02, 1 - keep);

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = "rgba(23,18,29," + trailAlpha + ")";
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";

        for (let index = 0; index < stars.length; index += 1) {
            const star = stars[index];
            const velocityZ = settings.stepZ * star.vmul * dt;

            if (settings.reverse) {
                star.z += velocityZ;
                if (star.z >= 1) {
                    resetStar(star);
                    continue;
                }
            } else {
                star.z -= velocityZ;
                if (star.z <= settings.focalDepth) {
                    resetStar(star);
                    continue;
                }
            }

            let turbulenceX = star.x;
            let turbulenceY = star.y;
            if (settings.turbulence > 0) {
                const time = elapsed * 1.2 + star.seed;
                const amplitude = settings.turbulence * (1 - star.z) * 0.25;
                turbulenceX += Math.sin(time + star.seed) * amplitude;
                turbulenceY += Math.cos(time * 1.13 + star.seed * 0.7) * amplitude;
            }

            const perspective = settings.focalDepth / Math.max(star.z, 0.0001);
            const sx = cx + turbulenceX * perspective * projectionScale;
            const sy = cy + turbulenceY * perspective * projectionScale;

            if (!settings.reverse && (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20)) {
                resetStar(star);
                continue;
            }

            let flashMultiplier = 1;
            if (settings.glitter > 0) {
                if (elapsed >= star.nextFlash && star.flashUntil < elapsed) {
                    star.flashUntil = elapsed + 0.04 + Math.random() * 0.07;
                    star.nextFlash =
                        elapsed + 1 +
                        Math.random() * 4 * (1 / Math.max(0.0001, settings.glitter));
                }
                if (elapsed <= star.flashUntil) {
                    flashMultiplier = 1 + 2.5 * settings.glitter;
                }
            }

            const sizePerspective = Math.min(2.5, (settings.focalDepth / Math.max(star.z, 0.0001)) * 0.6);
            const baseRadius = Math.max(0.25, settings.starScale * (0.4 + sizePerspective));
            const maximumRadius = 1 + settings.starScale * 2.5;
            const radius = Math.min(baseRadius * flashMultiplier, maximumRadius);

            const life = settings.reverse ? star.z : 1 - star.z;
            const fadeIn = settings.reverse
                ? Math.min(1, (star.z - settings.focalDepth) / (1 - settings.focalDepth) / 0.12)
                : 1;
            const alpha = Math.min(
                1,
                settings.reverse ? 0.85 - life * 0.6 : life * 0.9 + 0.05
            ) * fadeIn * settings.brightness * (flashMultiplier > 1 ? 1 : 0.85);

            const color = rgbStrings[star.colorIdx];
            if (!Number.isNaN(star.px) && !Number.isNaN(star.py)) {
                ctx.globalAlpha = alpha * 0.5;
                ctx.strokeStyle = color;
                ctx.lineWidth = Math.max(0.4, radius * 0.4);
                ctx.beginPath();
                ctx.moveTo(star.px, star.py);
                ctx.lineTo(sx, sy);
                ctx.stroke();
            }

            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.fillRect(sx - radius, sy - radius, radius * 2, radius * 2);

            if (flashMultiplier > 1) {
                const flashRadius = Math.min(radius * 1.4, maximumRadius * 1.4);
                ctx.globalAlpha = alpha * 0.5;
                ctx.fillRect(sx - flashRadius, sy - flashRadius, flashRadius * 2, flashRadius * 2);
            }

            star.px = sx;
            star.py = sy;
        }

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        elapsed += Math.min(0.1, Math.max(0, deltaSeconds));
    }

    function canAnimate() {
        return revealFinished && heroVisible && pageVisible && !reducedMotion;
    }

    function stopAnimation() {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function loop(time) {
        if (!canAnimate()) {
            rafId = null;
            return;
        }
        const deltaSeconds = (time - lastTime) / 1000;
        lastTime = time;
        drawFrame(deltaSeconds);
        rafId = requestAnimationFrame(loop);
    }

    function startAnimation() {
        if (rafId !== null || !canAnimate()) return;
        lastTime = performance.now();
        rafId = requestAnimationFrame(loop);
    }

    function updateAnimationState() {
        if (canAnimate()) {
            startAnimation();
        } else {
            stopAnimation();
        }
    }

    function handleLoaded() {
        if (document.body.classList.contains("loaded") && !revealFinished) {
            if (loadedObserver) loadedObserver.disconnect();
            revealTimer = window.setTimeout(function () {
                revealFinished = true;
                if (reducedMotion) {
                    drawFrame(1 / 60);
                } else {
                    updateAnimationState();
                }
            }, 1500);
        }
    }

    resize();
    resizeObserver = new ResizeObserver(function (entries) {
        resize(entries[0]);
    });
    resizeObserver.observe(hero);

    intersectionObserver = new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        updateAnimationState();
    }, { threshold: 0.01 });
    intersectionObserver.observe(hero);

    visibilityListener = function () {
        pageVisible = !document.hidden;
        updateAnimationState();
    };
    document.addEventListener("visibilitychange", visibilityListener);

    pageHideListener = function () {
        stopAnimation();
    };
    window.addEventListener("pagehide", pageHideListener);

    mediaListener = function () {
        syncCount();
        if (reducedMotionQuery.matches !== reducedMotion) {
            reducedMotion = reducedMotionQuery.matches;
            if (reducedMotion) {
                stopAnimation();
                ctx.clearRect(0, 0, size.w, size.h);
                drawFrame(1 / 60);
            } else {
                updateAnimationState();
            }
        }
    };
    reducedMotionQuery.addEventListener("change", mediaListener);
    mobileQuery.addEventListener("change", mediaListener);

    loadedObserver = new MutationObserver(handleLoaded);
    loadedObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    handleLoaded();

    window.addEventListener("beforeunload", function cleanup() {
        stopAnimation();
        if (resizeObserver) resizeObserver.disconnect();
        if (intersectionObserver) intersectionObserver.disconnect();
        if (loadedObserver) loadedObserver.disconnect();
        if (revealTimer !== null) window.clearTimeout(revealTimer);
        document.removeEventListener("visibilitychange", visibilityListener);
        window.removeEventListener("pagehide", pageHideListener);
        if (reducedMotionQuery.removeEventListener) reducedMotionQuery.removeEventListener("change", mediaListener);
        if (mobileQuery.removeEventListener) mobileQuery.removeEventListener("change", mediaListener);
        window.removeEventListener("beforeunload", cleanup);
    });
})();
