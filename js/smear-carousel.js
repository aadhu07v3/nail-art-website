(function () {
    "use strict";

    const SIDE_W = 0.64;
    const SIDE_H = 0.98;
    const TURN_PER_STEP = 35;
    const ROTATION_FLOOR_DEG = 2;
    const MAX_STEPS = 9;
    const SPRING_STIFFNESS = 180;
    const SPRING_DAMPING = 100;
    const DEPTH_PER_STEP = 200;
    const SNAP_DELAY_MS = 150;
    const SMEAR_PCT = 50;
    const MAX_SMEAR_PX = 20;
    const HOVER_ZOOM_PCT = 6;
    const FOV_DEG = 90;
    const EDGE_FADE_PCT = 25;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function mapRange(value, inMin, inMax, outMin, outMax) {
        if (inMin === inMax) return outMin;
        const progress = clamp((value - inMin) / (inMax - inMin), 0, 1);
        return outMin + (outMax - outMin) * progress;
    }

    function opacityFor(absOffset) {
        if (absOffset <= 5) return 1;
        if (absOffset >= 7) return 0;
        return 1 - (absOffset - 5) / 2;
    }

    function createSmearCarousel(host, options) {
        const settings = Object.assign({
            items: [],
            background: "transparent",
            edgeColor: "#17121D",
            direction: "horizontal",
            cardWidth: 340,
            cardHeight: 425,
            height: "clamp(520px, 68vh, 760px)",
            gap: 26,
            rounded: 22,
            rotation: 90,
            speed: 40,
            responsive: true,
            reducedMotion: false,
            onFocusChange: function () {},
            onCardClick: function () {}
        }, options || {});

        const items = Array.isArray(settings.items) ? settings.items.filter(Boolean) : [];
        if (!host || items.length === 0) return null;

        const horizontal = settings.direction === "horizontal";
        const total = items.length;
        const maxTurn = Math.max(ROTATION_FLOOR_DEG, settings.rotation);
        const maxCardW = Math.max(1, Math.round(settings.cardWidth));
        const maxCardH = Math.max(1, Math.round(settings.cardHeight));
        const cardRatio = maxCardH / maxCardW;
        let cardW = maxCardW;
        let cardH = maxCardH;
        let sideW = Math.round(cardW * SIDE_W);
        let sideH = Math.round(cardH * SIDE_H);
        let perspectivePx = 800;
        let alongTable = [0];

        host.style.position = "relative";
        host.style.width = "100%";
        host.style.height = typeof settings.height === "number" ? settings.height + "px" : settings.height;
        host.style.overflow = "hidden";
        host.style.background = settings.background;
        host.style.isolation = "isolate";
        host.style.touchAction = horizontal ? "pan-y" : "pan-x";
        host.style.userSelect = "none";
        host.style.cursor = "grab";

        const ring = document.createElement("div");
        ring.className = "smear-ring";
        ring.style.position = "absolute";
        ring.style.left = "50%";
        ring.style.top = "50%";
        ring.style.width = "0";
        ring.style.height = "0";
        ring.style.transformStyle = "preserve-3d";
        host.appendChild(ring);

        const edgeColor = settings.edgeColor || settings.background;
        [false, true].forEach(function (far) {
            const edge = document.createElement("div");
            edge.className = "smear-edge";
            edge.setAttribute("aria-hidden", "true");
            edge.style.position = "absolute";
            edge.style.pointerEvents = "none";
            edge.style.zIndex = "2000";
            const to = horizontal ? (far ? "left" : "right") : (far ? "top" : "bottom");
            if (horizontal) {
                edge.style.top = "0";
                edge.style.bottom = "0";
                edge.style.width = EDGE_FADE_PCT + "%";
                edge.style[far ? "right" : "left"] = "0";
            } else {
                edge.style.left = "0";
                edge.style.right = "0";
                edge.style.height = EDGE_FADE_PCT + "%";
                edge.style[far ? "bottom" : "top"] = "0";
            }
            edge.style.backgroundImage = "linear-gradient(to " + to + ", " + edgeColor + " 0%, transparent 100%)";
            host.appendChild(edge);
        });

        const cardStates = items.map(function (card) {
            card.classList.add("smear-card");
            card.style.position = "absolute";
            card.style.left = "0";
            card.style.top = "0";
            card.style.margin = "0";
            card.style.transformOrigin = "center center";
            card.style.transformStyle = "preserve-3d";
            card.style.transition = "none";
            card.style.willChange = "transform, opacity";
            card.style.pointerEvents = "auto";
            ring.appendChild(card);
            return {
                card: card,
                inner: card.querySelector(".nailtype-card__inner") || card,
                width: cardW,
                height: cardH,
                absOffset: 0
            };
        });

        let scrollTarget = 0;
        let scroll = 0;
        let velocity = 0;
        let pointerOver = false;
        let dragging = false;
        let dragLast = 0;
        let dragVelocity = 0;
        let lastPointerTime = 0;
        let dragMoved = false;
        let interacting = false;
        let interactTimeout = 0;
        let snapTimeout = 0;
        let focusedIndex = -1;
        let activeElement = null;
        let reducedMotion = Boolean(settings.reducedMotion);
        let raf = 0;
        let lastTime = performance.now();
        let destroyed = false;

        function readHost() {
            const hostWidth = Math.max(1, host.clientWidth || maxCardW);
            const hostHeight = Math.max(1, host.offsetHeight || 800);
            if (settings.responsive) {
                cardW = Math.round(Math.min(maxCardW, Math.max(220, hostWidth * 0.72)));
                cardH = Math.round(cardW * cardRatio);
                sideW = Math.round(cardW * SIDE_W);
                sideH = Math.round(cardH * SIDE_H);
            } else {
                cardW = maxCardW;
                cardH = maxCardH;
                sideW = Math.round(cardW * SIDE_W);
                sideH = Math.round(cardH * SIDE_H);
            }
            const fovRad = (FOV_DEG * Math.PI) / 360;
            perspectivePx = Math.max(1, Math.round(hostHeight / 2 / Math.tan(fovRad)));
            host.style.perspective = perspectivePx + "px";
            alongTable = computeAlongTable();
        }

        function computeAlongTable() {
            const half0 = (horizontal ? cardW : cardH) / 2;
            const halfSide = (horizontal ? sideW : sideH) / 2;
            const corners = [-halfSide, halfSide];
            const zSign = horizontal ? 1 : -1;
            const table = [0];
            let prevEdge = half0;
            for (let step = 1; step <= MAX_STEPS; step += 1) {
                const radians = (Math.min(step * TURN_PER_STEP, maxTurn) * Math.PI) / 180;
                const cos = Math.cos(radians);
                const sin = Math.sin(radians);
                const target = prevEdge + settings.gap;
                const denom = function (corner) {
                    return perspectivePx + step * DEPTH_PER_STEP + zSign * corner * sin;
                };
                const roots = corners
                    .filter(function (corner) { return denom(corner) > 1; })
                    .map(function (corner) {
                        return (target * denom(corner)) / perspectivePx - corner * cos;
                    });
                const along = roots.length
                    ? Math.max.apply(null, roots)
                    : table[step - 1] + halfSide * 2 + settings.gap;
                table.push(along);
                prevEdge = Math.max.apply(null, corners.map(function (corner) {
                    return denom(corner) > 1
                        ? ((along + corner * cos) * perspectivePx) / denom(corner)
                        : target;
                }));
            }
            return table;
        }

        function markInteracting() {
            interacting = true;
            if (interactTimeout) window.clearTimeout(interactTimeout);
            interactTimeout = window.setTimeout(function () {
                interacting = false;
            }, 160);
        }

        function snapSoon() {
            if (snapTimeout) window.clearTimeout(snapTimeout);
            snapTimeout = window.setTimeout(function () {
                scrollTarget = Math.round(scrollTarget);
            }, SNAP_DELAY_MS);
        }

        function setFocused(index) {
            if (index === focusedIndex) return;
            focusedIndex = index;
            const next = index >= 0 ? items[index] : null;
            if (next === activeElement) return;
            activeElement = next;
            settings.onFocusChange(next);
        }

        function updateFocused() {
            if (dragging) return;
            if (!pointerOver) {
                setFocused(items.indexOf(document.activeElement));
                return;
            }
            if (interacting) return;
            let bestIndex = -1;
            let bestOffset = Infinity;
            for (let index = 0; index < cardStates.length; index += 1) {
                const absOffset = cardStates[index].absOffset;
                if (absOffset < bestOffset) {
                    bestOffset = absOffset;
                    bestIndex = index;
                }
            }
            setFocused(bestIndex);
        }

        function render(now) {
            if (destroyed) return;
            const dt = Math.min(0.1, Math.max(0, (now - lastTime) / 1000));
            lastTime = now;

            if (!reducedMotion && !pointerOver && !dragging && settings.speed > 0) {
                scrollTarget += (settings.speed / 50) * dt;
            }

            if (reducedMotion) {
                scroll = scrollTarget;
                velocity = 0;
            } else {
                const springSteps = Math.max(1, Math.ceil(dt / 0.016));
                const springStep = dt / springSteps;
                for (let springIndex = 0; springIndex < springSteps; springIndex += 1) {
                    const force = -SPRING_STIFFNESS * (scroll - scrollTarget);
                    const damper = -SPRING_DAMPING * velocity;
                    velocity += (force + damper) * springStep;
                    scroll += velocity * springStep;
                }
            }

            const blurPx = reducedMotion
                ? 0
                : Math.min((Math.abs(velocity) * SMEAR_PCT) / 100, MAX_SMEAR_PX);

            for (let index = 0; index < cardStates.length; index += 1) {
                const state = cardStates[index];
                let offset = (((index - scroll) % total) + total) % total;
                if (offset > total / 2) offset -= total;
                const absOffset = Math.abs(offset);
                const width = mapRange(absOffset, 0, 1, cardW, sideW);
                const height = mapRange(absOffset, 0, 1, cardH, sideH);
                const step = Math.min(absOffset, MAX_STEPS);
                const stepFloor = Math.floor(step);
                const along = stepFloor >= MAX_STEPS
                    ? alongTable[MAX_STEPS]
                    : alongTable[stepFloor] + (alongTable[stepFloor + 1] - alongTable[stepFloor]) * (step - stepFloor);
                const signedAlong = Math.sign(offset) * along;
                const x = horizontal ? signedAlong - width / 2 : -width / 2;
                const y = horizontal ? -height / 2 : signedAlong - height / 2;
                const z = -absOffset * DEPTH_PER_STEP;
                const turn = Math.sign(offset) * Math.min(absOffset * TURN_PER_STEP, maxTurn);
                const zIndex = 1000 - Math.round(absOffset * 10);
                const opacity = opacityFor(absOffset);
                const focused = absOffset < 0.5;
                const scale = 1 + (pointerOver && focused && !reducedMotion ? HOVER_ZOOM_PCT / 100 : 0);

                state.absOffset = absOffset;
                state.width = width;
                state.height = height;

                const transform = horizontal
                    ? "translate3d(" + x + "px, " + y + "px, " + z + "px) rotateY(" + turn + "deg) scale(" + scale + ")"
                    : "translate3d(" + x + "px, " + y + "px, " + z + "px) rotateX(" + turn + "deg) scale(" + scale + ")";

                state.card.style.width = width + "px";
                state.card.style.height = height + "px";
                state.card.style.transform = transform;
                state.card.style.zIndex = String(zIndex);
                state.card.style.opacity = String(opacity);
                state.inner.style.filter = blurPx > 0.75 ? "blur(" + blurPx + "px)" : "none";
            }

            updateFocused();
            raf = window.requestAnimationFrame(render);
        }

        function onWheel(event) {
            const along = horizontal
                ? Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY * 0.8
                : event.deltaY;
            scrollTarget += along * 0.004;
            markInteracting();
            snapSoon();
        }

        function onPointerEnter() {
            pointerOver = true;
            scrollTarget = Math.round(scrollTarget);
        }

        function onPointerLeave() {
            pointerOver = false;
            dragging = false;
            interacting = false;
            if (interactTimeout) window.clearTimeout(interactTimeout);
            host.style.cursor = "grab";
        }

        function onPointerDown(event) {
            if (event.button !== undefined && event.button !== 0) return;
            dragging = true;
            dragMoved = false;
            dragLast = horizontal ? event.clientX : event.clientY;
            dragVelocity = 0;
            lastPointerTime = performance.now();
            host.style.cursor = "grabbing";
            if (host.setPointerCapture) host.setPointerCapture(event.pointerId);
        }

        function onPointerMove(event) {
            if (!dragging) return;
            const current = horizontal ? event.clientX : event.clientY;
            const delta = current - dragLast;
            dragLast = current;
            if (Math.abs(delta) > 2) dragMoved = true;
            const now = performance.now();
            const elapsed = Math.max(1, now - lastPointerTime);
            lastPointerTime = now;
            dragVelocity = delta / elapsed;
            scrollTarget += -delta * 0.005;
            markInteracting();
        }

        function onPointerUp(event) {
            if (!dragging) return;
            dragging = false;
            host.style.cursor = "grab";
            if (host.releasePointerCapture) {
                try { host.releasePointerCapture(event.pointerId); } catch (error) {}
            }
            scrollTarget += -dragVelocity * 1.5;
            scrollTarget = Math.round(scrollTarget);
            dragVelocity = 0;
            markInteracting();
            if (!dragMoved && activeElement) settings.onCardClick(activeElement);
        }

        function onReducedChange() {
            reducedMotion = reducedQuery.matches;
            if (reducedMotion) {
                velocity = 0;
                scroll = scrollTarget;
            }
        }

        const resizeObserver = new ResizeObserver(function () {
            readHost();
        });
        resizeObserver.observe(host);

        const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        reducedMotion = reducedMotion || reducedQuery.matches;
        reducedQuery.addEventListener("change", onReducedChange);

        host.addEventListener("wheel", onWheel, { passive: true });
        host.addEventListener("pointerenter", onPointerEnter);
        host.addEventListener("pointerleave", onPointerLeave);
        host.addEventListener("pointerdown", onPointerDown);
        host.addEventListener("pointermove", onPointerMove);
        host.addEventListener("pointerup", onPointerUp);
        host.addEventListener("pointercancel", onPointerUp);

        readHost();
        lastTime = performance.now();
        raf = window.requestAnimationFrame(render);

        return {
            destroy: function () {
                destroyed = true;
                if (raf) window.cancelAnimationFrame(raf);
                if (interactTimeout) window.clearTimeout(interactTimeout);
                if (snapTimeout) window.clearTimeout(snapTimeout);
                resizeObserver.disconnect();
                reducedQuery.removeEventListener("change", onReducedChange);
                host.removeEventListener("wheel", onWheel);
                host.removeEventListener("pointerenter", onPointerEnter);
                host.removeEventListener("pointerleave", onPointerLeave);
                host.removeEventListener("pointerdown", onPointerDown);
                host.removeEventListener("pointermove", onPointerMove);
                host.removeEventListener("pointerup", onPointerUp);
                host.removeEventListener("pointercancel", onPointerUp);
                setFocused(-1);
            },
            setReducedMotion: function (value) {
                reducedMotion = Boolean(value);
                if (reducedMotion) {
                    velocity = 0;
                    scroll = scrollTarget;
                }
            },
            getFocused: function () {
                return focusedIndex >= 0 ? items[focusedIndex] : null;
            },
            refresh: readHost
        };
    }

    window.createSmearCarousel = createSmearCarousel;
})();
