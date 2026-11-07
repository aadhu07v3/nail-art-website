(function () {
    "use strict";

    const AUTO_DETECT = false;

    const DATA = {
        shapes: ["Square","Round","Oval","Almond","Coffin","Stiletto","Squoval","Flare"],
        nailTypes: [
            ["Gel","Flexible, glossy wear"],
            ["Acrylic","Strong sculpted length"],
            ["Press-on","Lightweight temporary set"],
            ["Builder Gel","Protective structure"],
            ["Dip Powder","Durable layered colour"]
        ],
        lengths: ["Short","Medium","Long"],
        finishes: ["Glossy","Matte","Chrome","Cat-eye","Jelly","Glitter"],
        swatches: [
            ["Deep Background","#17121D"],["Secondary Surface","#302538"],["Muted Border","#51405F"],
            ["Accent","#796487"],["Muted Highlight","#B09BB8"],["Primary Light","#E8DDEB"],
            ["Surface","#302538"],["Accent Light","#B09BB8"],["Light Element","#E8DDEB"]
        ],
        designs: ["Solid","French tip","Ombre","Gothic cross/webbing","Floral","Leopard","Marble","Charms/gems","Chrome lines"]
    };

    const state = {
        shape: "Almond",
        nailType: "Gel",
        length: "Medium",
        finish: "Glossy",
        primary: "#796487",
        secondary: "#B09BB8",
        opacity: 90,
        design: "Solid",
        intensity: 55,
        applyMode: "all",
        selectedMarker: 0
    };

    try {
        const saved = JSON.parse(localStorage.getItem("nailTryOnSelection"));
        if (saved && typeof saved === "object") Object.assign(state, saved);
    } catch (error) {}

    const uploadZone = document.getElementById("upload-zone");
    const uploadEmpty = document.getElementById("upload-empty");
    const photoInput = document.getElementById("photo-input");
    const photoCanvas = document.getElementById("photo-canvas");
    const overlayCanvas = document.getElementById("overlay-canvas");
    const markerLayer = document.getElementById("marker-layer");
    const changePhoto = document.getElementById("change-photo");
    const uploadError = document.getElementById("upload-error");
    const markerHint = document.getElementById("marker-hint");
    const photoCtx = photoCanvas.getContext("2d");
    const overlayCtx = overlayCanvas.getContext("2d");
    let uploadedImage = null;
    let redrawFrame = null;
    let drag = null;

    const markers = [
        { x: .30, y: .48, w: .055, h: .17, rotation: -12 },
        { x: .41, y: .43, w: .060, h: .19, rotation: -6 },
        { x: .52, y: .40, w: .065, h: .21, rotation: 0 },
        { x: .63, y: .43, w: .060, h: .19, rotation: 6 },
        { x: .72, y: .50, w: .055, h: .17, rotation: 12 }
    ];

    function saveSelection() {
        try {
            const selection = {};
            ["shape","nailType","length","finish","primary","secondary","opacity","design","intensity","applyMode"].forEach(function (key) {
                selection[key] = state[key];
            });
            localStorage.setItem("nailTryOnSelection", JSON.stringify(selection));
        } catch (error) {}
    }

    function showError(message) {
        uploadError.textContent = message;
        uploadError.style.display = "block";
        window.setTimeout(function () { uploadError.style.display = "none"; }, 5000);
    }

    function openFile() { photoInput.click(); }
    uploadZone.addEventListener("click", function (event) {
        if (!uploadedImage && event.target !== photoInput) openFile();
    });
    uploadZone.addEventListener("keydown", function (event) {
        if (!uploadedImage && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            openFile();
        }
    });
    changePhoto.addEventListener("click", function (event) { event.stopPropagation(); openFile(); });
    photoInput.addEventListener("change", function () {
        if (photoInput.files && photoInput.files[0]) handleFile(photoInput.files[0]);
    });
    ["dragenter","dragover"].forEach(function (type) {
        uploadZone.addEventListener(type, function (event) {
            event.preventDefault();
            uploadZone.classList.add("is-dragging");
        });
    });
    ["dragleave","drop"].forEach(function (type) {
        uploadZone.addEventListener(type, function (event) {
            event.preventDefault();
            uploadZone.classList.remove("is-dragging");
        });
    });
    uploadZone.addEventListener("drop", function (event) {
        if (event.dataTransfer && event.dataTransfer.files[0]) handleFile(event.dataTransfer.files[0]);
    });

    function handleFile(file) {
        const type = file.type;
        if (!/^image\/(jpeg|png|webp)$/i.test(type)) {
            showError("Please choose a JPG, PNG or WebP image.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            showError("That image is larger than 10MB. Please choose a smaller photo.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function () {
            const image = new Image();
            image.onload = function () {
                const longSide = Math.max(image.naturalWidth, image.naturalHeight);
                const scale = Math.min(1, 1600 / longSide);
                const width = Math.max(1, Math.round(image.naturalWidth * scale));
                const height = Math.max(1, Math.round(image.naturalHeight * scale));
                photoCanvas.width = overlayCanvas.width = width;
                photoCanvas.height = overlayCanvas.height = height;
                uploadedImage = image;
                drawPhoto();
                createMarkers();
                uploadEmpty.style.display = "none";
                photoCanvas.style.display = "block";
                changePhoto.style.display = "block";
                markerHint.style.display = "block";
                scheduleRedraw();
            };
            image.src = reader.result;
        };
        reader.readAsDataURL(file);
    }

    function drawPhoto() {
        if (!uploadedImage) return;
        const width = photoCanvas.width;
        const height = photoCanvas.height;
        photoCtx.clearRect(0, 0, width, height);
        const imageRatio = uploadedImage.naturalWidth / uploadedImage.naturalHeight;
        const canvasRatio = width / height;
        let sx = 0, sy = 0, sw = uploadedImage.naturalWidth, sh = uploadedImage.naturalHeight;
        if (imageRatio > canvasRatio) {
            sw = uploadedImage.naturalHeight * canvasRatio;
            sx = (uploadedImage.naturalWidth - sw) / 2;
        } else {
            sh = uploadedImage.naturalWidth / canvasRatio;
            sy = (uploadedImage.naturalHeight - sh) / 2;
        }
        photoCtx.drawImage(uploadedImage, sx, sy, sw, sh, 0, 0, width, height);
    }

    function shapePath(context, shape, width, height) {
        context.beginPath();
        const left = -width / 2;
        const right = width / 2;
        const top = -height / 2;
        const bottom = height / 2;
        if (shape === "Square") {
            context.rect(left, top, width, height);
        } else if (shape === "Coffin") {
            context.moveTo(left * .88, top);
            context.lineTo(right * .88, top);
            context.lineTo(right, bottom * .7);
            context.lineTo(right * .68, bottom);
            context.lineTo(left * .68, bottom);
            context.lineTo(left, bottom * .7);
            context.closePath();
        } else if (shape === "Stiletto") {
            context.moveTo(left, bottom);
            context.quadraticCurveTo(0, top * .1, right, bottom);
            context.quadraticCurveTo(right * .35, top, 0, top);
            context.quadraticCurveTo(left * .35, top, left, bottom);
            context.closePath();
        } else if (shape === "Flare") {
            context.moveTo(left * .55, top);
            context.lineTo(right * .55, top);
            context.quadraticCurveTo(right * 1.25, bottom * .1, right * 1.15, bottom);
            context.quadraticCurveTo(0, bottom * 1.05, left * 1.15, bottom);
            context.quadraticCurveTo(left * 1.25, bottom * .1, left * .55, top);
            context.closePath();
        } else {
            context.ellipse(0, top * .72 + bottom * .28, width / 2, height / 2, 0, 0, Math.PI * 2);
        }
    }

    function hexToRgb(hex) {
        const value = parseInt(hex.replace("#",""),16);
        return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
    }

    function drawNail(marker, index) {
        const ctx = overlayCtx;
        const width = overlayCanvas.width * marker.w;
        const height = overlayCanvas.height * marker.h;
        const x = overlayCanvas.width * marker.x;
        const y = overlayCanvas.height * marker.y;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(marker.rotation * Math.PI / 180);
        ctx.globalAlpha = state.opacity / 100;
        ctx.shadowColor = "rgba(23,18,29,.62)";
        ctx.shadowBlur = Math.max(4, width * .12);
        ctx.shadowOffsetY = width * .08;
        shapePath(ctx, state.shape, width, height);
        ctx.clip();

        const primary = hexToRgb(state.primary);
        const secondary = hexToRgb(state.secondary);
        let fill;
        if (state.finish === "Chrome") {
            fill = ctx.createLinearGradient(-width/2, 0, width/2, 0);
            fill.addColorStop(0, state.secondary);
            fill.addColorStop(.45, state.primary);
            fill.addColorStop(.55, "#E8DDEB");
            fill.addColorStop(1, state.secondary);
        } else if (state.finish === "Jelly") {
            fill = "rgba(" + primary[0] + "," + primary[1] + "," + primary[2] + ",.42)";
        } else {
            fill = ctx.createLinearGradient(-width/2,-height/2,width/2,height/2);
            fill.addColorStop(0, state.primary);
            fill.addColorStop(1, state.secondary);
        }
        ctx.fillStyle = fill;
        ctx.fillRect(-width/2,-height/2,width,height);

        if (state.finish === "Matte") {
            ctx.globalAlpha *= .92;
        } else if (state.finish === "Chrome" || state.finish === "Glossy") {
            const streak = ctx.createLinearGradient(-width*.4,-height*.5,width*.1,height*.5);
            streak.addColorStop(0,"rgba(232,221,235,0)");
            streak.addColorStop(.45,"rgba(232,221,235,.72)");
            streak.addColorStop(1,"rgba(232,221,235,0)");
            ctx.fillStyle = streak;
            ctx.fillRect(-width*.55,-height*.5,width*.7,height);
        } else if (state.finish === "Cat-eye") {
            ctx.globalAlpha = .75;
            const band = ctx.createLinearGradient(-width/2,0,width/2,0);
            band.addColorStop(0,"rgba(232,221,235,0)");
            band.addColorStop(.48,"rgba(232,221,235,.85)");
            band.addColorStop(.52,"rgba(121,100,135,.2)");
            band.addColorStop(1,"rgba(232,221,235,0)");
            ctx.fillStyle = band;
            ctx.fillRect(-width/2,-height*.12,width,height*.24);
        } else if (state.finish === "Glitter") {
            ctx.globalAlpha = .9;
            for (let dot = 0; dot < 18; dot += 1) {
                const px = ((dot * 37 + index * 19) % 100) / 100 * width - width/2;
                const py = ((dot * 61 + index * 29) % 100) / 100 * height - height/2;
                ctx.fillStyle = dot % 2 ? state.secondary : "#E8DDEB";
                ctx.beginPath();
                ctx.arc(px,py,Math.max(1,width*.018),0,Math.PI*2);
                ctx.fill();
            }
        }

        const intensity = state.intensity / 100;
        ctx.globalAlpha = intensity;
        ctx.strokeStyle = state.secondary;
        ctx.fillStyle = state.secondary;
        ctx.lineWidth = Math.max(1,width*.035);
        if (state.design === "French tip") {
            ctx.beginPath(); ctx.ellipse(0,-height*.36,width*.48,height*.16,0,0,Math.PI*2); ctx.fill();
        } else if (state.design === "Ombre") {
            ctx.globalAlpha = state.opacity / 100 * .55;
            const gradient = ctx.createLinearGradient(0,-height/2,0,height/2);
            gradient.addColorStop(0,state.secondary);
            gradient.addColorStop(.55,"rgba(232,221,235,0)");
            ctx.fillStyle = gradient; ctx.fillRect(-width/2,-height/2,width,height);
        } else if (state.design === "Gothic cross/webbing") {
            ctx.globalAlpha *= .7;
            ctx.beginPath(); ctx.moveTo(-width*.05,-height*.42); ctx.lineTo(-width*.05,height*.42); ctx.moveTo(-width*.28,0); ctx.lineTo(width*.28,0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-width*.42,-height*.42); ctx.quadraticCurveTo(width*.1,-height*.05,-width*.42,height*.42); ctx.stroke();
        } else if (state.design === "Floral") {
            for (let petal = 0; petal < 5; petal += 1) {
                const angle = petal * Math.PI * 2 / 5;
                ctx.beginPath(); ctx.arc(Math.cos(angle)*width*.17,Math.sin(angle)*width*.17,width*.09,0,Math.PI*2); ctx.fill();
            }
        } else if (state.design === "Leopard") {
            ctx.strokeStyle = "#17121D";
            for (let spot = 0; spot < 8; spot += 1) {
                const px = ((spot * 43) % 100)/100*width-width/2;
                const py = ((spot * 71) % 100)/100*height-height/2;
                ctx.beginPath(); ctx.arc(px,py,width*.06,0,Math.PI*2); ctx.stroke();
            }
        } else if (state.design === "Marble") {
            ctx.strokeStyle = state.secondary;
            for (let vein = -1; vein <= 1; vein += 1) {
                ctx.beginPath();
                ctx.moveTo(-width*.5,vein*height*.25);
                ctx.bezierCurveTo(-width*.15,-height*.35,width*.15,height*.35,width*.5,vein*height*.3);
                ctx.stroke();
            }
        } else if (state.design === "Charms/gems") {
            ctx.fillStyle = "#E8DDEB";
            ctx.beginPath(); ctx.arc(0,-height*.12,Math.max(2,width*.045),0,Math.PI*2); ctx.fill();
            ctx.strokeStyle="#B09BB8"; ctx.beginPath(); ctx.arc(0,-height*.12,width*.09,0,Math.PI*2); ctx.stroke();
        } else if (state.design === "Chrome lines") {
            ctx.strokeStyle="#E8DDEB";
            ctx.beginPath(); ctx.moveTo(-width*.42,height*.25); ctx.lineTo(width*.42,-height*.25); ctx.stroke();
        }
        ctx.restore();

        ctx.save();
        ctx.translate(x,y);
        ctx.rotate(marker.rotation*Math.PI/180);
        shapePath(ctx,state.shape,width,height);
        ctx.strokeStyle="rgba(232,221,235,.32)";
        ctx.lineWidth=Math.max(1,width*.012);
        ctx.stroke();
        ctx.restore();
    }

    function scheduleRedraw() {
        if (redrawFrame !== null) cancelAnimationFrame(redrawFrame);
        redrawFrame = requestAnimationFrame(function () {
            redrawFrame = null;
            if (!uploadedImage) return;
            overlayCtx.clearRect(0,0,overlayCanvas.width,overlayCanvas.height);
            markers.forEach(function (marker,index) {
                if (state.applyMode === "selected" && index !== state.selectedMarker) return;
                drawNail(marker,index);
            });
            syncMarkers();
        });
    }

    function createMarkers() {
        markerLayer.innerHTML = "";
        markers.forEach(function (marker,index) {
            const element = document.createElement("button");
            element.type = "button";
            element.className = "nail-marker" + (index === state.selectedMarker ? " is-selected" : "");
            element.style.left = marker.x * 100 + "%";
            element.style.top = marker.y * 100 + "%";
            element.style.width = marker.w * 100 + "%";
            element.style.height = marker.h * 100 + "%";
            element.style.transform = "translate(-50%,-50%) rotate(" + marker.rotation + "deg)";
            element.dataset.index = index;
            element.setAttribute("aria-label","Nail marker " + (index + 1));

            const number = document.createElement("span");
            number.className = "marker-number";
            number.textContent = index + 1;
            element.appendChild(number);
            const resizeHandle = document.createElement("span");
            resizeHandle.className = "marker-resize";
            resizeHandle.dataset.handle = "resize";
            element.appendChild(resizeHandle);
            const rotateHandle = document.createElement("span");
            rotateHandle.className = "marker-rotate";
            rotateHandle.dataset.handle = "rotate";
            element.appendChild(rotateHandle);

            element.addPointerCapture && element.addEventListener("pointerdown", startPointer);
            markerLayer.appendChild(element);
        });
    }

    function syncMarkers() {
        Array.from(markerLayer.children).forEach(function (element,index) {
            const marker = markers[index];
            element.classList.toggle("is-selected", index === state.selectedMarker);
            element.style.left = marker.x * 100 + "%";
            element.style.top = marker.y * 100 + "%";
            element.style.width = marker.w * 100 + "%";
            element.style.height = marker.h * 100 + "%";
            element.style.transform = "translate(-50%,-50%) rotate(" + marker.rotation + "deg)";
        });
    }

    function startPointer(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const index = Number(element.dataset.index);
        state.selectedMarker = index;
        Array.from(markerLayer.children).forEach(function (child) { child.classList.toggle("is-selected", Number(child.dataset.index) === index); });
        const handle = event.target.dataset.handle;
        drag = { index: index, type: handle || "move", pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
        element.setPointerCapture(event.pointerId);
        element.addEventListener("pointermove", movePointer);
        element.addEventListener("pointerup", endPointer, { once: true });
        markerHint.textContent = "Marker " + (index + 1) + " selected. Drag, resize or rotate it.";
        scheduleRedraw();
    }

    function movePointer(event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        const marker = markers[drag.index];
        const rect = uploadZone.getBoundingClientRect();
        if (drag.type === "move") {
            marker.x = Math.max(marker.w/2, Math.min(1-marker.w/2, marker.x + (event.clientX-drag.startX)/rect.width));
            marker.y = Math.max(marker.h/2, Math.min(1-marker.h/2, marker.y + (event.clientY-drag.startY)/rect.height));
            drag.startX = event.clientX;
            drag.startY = event.clientY;
        } else if (drag.type === "resize") {
            marker.w = Math.max(.025, Math.min(.16, marker.w + (event.clientX-drag.startX)/rect.width));
            marker.h = Math.max(.07, Math.min(.28, marker.h + (event.clientY-drag.startY)/rect.height));
            drag.startX = event.clientX;
            drag.startY = event.clientY;
        } else {
            const elementRect = event.currentTarget.getBoundingClientRect();
            const cx = elementRect.left + elementRect.width/2;
            const cy = elementRect.top + elementRect.height/2;
            marker.rotation = Math.atan2(event.clientY-cy,event.clientX-cx)*180/Math.PI + 90;
        }
        scheduleRedraw();
    }

    function endPointer(event) {
        event.currentTarget.removeEventListener("pointermove", movePointer);
        drag = null;
    }

    function generateShapeIcons() {
        const grid = document.getElementById("shape-grid");
        DATA.shapes.forEach(function (shape) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "shape-tile" + (state.shape === shape ? " is-active" : "");
            button.setAttribute("aria-pressed", state.shape === shape ? "true" : "false");
            button.innerHTML = '<svg class="shape-icon" viewBox="0 0 60 44"><path d="' + shapeIconPath(shape) + '"/></svg><span>' + shape + "</span>";
            button.addEventListener("click", function () {
                state.shape = shape;
                saveSelection();
                Array.from(grid.children).forEach(function (tile) {
                    tile.classList.remove("is-active");
                    tile.setAttribute("aria-pressed","false");
                });
                button.classList.add("is-active");
                button.setAttribute("aria-pressed","true");
                scheduleRedraw();
            });
            grid.appendChild(button);
        });
    }

    function shapeIconPath(shape) {
        if (shape === "Square") return "M14 8h32v28H14z";
        if (shape === "Coffin") return "M14 8h32l-8 28H22z";
        if (shape === "Stiletto") return "M14 36Q30 4 46 36Q30 34 14 36z";
        if (shape === "Flare") return "M20 8h20l12 28H8z";
        if (shape === "Round") return "M14 36V18a16 16 0 0 1 32 0v18z";
        if (shape === "Almond") return "M30 4C43 18 46 36 30 40C14 36 17 18 30 4z";
        if (shape === "Squoval") return "M14 36V16a16 16 0 0 1 32 0v20z";
        return "M14 36V16a16 16 0 0 1 32 0v20z";
    }

    function generateTypeControls() {
        const list = document.getElementById("type-list");
        DATA.nailTypes.forEach(function (item) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "type-card" + (state.nailType === item[0] ? " is-active" : "");
            button.setAttribute("aria-pressed",state.nailType === item[0] ? "true":"false");
            button.innerHTML = "<strong>" + item[0] + "</strong><small>" + item[1] + "</small>";
            button.addEventListener("click",function () {
                state.nailType=item[0]; saveSelection();
                Array.from(list.children).forEach(function (child) { child.classList.remove("is-active"); child.setAttribute("aria-pressed","false"); });
                button.classList.add("is-active"); button.setAttribute("aria-pressed","true"); scheduleRedraw();
            });
            list.appendChild(button);
        });
        const lengths = document.getElementById("length-options");
        DATA.lengths.forEach(function (length) {
            const button=document.createElement("button"); button.type="button"; button.textContent=length;
            button.className=state.length===length?"is-active":"";
            button.setAttribute("aria-pressed",state.length===length?"true":"false");
            button.addEventListener("click",function () {
                state.length=length; saveSelection();
                Array.from(lengths.children).forEach(function (child) { child.classList.remove("is-active"); child.setAttribute("aria-pressed","false"); });
                button.classList.add("is-active"); button.setAttribute("aria-pressed","true"); scheduleRedraw();
            });
            lengths.appendChild(button);
        });
        const finishes=document.getElementById("finish-options");
        DATA.finishes.forEach(function(finish) {
            const button=document.createElement("button"); button.type="button"; button.className="finish-button"+(state.finish===finish?" is-active":""); button.textContent=finish;
            button.setAttribute("aria-pressed",state.finish===finish?"true":"false");
            button.addEventListener("click",function () {
                state.finish=finish; saveSelection();
                Array.from(finishes.children).forEach(function(child) { child.classList.remove("is-active"); child.setAttribute("aria-pressed","false"); });
                button.classList.add("is-active"); button.setAttribute("aria-pressed","true"); scheduleRedraw();
            });
            finishes.appendChild(button);
        });
    }

    function generateColourControls() {
        const primary=document.getElementById("primary-color");
        const secondary=document.getElementById("secondary-color");
        const opacity=document.getElementById("opacity");
        const intensity=document.getElementById("intensity");
        primary.value=state.primary; secondary.value=state.secondary; opacity.value=state.opacity; intensity.value=state.intensity;
        primary.addEventListener("input",function(){state.primary=primary.value;saveSelection();scheduleRedraw();});
        secondary.addEventListener("input",function(){state.secondary=secondary.value;saveSelection();scheduleRedraw();});
        opacity.addEventListener("input",function(){state.opacity=Number(opacity.value);saveSelection();scheduleRedraw();});
        intensity.addEventListener("input",function(){state.intensity=Number(intensity.value);saveSelection();scheduleRedraw();});

        const swatches=document.getElementById("swatches");
        DATA.swatches.forEach(function(item) {
            const button=document.createElement("button"); button.type="button"; button.className="swatch"; button.style.background=item[1]; button.title=item[0]; button.setAttribute("aria-label",item[0]); button.setAttribute("aria-pressed","false");
            button.addEventListener("click",function(){
                state.primary=item[1]; primary.value=item[1]; saveSelection();
                Array.from(swatches.children).forEach(function(swatch){swatch.classList.remove("is-active");swatch.setAttribute("aria-pressed","false");});
                button.classList.add("is-active");button.setAttribute("aria-pressed","true");scheduleRedraw();
            });
            swatches.appendChild(button);
        });
        const designs=document.getElementById("design-grid");
        DATA.designs.forEach(function(design) {
            const button=document.createElement("button");button.type="button";button.className="design-button"+(state.design===design?" is-active":"");button.textContent=design;button.setAttribute("aria-pressed",state.design===design?"true":"false");
            button.addEventListener("click",function(){
                state.design=design;saveSelection();
                Array.from(designs.children).forEach(function(child){child.classList.remove("is-active");child.setAttribute("aria-pressed","false");});
                button.classList.add("is-active");button.setAttribute("aria-pressed","true");scheduleRedraw();
            });
            designs.appendChild(button);
        });
    }

    Array.from(document.querySelectorAll(".option-button")).forEach(function(button) {
        button.addEventListener("click",function(){
            const panelId=button.dataset.panel;
            Array.from(document.querySelectorAll(".option-button")).forEach(function(tab){
                const active=tab===button;tab.classList.toggle("is-active",active);tab.setAttribute("aria-expanded",active?"true":"false");tab.setAttribute("aria-pressed",active?"true":"false");
            });
            Array.from(document.querySelectorAll(".options-panel")).forEach(function(panel){
                const active=panel.id===panelId;
                panel.hidden=!active;
                panel.classList.toggle("is-open",active);
            });
        });
    });

    Array.from(document.querySelectorAll("input[name='apply-mode']")).forEach(function(input) {
        if (input.value === state.applyMode) input.checked=true;
        input.addEventListener("change",function(){state.applyMode=input.value;saveSelection();scheduleRedraw();});
    });

    document.getElementById("reset-button").addEventListener("click",function(){
        state.shape="Almond";state.nailType="Gel";state.length="Medium";state.finish="Glossy";state.primary="#796487";state.secondary="#B09BB8";state.opacity=90;state.design="Solid";state.intensity=55;state.applyMode="all";
        saveSelection();
        window.location.reload();
    });

    document.getElementById("download-button").addEventListener("click",function(){
        if (!uploadedImage) { showError("Upload a hand photo before downloading."); return; }
        drawOverlay();
        const exportCanvas=document.createElement("canvas");
        exportCanvas.width=photoCanvas.width;exportCanvas.height=photoCanvas.height;
        const exportCtx=exportCanvas.getContext("2d");
        exportCtx.drawImage(photoCanvas,0,0);
        exportCtx.drawImage(overlayCanvas,0,0);
        exportCanvas.toBlob(function(blob){
            if (!blob) { showError("The image could not be prepared for download."); return; }
            const url=URL.createObjectURL(blob);
            const link=document.createElement("a");link.href=url;link.download="lumiere-noire-nail-look.png";link.click();
            window.setTimeout(function(){URL.revokeObjectURL(url);},1000);
        },"image/png");
    });

    document.getElementById("year").textContent = new Date().getFullYear();
    generateShapeIcons();
    generateTypeControls();
    generateColourControls();
}) ();
