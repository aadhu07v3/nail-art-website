/* Bokeh Particle Galaxy — vanilla WebGL2 background for every page. */
(function () {
    "use strict";

    if (document.getElementById("bokeh-galaxy")) return;

    const FALLBACK = {
        background: "#17121D",
        baseColor: "#51405F",
        accentColor: "#B09BB8",
        speed: 31,
        scale: 45,
        arms: 3,
        twinkle: 14,
        advanced: {
            spin: 12,
            centerX: 50,
            centerY: 51,
            wind: 140,
            armContrast: 60,
            armNoise: 50,
            eye: 5,
            dustDensity: 100,
            dustSize: 100,
            dustDim: 29,
            dustBright: 62,
            haze: 12,
            dustDrift: 30,
            dotDensity: 100,
            dotSize: 100,
            dotBright: 85,
            dotDrift: 10,
            twinkleHz: 20,
            seed: 0,
            pull: 60,
            swirl: 70,
            wellSize: 22,
            tilt: 30,
            parallax: 4,
            hover: 72,
            grain: 0,
            vignette: 0
        }
    };

    const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

    const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uHover;
uniform vec3 uBg;
uniform vec3 uBase;
uniform vec3 uAccent;
uniform float uScale;
uniform float uArms;
uniform float uTwinkle;
uniform float uHoverAmt;
uniform float uPull;
uniform float uSwirl;
uniform float uWellSize;
uniform float uTilt;
uniform float uDown;
uniform float uParallax;
uniform float uGrain;
uniform float uVignette;
uniform float uSpin;
uniform vec2 uCenter;
uniform float uWind;
uniform float uArmContrast;
uniform float uArmNoise;
uniform float uEye;
uniform float uDustDensity;
uniform float uDustSize;
uniform float uDustDim;
uniform float uDustBright;
uniform float uHaze;
uniform float uDustDrift;
uniform float uDotDensity;
uniform float uDotSize;
uniform float uDotBright;
uniform float uDotDrift;
uniform float uTwinkleHz;
uniform float uSeed;
out vec4 outColor;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec4 h42(vec2 p) { vec4 p4 = fract(vec4(p.xyxy) * vec4(0.1031, 0.1030, 0.0973, 0.1099)); p4 += dot(p4, p4.wzxy + 33.33); return fract((p4.xxyz + p4.yzzw) * p4.zywx); }
float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h12(i), h12(i + vec2(1.0, 0.0)), f.x), mix(h12(i + vec2(0.0, 1.0)), h12(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + 7.1; a *= 0.5; } return s / 0.9375; }

float galaxy(vec2 p, out float fil) {
    float r = max(length(p), 1e-4);
    float lr = log(r);
    vec2 pw = rot(uWind * lr) * p;
    vec2 dir = pw / r;
    float warp = (fbm(dir * 2.5 + vec2(lr * 1.3, uSeed)) - 0.5) * uArmNoise * 6.0;
    float arm = 0.5 + 0.5 * cos(uArms * atan(pw.y, pw.x) + warp);
    arm = pow(arm, 1.6);
    fil = fbm(dir * 16.0 + vec2(lr * 2.4, uSeed * 1.7));
    fil = smoothstep(0.3, 0.75, fil);
    float d = mix(1.0, mix(0.25, 1.25, arm), uArmContrast) * mix(0.45, 1.3, fil);
    d *= mix(0.3, 1.0, smoothstep(uEye * 0.5, uEye * 1.6, r));
    return d;
}

void main() {
    float H = max(uRes.y, 1.0);
    float asp = uRes.x / H;
    float sc0 = max(uScale, 0.05);
    vec2 q = (gl_FragCoord.xy - uCenter * uRes) / H;
    vec2 m = (uMouse - uCenter) * vec2(asp, 1.0);
    float hv = uHover * uHoverAmt;
    float force = hv * (1.0 + 0.8 * uDown);
    vec2 dm = q - m;
    float dr = length(dm);
    float wr = max(uWellSize, 0.02);
    float fall = exp(-dr * dr / (wr * wr));
    dm = rot(-min(4.0, uSwirl * 2.4 * force) * fall) * dm;
    dm *= 1.0 + min(2.0, uPull * 1.5 * force) * fall;
    q = m + dm;
    vec2 tv = (uMouse - 0.5) * vec2(asp, 1.0) * hv * uTilt;
    q /= max(0.4, 1.0 + dot(q, tv));
    q /= sc0;
    float px = 1.0 / (H * sc0);
    float ang = uTime * uSpin;
    vec2 p = rot(-ang) * q;
    vec2 par = rot(-ang) * ((uMouse - 0.5) * vec2(asp, 1.0) * hv * uParallax);
    float fil;
    float dens = galaxy(p, fil);
    float ring = exp(-pow((dr - wr * 0.3) / (wr * 0.16), 2.0));
    float glow = 1.0 + force * (0.5 * fall + 1.6 * ring);

    vec3 col = uBg + uBase * (uHaze * fil * fil * min(dens, 1.2) * 0.6);

    float dust = 0.0;
    for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float cyc = uTime / max(uDustDrift, 0.1) + fi / 3.0;
        float z = fract(cyc);
        float s = exp2(z);
        float w = smoothstep(0.0, 0.2, z) * (1.0 - smoothstep(0.8, 1.0, z));
        vec2 c = (p - par * (0.15 + 0.1 * fi)) / (s * 0.0085) + vec2(fi * 37.0 + floor(cyc) * 11.0 + uSeed * 17.0, fi * 19.0);
        vec2 id = floor(c);
        vec4 h = h42(id);
        if (h.x > dens * 0.8 * uDustDensity) continue;
        vec2 o = 0.2 + 0.6 * h.yz;
        float d = length(fract(c) - o) * 0.0085 * s;
        float rs = mix(0.0008, 0.0017, h.w) * uDustSize * mix(1.0, 1.35, z);
        float a = 1.0 - smoothstep(rs - px * 0.6, rs + px * 0.6, d);
        float b = mix(uDustDim, uDustBright, pow(h.w, 0.8));
        if (h.w > 0.94) b = max(b, 0.79);
        float tn = uTime * uTwinkleHz + h.y * 7.0;
        float tw = mix(h12(id + floor(tn)), h12(id + floor(tn) + 1.0), smoothstep(0.0, 1.0, fract(tn)));
        b *= 1.0 - min(0.9, 0.6 * uTwinkle * (1.0 - tw));
        dust += a * b * w;
    }
    col += uBase * dust * glow;

    float dots = 0.0;
    for (int i = 0; i < 2; i++) {
        float fi = float(i);
        float cyc = uTime / max(uDotDrift, 0.1) + fi * 0.5;
        float z = fract(cyc);
        float s = exp2(z * 0.8);
        float w = smoothstep(0.0, 0.2, z) * (1.0 - smoothstep(0.8, 1.0, z));
        vec2 c = (p - par * (0.4 + 0.2 * fi)) / (s * 0.045) + vec2(fi * 71.0 + floor(cyc) * 13.0 + uSeed * 5.0, 41.0 + fi * 23.0);
        vec2 id = floor(c);
        vec4 h = h42(id);
        if (h.x > min(1.0, dens * dens * 1.1) * uDotDensity) continue;
        vec2 o = 0.25 + 0.5 * h.yz;
        float d = length(fract(c) - o) * 0.045 * s;
        float rs = mix(0.0022, 0.0038, h.w) * uDotSize * mix(1.0, 1.25, z);
        float edge = 0.0009 + px * 0.5;
        float a = 1.0 - smoothstep(rs - edge, rs + edge, d);
        float b = mix(uDotBright * 0.9, min(1.0, uDotBright * 1.08), h.y);
        float tn = uTime * uTwinkleHz * 0.5 + h.z * 5.0;
        float tw = mix(h12(id + floor(tn) + 3.0), h12(id + floor(tn) + 4.0), smoothstep(0.0, 1.0, fract(tn)));
        b *= 1.0 - min(0.6, 0.3 * uTwinkle * (1.0 - tw));
        dots += a * b * w;
    }
    col += uAccent * dots * glow;

    col += uAccent * 0.05 * force * ring;
    float hole = exp(-dr * dr / (wr * wr * 0.012));
    col = mix(col, uBg, clamp(force, 0.0, 1.0) * hole * 0.9);

    vec2 uv = gl_FragCoord.xy / max(uRes, vec2(1.0));
    float vg = smoothstep(0.35, 0.95, length((uv - 0.5) * vec2(asp, 1.0)));
    col *= 1.0 - uVignette * vg;
    col += (h12(gl_FragCoord.xy + fract(uTime * 7.0) * 517.0) - 0.5) * uGrain * 0.2;
    outColor = vec4(max(col, vec3(0.0)), 1.0);
}`;

    function num(value, fallback) {
        return typeof value === "number" && Number.isFinite(value) ? value : fallback;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function getPreset() {
        const live = window.__originkitPresetProps || {};
        return Object.assign({}, FALLBACK, live, {
            advanced: Object.assign({}, FALLBACK.advanced, live.advanced || {})
        });
    }

    function parseColor(input, fallback) {
        if (typeof input !== "string") return fallback;
        const value = input.trim().replace("#", "");
        if (value.length !== 3 && value.length !== 6) return fallback;
        const hex = value.length === 3
            ? value.split("").map(function (c) { return c + c; }).join("")
            : value;
        const n = parseInt(hex, 16);
        if (!Number.isFinite(n)) return fallback;
        return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }

    function compile(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Bokeh galaxy shader:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function createProgram(gl) {
        const vs = compile(gl, gl.VERTEX_SHADER, VERT);
        const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
        if (!vs || !fs) return null;
        const program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error("Bokeh galaxy link:", gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    function boot() {
        if (document.getElementById("bokeh-galaxy")) return;

        const canvas = document.createElement("canvas");
        canvas.id = "bokeh-galaxy";
        canvas.setAttribute("aria-hidden", "true");
        canvas.style.cssText = [
            "position:fixed",
            "inset:0",
            "width:100%",
            "height:100%",
            "display:block",
            "pointer-events:none",
            "z-index:0"
        ].join(";");
        document.body.appendChild(canvas);

        const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, powerPreference: "low-power" });
        if (!gl) {
            canvas.remove();
            return;
        }

        const program = createProgram(gl);
        if (!program) {
            canvas.remove();
            return;
        }
        gl.useProgram(program);
        canvas.dataset.galaxy = "ready";

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const position = gl.getAttribLocation(program, "aPos");
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

        const cache = new Map();
        function u(name) {
            if (!cache.has(name)) cache.set(name, gl.getUniformLocation(program, name));
            return cache.get(name);
        }

        const reduced = typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        let width = 0;
        let height = 0;
        let dpr = 1;

        function resize() {
            width = window.innerWidth || document.documentElement.clientWidth || 1;
            height = window.innerHeight || document.documentElement.clientHeight || 1;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            const w = Math.max(1, Math.round(width * dpr));
            const h = Math.max(1, Math.round(height * dpr));
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }
        }

        window.addEventListener("resize", resize, { passive: true });
        resize();

        let targetX = 0.5;
        let targetY = 0.5;
        let mouseX = 0.5;
        let mouseY = 0.5;
        let over = 0;
        let hover = 0;
        let down = 0;
        let downEase = 0;

        function setPointer(event) {
            if (!width || !height) return;
            targetX = event.clientX / width;
            targetY = 1 - event.clientY / height;
            over = 1;
        }

        window.addEventListener("pointermove", setPointer, { passive: true });
        window.addEventListener("pointerdown", function (event) {
            setPointer(event);
            down = 1;
        }, { passive: true });
        window.addEventListener("pointerup", function () { down = 0; }, { passive: true });
        window.addEventListener("pointercancel", function () { down = 0; }, { passive: true });
        document.addEventListener("pointerleave", function () { over = 0; }, { passive: true });

        let clock = 0;
        let last = -1;
        let raf = 0;

        function frame(now) {
            raf = requestAnimationFrame(frame);
            const dt = last < 0 ? 0 : Math.min((now - last) / 1000, 1 / 20);
            last = now;

            const preset = getPreset();
            const adv = preset.advanced;
            clock = (clock + dt * (Math.max(0, Math.min(100, num(preset.speed, 50))) / 50) * (reduced ? 0.2 : 1)) % 3600;

            const ease = 1 - Math.exp(-dt * 6);
            mouseX += (targetX - mouseX) * ease;
            mouseY += (targetY - mouseY) * ease;
            hover += (over - hover) * ease;
            downEase += (down - downEase) * (1 - Math.exp(-dt * 5));

            const bg = parseColor(preset.background, [0.09, 0.07, 0.11]);
            const base = parseColor(preset.baseColor, [0.32, 0.25, 0.37]);
            const accent = parseColor(preset.accentColor, [0.69, 0.61, 0.72]);

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform2f(u("uRes"), canvas.width, canvas.height);
            gl.uniform1f(u("uTime"), clock);
            gl.uniform2f(u("uMouse"), mouseX, mouseY);
            gl.uniform1f(u("uHover"), hover);
            gl.uniform1f(u("uDown"), downEase);
            gl.uniform3f(u("uBg"), bg[0], bg[1], bg[2]);
            gl.uniform3f(u("uBase"), base[0], base[1], base[2]);
            gl.uniform3f(u("uAccent"), accent[0], accent[1], accent[2]);
            gl.uniform1f(u("uScale"), Math.max(10, Math.min(300, num(preset.scale, 100))) / 100);
            gl.uniform1f(u("uArms"), Math.round(clamp(num(preset.arms, 3), 1, 8)));
            gl.uniform1f(u("uTwinkle"), clamp(num(preset.twinkle, 50), 0, 100) / 50);
            gl.uniform1f(u("uHoverAmt"), clamp(num(adv.hover, 50), 0, 100) / 50);
            gl.uniform1f(u("uPull"), clamp(num(adv.pull, 60), 0, 100) / 100);
            gl.uniform1f(u("uSwirl"), clamp(num(adv.swirl, 70), 0, 100) / 100);
            gl.uniform1f(u("uWellSize"), clamp(num(adv.wellSize, 22), 5, 60) / 100);
            gl.uniform1f(u("uTilt"), clamp(num(adv.tilt, 30), 0, 100) / 100);
            gl.uniform1f(u("uParallax"), clamp(num(adv.parallax, 4), 0, 30) / 100);
            gl.uniform1f(u("uGrain"), clamp(num(adv.grain, 0), 0, 100) / 100);
            gl.uniform1f(u("uVignette"), clamp(num(adv.vignette, 0), 0, 100) / 100);
            gl.uniform1f(u("uSpin"), (clamp(num(adv.spin, 12), -180, 180) * Math.PI) / 180);
            gl.uniform2f(u("uCenter"), clamp(num(adv.centerX, 50), 0, 100) / 100, 1 - clamp(num(adv.centerY, 51), 0, 100) / 100);
            gl.uniform1f(u("uWind"), clamp(num(adv.wind, 140), -300, 300) / 100);
            gl.uniform1f(u("uArmContrast"), clamp(num(adv.armContrast, 60), 0, 100) / 100);
            gl.uniform1f(u("uArmNoise"), clamp(num(adv.armNoise, 50), 0, 200) / 100);
            gl.uniform1f(u("uEye"), clamp(num(adv.eye, 5), 0, 40) / 100);
            gl.uniform1f(u("uDustDensity"), clamp(num(adv.dustDensity, 100), 0, 250) / 100);
            gl.uniform1f(u("uDustSize"), clamp(num(adv.dustSize, 100), 20, 400) / 100);
            gl.uniform1f(u("uDustDim"), clamp(num(adv.dustDim, 29), 0, 100) / 100);
            gl.uniform1f(u("uDustBright"), clamp(num(adv.dustBright, 62), 0, 100) / 100);
            gl.uniform1f(u("uHaze"), clamp(num(adv.haze, 12), 0, 100) / 100);
            gl.uniform1f(u("uDustDrift"), clamp(num(adv.dustDrift, 30), 1, 300));
            gl.uniform1f(u("uDotDensity"), clamp(num(adv.dotDensity, 100), 0, 300) / 100);
            gl.uniform1f(u("uDotSize"), clamp(num(adv.dotSize, 100), 20, 300) / 100);
            gl.uniform1f(u("uDotBright"), clamp(num(adv.dotBright, 85), 0, 100) / 100);
            gl.uniform1f(u("uDotDrift"), clamp(num(adv.dotDrift, 10), 1, 120));
            gl.uniform1f(u("uTwinkleHz"), clamp(num(adv.twinkleHz, 20), 0, 60));
            gl.uniform1f(u("uSeed"), Math.round(clamp(num(adv.seed, 0), 0, 100)));

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        raf = requestAnimationFrame(frame);

        document.addEventListener("visibilitychange", function () {
            if (document.hidden) {
                cancelAnimationFrame(raf);
                raf = 0;
            } else if (!raf) {
                last = -1;
                raf = requestAnimationFrame(frame);
            }
        });

        window.addEventListener("pagehide", function () {
            cancelAnimationFrame(raf);
            raf = 0;
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
