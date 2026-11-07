(function () {
    "use strict";

    const CONFIG = {
        glowColor: "#B09BB8",
        tailColor: "#796487",
        baseColor: "#51405F",
        dualTails: true,
        tailLength: 60,
        borderWidth: 2,
        rounded: 22,
        speed: 18,
        hoverMultiplier: 4,
        direction: "clockwise"
    };

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function buildGradient(config) {
        const span = config.dualTails ? 180 : 360;
        const length = Math.max(1, (clamp(config.tailLength, 0, 100) / 100) * span * 0.94);
        const tip = Math.max(6, length * 0.35);
        const decay = Math.max(8, length * 0.3);
        const comet = (end) => [
            `${config.glowColor} ${end}deg`,
            `${config.tailColor} ${end + decay}deg`,
            `${config.baseColor} ${end + decay * 2}deg`,
            `${config.baseColor} ${end + span - length}deg`,
            `${config.tailColor} ${end + span - tip}deg`
        ].join(", ");
        const stops = config.dualTails
            ? `${comet(0)}, ${comet(180)}, ${config.glowColor} 360deg`
            : `${comet(0)}, ${config.glowColor} 360deg`;
        return `conic-gradient(from 0deg at 50% 50%, ${stops})`;
    }

    function createGlowBorder(hostElement, config) {
        if (!hostElement) return null;
        const settings = Object.assign({}, CONFIG, config);
        const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        let reducedMotion = reducedQuery.matches;

        const ring = document.createElement("div");
        ring.className = "glow-border-ring";
        ring.setAttribute("aria-hidden", "true");
        ring.style.position = "absolute";
        ring.style.inset = "0";
        ring.style.pointerEvents = "none";
        ring.style.boxSizing = "border-box";
        ring.style.overflow = "hidden";
        ring.style.padding = `${Math.max(0, settings.borderWidth)}px`;
        ring.style.opacity = "0";
        ring.style.transition = "opacity 0.4s ease";
        ring.style.zIndex = "2";
        ring.style.maskImage = "linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)";
        ring.style.webkitMaskImage = "linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)";
        ring.style.maskClip = "content-box, border-box";
        ring.style.webkitMaskClip = "content-box, border-box";
        ring.style.maskComposite = "exclude";
        ring.style.webkitMaskComposite = "xor";

        const layer = document.createElement("div");
        layer.className = "glow-border-ring__layer";
        layer.style.position = "absolute";
        layer.style.top = "0";
        layer.style.left = "0";
        layer.style.width = "200%";
        layer.style.height = "200%";
        layer.style.transformOrigin = "center center";
        layer.style.willChange = "transform";
        ring.appendChild(layer);
        hostElement.appendChild(ring);

        let boost = 1;
        let boostTarget = 1;
        let rotation = 0;
        let raf = 0;
        let last = performance.now();
        let active = false;
        let destroyed = false;
        let shown = false;
        let pageVisible = !document.hidden;

        const eventTarget = hostElement.closest(".nailtype-card") || hostElement;

        function setSize(width, height) {
            const safeWidth = Math.max(1, width);
            const safeHeight = Math.max(1, height);
            const size = Math.ceil(Math.hypot(safeWidth, safeHeight)) + 24;
            layer.style.width = `${size}px`;
            layer.style.height = `${size}px`;
            layer.style.top = `calc(50% - ${size / 2}px)`;
            layer.style.left = `calc(50% - ${size / 2}px)`;
            const computedRadius = (clamp(settings.rounded, 0, 100) / 100) * (Math.min(safeWidth, safeHeight) / 2);
            const hostRadius = parseFloat(window.getComputedStyle(hostElement).borderRadius);
            const radiusPx = Number.isFinite(hostRadius) && hostRadius > 0
                ? Math.min(computedRadius, hostRadius)
                : computedRadius;
            ring.style.borderRadius = `${radiusPx}px`;
        }

        const resizeObserver = new ResizeObserver((entries) => {
            const rect = entries[0] && entries[0].contentRect;
            setSize(
                rect ? rect.width : hostElement.clientWidth,
                rect ? rect.height : hostElement.clientHeight
            );
        });
        resizeObserver.observe(hostElement);
        setSize(hostElement.clientWidth, hostElement.clientHeight);

        function applyStatic() {
            layer.style.background = "linear-gradient(135deg, rgba(176,155,184,0.85), rgba(121,100,135,0.6), rgba(176,155,184,0.85))";
            layer.style.transform = "none";
        }

        function applyAnimated() {
            layer.style.background = buildGradient(settings);
        }

        function canRun() {
            return active && pageVisible && !reducedMotion && !destroyed;
        }

        function frame(now) {
            if (!canRun()) {
                raf = 0;
                return;
            }
            const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
            last = now;
            boost += (boostTarget - boost) * (1 - Math.exp(-dt / 0.12));
            rotation = (rotation + settings.speed * 3.6 * boost * dt) % 360;
            const flip = settings.direction === "clockwise" ? 1 : -1;
            layer.style.transform = `scaleX(${flip}) rotate(${rotation}deg)`;
            raf = requestAnimationFrame(frame);
        }

        function startLoop() {
            if (raf || !canRun()) return;
            last = performance.now();
            raf = requestAnimationFrame(frame);
        }

        function stopLoop() {
            if (raf) {
                cancelAnimationFrame(raf);
                raf = 0;
            }
        }

        function sync() {
            if (canRun()) startLoop();
            else stopLoop();
        }

        function start() {
            if (destroyed) return false;
            active = true;
            boostTarget = settings.hoverMultiplier;
            if (!shown) {
                shown = true;
                ring.style.opacity = "0";
                void ring.offsetWidth;
            }
            ring.style.opacity = "1";
            if (reducedMotion) {
                applyStatic();
                stopLoop();
            } else {
                applyAnimated();
                startLoop();
            }
            return true;
        }

        function stop() {
            if (destroyed) return;
            active = false;
            boostTarget = 1;
            stopLoop();
        }

        function destroy() {
            if (destroyed) return;
            destroyed = true;
            active = false;
            stopLoop();
            ring.style.opacity = "0";
            resizeObserver.disconnect();
            reducedQuery.removeEventListener("change", onReducedChange);
            document.removeEventListener("visibilitychange", onVisibility);
            eventTarget.removeEventListener("mouseenter", onEnter);
            eventTarget.removeEventListener("mouseleave", onLeave);
            eventTarget.removeEventListener("focus", onEnter);
            eventTarget.removeEventListener("blur", onLeave);
            window.setTimeout(() => {
                if (ring.parentNode) ring.parentNode.removeChild(ring);
            }, 400);
        }

        function onEnter() {
            boostTarget = settings.hoverMultiplier;
            start();
        }

        function onLeave() {
            stop();
        }

        function onVisibility() {
            pageVisible = !document.hidden;
            sync();
        }

        function onReducedChange() {
            reducedMotion = reducedQuery.matches;
            if (reducedMotion) {
                applyStatic();
                stopLoop();
            } else if (active) {
                applyAnimated();
                startLoop();
            }
        }

        eventTarget.addEventListener("mouseenter", onEnter);
        eventTarget.addEventListener("mouseleave", onLeave);
        eventTarget.addEventListener("focus", onEnter);
        eventTarget.addEventListener("blur", onLeave);
        document.addEventListener("visibilitychange", onVisibility);
        reducedQuery.addEventListener("change", onReducedChange);

        if (reducedMotion) applyStatic();
        else applyAnimated();

        return { start, stop, destroy };
    }

    function initLegacyGlowFrames() {
        document.querySelectorAll("[data-glow-frame]").forEach((frame) => {
            if (frame.querySelector(".glow-border-ring")) return;
            const legacyCanvas = frame.querySelector(".glow-layer");
            if (legacyCanvas) legacyCanvas.style.display = "none";
            const border = createGlowBorder(frame, { hoverMultiplier: 1 });
            if (border) border.start();
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initLegacyGlowFrames, { once: true });
    } else {
        initLegacyGlowFrames();
    }

    window.createGlowBorder = createGlowBorder;
})();
