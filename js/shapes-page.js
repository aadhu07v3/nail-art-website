(function () {
  "use strict";

  var data = Array.isArray(window.SHAPE_DATA) ? window.SHAPE_DATA : [];
  var filterList = document.getElementById("shape-filter-list");
  var filterCount = document.getElementById("shape-filter-count");
  var sectionsRoot = document.getElementById("shape-sections");
  var heroCount = document.getElementById("shapes-count");
  var lightbox = document.getElementById("shape-lightbox");
  var lightboxStage = document.getElementById("shape-lightbox-stage");
  var lightboxCaption = document.getElementById("shape-lightbox-caption");
  var lightboxClose = lightbox
    ? lightbox.querySelector(".shape-lightbox-close")
    : null;
  var lightboxPrev = document.getElementById("shape-lightbox-prev");
  var lightboxNext = document.getElementById("shape-lightbox-next");

  if (!sectionsRoot) return;

  if (heroCount) heroCount.textContent = String(data.length);

  if (!data.length) {
    var empty = document.createElement("p");
    empty.className = "shape-noscript";
    empty.textContent = "No shape media found. Add images to images/shapes and run npm run shapes:data.";
    sectionsRoot.appendChild(empty);
    return;
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function createEl(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  var gallery = [];
  var sections = [];
  var filterButtons = [];
  var currentIndex = 0;
  var lastFocused = null;

  function createMediaCard(shape, file, fileIndex) {
    var galleryIndex = gallery.length;
    gallery.push({
      type: file.type,
      src: file.src,
      poster: file.poster || "",
      shapeName: shape.name
    });

    var figure = createEl(
      "figure",
      "shape-media-card fade-up delay-" + ((fileIndex % 3) + 1)
    );
    if (file.type === "video") figure.classList.add("is-video");

    var caption = createEl("figcaption", "shape-media-caption");
    var captionName = createEl("span", "shape-media-name");
    captionName.textContent = shape.name;
    var captionMeta = createEl("span", "shape-media-meta");
    captionMeta.textContent =
      (file.type === "video" ? "Film" : "Still") + " " + pad(fileIndex + 1);
    caption.appendChild(captionName);
    caption.appendChild(captionMeta);

    if (file.type === "video") {
      var video = document.createElement("video");
      video.src = file.src;
      if (file.poster) video.poster = file.poster;
      video.controls = true;
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("aria-label", shape.name + " nail shape video");

      var videoButton = createEl(
        "button",
        "shape-media-open shape-media-open--corner"
      );
      videoButton.type = "button";
      videoButton.setAttribute("data-gallery-index", String(galleryIndex));
      videoButton.setAttribute(
        "aria-label",
        "Open " + shape.name + " video in viewer"
      );
      var videoIcon = createEl("span", "shape-media-expand-icon");
      videoIcon.setAttribute("aria-hidden", "true");
      videoIcon.textContent = "\u2922";
      videoButton.appendChild(videoIcon);

      figure.appendChild(video);
      figure.appendChild(videoButton);
      figure.appendChild(caption);
      return figure;
    }

    var button = createEl("button", "shape-media-open");
    button.type = "button";
    button.setAttribute("data-gallery-index", String(galleryIndex));
    button.setAttribute(
      "aria-label",
      "View " + shape.name + " nail shape" + (fileIndex ? " " + (fileIndex + 1) : "")
    );

    var image = document.createElement("img");
    image.src = file.src;
    image.alt = shape.name + " nail shape";
    image.loading = "lazy";
    image.decoding = "async";

    var overlay = createEl("span", "shape-media-overlay");
    overlay.setAttribute("aria-hidden", "true");
    var icon = createEl("span", "shape-media-expand-icon");
    icon.textContent = "View";
    overlay.appendChild(icon);

    button.appendChild(image);
    button.appendChild(overlay);
    figure.appendChild(button);
    figure.appendChild(caption);
    return figure;
  }

  function createShapeSection(shape, shapeIndex) {
    var section = createEl("section", "shape-section");
    section.id = "shape-" + shape.slug;
    section.setAttribute("data-shape", shape.slug);

    var inner = createEl("div", "shape-section-inner");
    var head = createEl("header", "shape-section-head fade-up");
    var headingWrap = createEl("div", "shape-heading-wrap");
    var index = createEl("p", "shape-index");
    index.textContent = pad(shapeIndex + 1) + " / " + pad(data.length);
    var heading = createEl("h2", "shape-name");
    heading.textContent = shape.name;
    var description = createEl("p", "shape-description");
    description.textContent = shape.description || "";

    headingWrap.appendChild(index);
    headingWrap.appendChild(heading);
    head.appendChild(headingWrap);
    head.appendChild(description);

    var grid = createEl("div", "shape-media-grid");
    grid.setAttribute("data-count", String(shape.files.length));
    shape.files.forEach(function (file, fileIndex) {
      grid.appendChild(createMediaCard(shape, file, fileIndex));
    });

    inner.appendChild(head);
    inner.appendChild(grid);
    section.appendChild(inner);
    return section;
  }

  data.forEach(function (shape, shapeIndex) {
    var section = createShapeSection(shape, shapeIndex);
    sections.push(section);
    sectionsRoot.appendChild(section);
  });

  function createFilterButton(label, slug) {
    var button = createEl("button", "shape-filter-button");
    button.type = "button";
    button.setAttribute("data-filter", slug);
    button.setAttribute("aria-pressed", "false");
    button.textContent = label;
    button.addEventListener("click", function () {
      applyFilter(slug);
    });
    filterButtons.push(button);
    return button;
  }

  function updateCount(visible) {
    if (!filterCount) return;
    filterCount.textContent =
      "Showing " + visible + " of " + data.length +
      (data.length === 1 ? " shape" : " shapes");
  }

  function applyFilter(slug) {
    filterButtons.forEach(function (button) {
      var active = button.getAttribute("data-filter") === slug;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    var visible = 0;
    sections.forEach(function (section) {
      var show =
        slug === "all" || section.getAttribute("data-shape") === slug;
      section.hidden = !show;
      if (show) visible += 1;
    });

    updateCount(visible);
  }

  if (filterList) {
    filterList.appendChild(createFilterButton("All", "all"));
    data.forEach(function (shape) {
      filterList.appendChild(createFilterButton(shape.name, shape.slug));
    });
    applyFilter("all");
  }

  function renderLightbox(index) {
    if (!lightbox || !lightboxStage || !gallery.length) return;

    currentIndex = (index + gallery.length) % gallery.length;
    var item = gallery[currentIndex];
    lightboxStage.innerHTML = "";

    if (item.type === "video") {
      var video = document.createElement("video");
      if (item.sources && item.sources.length) {
        item.sources.forEach(function (source) {
          var sourceEl = document.createElement("source");
          sourceEl.src = source.src;
          sourceEl.type = source.type;
          video.appendChild(sourceEl);
        });
      } else {
        video.src = item.src;
      }
      if (item.poster) video.poster = item.poster;
      video.controls = true;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.preload = "auto";
      video.setAttribute("aria-label", item.shapeName + " nail video");
      lightboxStage.appendChild(video);
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    } else {
      var image = document.createElement("img");
      image.src = item.src;
      image.alt = item.shapeName + " nail shape";
      image.decoding = "async";
      lightboxStage.appendChild(image);
    }

    if (lightboxCaption) {
      lightboxCaption.textContent =
        item.shapeName + " \u00b7 " + (currentIndex + 1) + " of " +
        gallery.length + (item.type === "video" ? " \u00b7 Video" : "");
    }

    var multiple = gallery.length > 1;
    if (lightboxPrev) lightboxPrev.hidden = !multiple;
    if (lightboxNext) lightboxNext.hidden = !multiple;
  }

  function openLightbox(index) {
    if (!lightbox) return;
    lastFocused = document.activeElement;
    renderLightbox(index);
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    window.requestAnimationFrame(function () {
      if (lightboxClose) lightboxClose.focus();
    });
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    if (lightboxStage) lightboxStage.innerHTML = "";
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
    lastFocused = null;
  }

  document.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-gallery-index]");
    if (!trigger) return;
    openLightbox(Number(trigger.getAttribute("data-gallery-index")));
  });

  if (lightbox) {
    lightbox.addEventListener("click", function (event) {
      if (event.target.hasAttribute("data-lightbox-close")) closeLightbox();
    });

    if (lightboxClose) {
      lightboxClose.addEventListener("click", closeLightbox);
    }

    if (lightboxPrev) {
      lightboxPrev.addEventListener("click", function () {
        renderLightbox(currentIndex - 1);
      });
    }

    if (lightboxNext) {
      lightboxNext.addEventListener("click", function () {
        renderLightbox(currentIndex + 1);
      });
    }

    document.addEventListener("keydown", function (event) {
      if (lightbox.hidden) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        renderLightbox(currentIndex - 1);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        renderLightbox(currentIndex + 1);
        return;
      }

      if (event.key === "Tab") {
        var focusable = Array.prototype.filter.call(
          lightbox.querySelectorAll(
            'button:not([hidden]), [href], video[controls], [tabindex]:not([tabindex="-1"])'
          ),
          function (node) {
            return !node.hasAttribute("hidden");
          }
        );

        if (!focusable.length) return;

        var first = focusable[0];
        var last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });
  }
})();
