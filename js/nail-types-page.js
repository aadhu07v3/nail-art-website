(function () {
  "use strict";

  var data = Array.isArray(window.NAIL_TYPE_DATA) ? window.NAIL_TYPE_DATA : [];
  var sectionsRoot = document.getElementById("nail-types-sections");
  var filterList = document.getElementById("nail-types-filter-list");
  var filterCount = document.getElementById("nail-types-filter-count");
  var typeCount = document.getElementById("nail-type-count");
  var mediaCount = document.getElementById("nail-media-count");
  var lightbox = document.getElementById("nail-types-lightbox");
  var lightboxStage = document.getElementById("nail-types-lightbox-stage");
  var lightboxCaption = document.getElementById("nail-types-lightbox-caption");
  var lightboxClose = lightbox
    ? lightbox.querySelector(".nail-types-lightbox-close")
    : null;
  var lightboxPrev = document.getElementById("nail-types-lightbox-prev");
  var lightboxNext = document.getElementById("nail-types-lightbox-next");

  if (!sectionsRoot) return;

  var gallery = [];
  var activeGallery = [];
  var sections = [];
  var filterButtons = [];
  var currentFilter = "all";
  var currentIndex = 0;
  var lastFocused = null;

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function createEl(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function filenameLabel(src) {
    var file = String(src).split("/").pop().split("?")[0];
    return file
      .replace(/\.[^.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim()
      .split(/\s+/)
      .map(function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }

  function altText(src, type) {
    return (
      filenameLabel(src) +
      (type === "video" ? " nail application video" : " nail application image")
    );
  }

  function normalizeMediaPath(src) {
    var normalized = String(src || "")
      .replace(/\\/g, "/")
      .split(/[?#]/)[0];
    var mediaIndex = normalized.lastIndexOf("assets/media/");

    if (mediaIndex !== -1) {
      return "./" + normalized.slice(mediaIndex);
    }

    return "./assets/media/" + normalized.slice(normalized.lastIndexOf("/") + 1);
  }

  function mediaPathKey(src) {
    return normalizeMediaPath(src).toLowerCase();
  }

  function groupFiles(files) {
    var groups = [];
    var seenVideoPaths = new Set();
    var videoBases = new Set();
    var hasVideo = false;

    files.forEach(function (file) {
      if (file.type === "video") videoBases.add(file.base);
    });

    files.forEach(function (file) {
      if (file.type === "video") {
        var pathKey = mediaPathKey(file.src);
        if (seenVideoPaths.has(pathKey) || hasVideo) return;
        seenVideoPaths.add(pathKey);
        hasVideo = true;

        var videoFile = Object.assign({}, file, {
          src: normalizeMediaPath(file.src),
          poster: file.poster ? normalizeMediaPath(file.poster) : ""
        });
        groups.push({
          type: "video",
          base: file.base,
          poster: videoFile.poster,
          sources: [videoFile]
        });
        return;
      }

      if (videoBases.has(file.base)) return;

      groups.push({
        type: "image",
        base: file.base,
        src: normalizeMediaPath(file.src),
        format: file.format,
        poster: ""
      });
    });

    return groups;
  }

  function createMediaCard(type, group, groupIndex) {
    var globalIndex = gallery.length;
    var isVideo = group.type === "video";
    var alt = altText(
      isVideo ? group.sources[0].src : group.src,
      group.type
    );

    gallery.push({
      globalIndex: globalIndex,
      type: group.type,
      typeSlug: type.slug,
      name: type.name,
      alt: alt,
      src: group.src || "",
      sources: group.sources || [],
      poster: group.poster || ""
    });

    var figure = createEl(
      "figure",
      "nail-media-card glass-card fade-up delay-" + ((groupIndex % 3) + 1)
    );

    if (isVideo) {
      var video = document.createElement("video");
      video.className = "nail-media-video";
      video.controls = true;
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("aria-label", alt);
      if (group.poster) video.poster = group.poster;

      group.sources.forEach(function (source) {
        var sourceEl = document.createElement("source");
        sourceEl.src = source.src;
        sourceEl.type =
          source.format === "webm"
            ? "video/webm"
            : source.format === "mov"
              ? "video/quicktime"
              : "video/mp4";
        video.appendChild(sourceEl);
      });

      var expand = createEl("button", "nail-media-expand glass-btn");
      expand.type = "button";
      expand.setAttribute("data-gallery-index", String(globalIndex));
      expand.setAttribute(
        "aria-label",
        "Open " + type.name + " video in viewer"
      );
      expand.textContent = "\u2922";

      var videoCaption = createEl("figcaption", "nail-media-caption");
      var videoName = createEl("span", "nail-media-name");
      videoName.textContent = type.name;
      var videoMeta = createEl("span", "nail-media-meta");
      videoMeta.textContent =
        "Video \u00b7 " +
        group.sources
          .map(function (source) {
            return String(source.format).toUpperCase();
          })
          .join(" / ");
      videoCaption.appendChild(videoName);
      videoCaption.appendChild(videoMeta);

      figure.appendChild(video);
      figure.appendChild(expand);
      figure.appendChild(videoCaption);
      return figure;
    }

    var button = createEl("button", "nail-media-open");
    button.type = "button";
    button.setAttribute("data-gallery-index", String(globalIndex));
    button.setAttribute(
      "aria-label",
      "View " + type.name + " nail application image"
    );

    var image = document.createElement("img");
    image.src = group.src;
    image.alt = alt;
    image.loading = "lazy";
    image.decoding = "async";

    var overlay = createEl("span", "nail-media-overlay");
    overlay.setAttribute("aria-hidden", "true");
    var pill = createEl("span", "nail-media-pill");
    pill.textContent = "View";
    overlay.appendChild(pill);

    button.appendChild(image);
    button.appendChild(overlay);

    var imageCaption = createEl("figcaption", "nail-media-caption");
    var imageName = createEl("span", "nail-media-name");
    imageName.textContent = type.name;
    var imageMeta = createEl("span", "nail-media-meta");
    imageMeta.textContent =
      (group.format === "webp" ? "Animation" : "Still") +
      " \u00b7 " +
      String(group.format).toUpperCase();
    imageCaption.appendChild(imageName);
    imageCaption.appendChild(imageMeta);

    figure.appendChild(button);
    figure.appendChild(imageCaption);
    return figure;
  }

  function createSection(type, typeIndex) {
    var groups = groupFiles(type.files);
    var section = createEl("section", "nail-type-section");
    section.id = "nail-type-" + type.slug;
    section.setAttribute("data-nail-type", type.slug);

    var head = createEl("div", "nail-type-head glass fade-up");
    var headCopy = createEl("div", "nail-type-head-copy");
    var name = createEl("h2", "nail-type-name");
    name.textContent = type.name;
    var description = createEl("p", "nail-type-description");
    description.textContent = type.description || "";

    headCopy.appendChild(name);
    headCopy.appendChild(description);

    var count = createEl("p", "nail-type-count");
    count.textContent =
      pad(typeIndex + 1) +
      " / " +
      pad(data.length) +
      " \u00b7 " +
      groups.length +
      " file" +
      (groups.length === 1 ? "" : "s");

    head.appendChild(headCopy);
    head.appendChild(count);

    var grid = createEl("div", "nail-type-grid");
    groups.forEach(function (group, groupIndex) {
      grid.appendChild(createMediaCard(type, group, groupIndex));
    });

    section.appendChild(head);
    section.appendChild(grid);
    return section;
  }

  if (typeCount) typeCount.textContent = String(data.length);

  if (mediaCount) {
    var totalMedia = data.reduce(function (sum, type) {
      return sum + groupFiles(type.files).length;
    }, 0);
    mediaCount.textContent = String(totalMedia);
  }

  if (!data.length) {
    var empty = createEl("p", "nail-types-empty");
    empty.textContent =
      "No nail type media found. Add files to videos/ and run npm run media:data.";
    sectionsRoot.appendChild(empty);
    return;
  }

  data.forEach(function (type, typeIndex) {
    var section = createSection(type, typeIndex);
    sections.push(section);
    sectionsRoot.appendChild(section);
  });

  document.addEventListener(
    "play",
    function (event) {
      var playingVideo = event.target;
      if (!playingVideo || playingVideo.tagName !== "VIDEO") return;

      document.querySelectorAll("video").forEach(function (video) {
        if (video !== playingVideo) video.pause();
      });
    },
    true
  );

  function createFilterButton(label, slug) {
    var button = createEl("button", "nail-types-filter-btn glass-btn");
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
      "Showing " +
      visible +
      " of " +
      data.length +
      (data.length === 1 ? " type" : " types");
  }

  function applyFilter(slug) {
    currentFilter = slug;

    filterButtons.forEach(function (button) {
      var active = button.getAttribute("data-filter") === slug;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });

    var visible = 0;
    sections.forEach(function (section) {
      var show =
        slug === "all" || section.getAttribute("data-nail-type") === slug;
      section.hidden = !show;
      if (show) visible += 1;
    });

    updateCount(visible);
  }

  if (filterList) {
    filterList.appendChild(createFilterButton("All", "all"));
    data.forEach(function (type) {
      filterList.appendChild(createFilterButton(type.name, type.slug));
    });
    applyFilter("all");
  }

  function buildActiveGallery(globalIndex) {
    var pool =
      currentFilter === "all"
        ? gallery.slice()
        : gallery.filter(function (item) {
            return item.typeSlug === currentFilter;
          });

    if (!pool.length) pool = gallery.slice();

    var localIndex = pool.findIndex(function (item) {
      return item.globalIndex === globalIndex;
    });

    if (localIndex === -1) localIndex = 0;

    activeGallery = pool;
    return localIndex;
  }

  function renderLightbox(index) {
    if (!lightbox || !lightboxStage || !activeGallery.length) return;

    currentIndex = (index + activeGallery.length) % activeGallery.length;
    var item = activeGallery[currentIndex];
    lightboxStage.innerHTML = "";

    if (item.type === "video") {
      var video = document.createElement("video");
      video.controls = true;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      video.preload = "auto";
      video.setAttribute("aria-label", item.alt);
      if (item.poster) video.poster = item.poster;

      item.sources.forEach(function (source) {
        var sourceEl = document.createElement("source");
        sourceEl.src = source.src;
        sourceEl.type =
          source.format === "webm"
            ? "video/webm"
            : source.format === "mov"
              ? "video/quicktime"
              : "video/mp4";
        video.appendChild(sourceEl);
      });

      lightboxStage.appendChild(video);

      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(function () {});
      }
    } else {
      var image = document.createElement("img");
      image.src = item.src;
      image.alt = item.alt;
      image.decoding = "async";
      lightboxStage.appendChild(image);
    }

    if (lightboxCaption) {
      lightboxCaption.textContent =
        item.name +
        " \u00b7 " +
        (currentIndex + 1) +
        " of " +
        activeGallery.length +
        (item.type === "video" ? " \u00b7 Video" : " \u00b7 Image");
    }

    var multiple = activeGallery.length > 1;
    if (lightboxPrev) lightboxPrev.hidden = !multiple;
    if (lightboxNext) lightboxNext.hidden = !multiple;
  }

  function openLightbox(globalIndex) {
    if (!lightbox) return;
    lastFocused = document.activeElement;
    renderLightbox(buildActiveGallery(globalIndex));
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
    activeGallery = [];
    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
    lastFocused = null;
  }

  sectionsRoot.addEventListener("click", function (event) {
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
