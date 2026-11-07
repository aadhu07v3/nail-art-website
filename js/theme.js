(function () {
    "use strict";

    window.__originkitPresetProps = {
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

    var palette = {
        background: "#17121D",
        surface: "#302538",
        border: "#51405F",
        accent: "#796487",
        mutedText: "#B09BB8",
        primaryText: "#E8DDEB"
    };

    var root = document.documentElement;
    Object.keys(palette).forEach(function (name) {
        root.style.setProperty("--" + name.replace(/[A-Z]/g, function (letter) {
            return "-" + letter.toLowerCase();
        }), palette[name]);
    });
})();
