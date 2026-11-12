"use strict";

/**
 * Scans videos/ and images/shapes, copies media into assets/media, creates a
 * first-frame poster for every video, and writes the data arrays used by the
 * Shapes and Nail Types pages.
 *
 * Run: npm run media:data
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const VIDEO_ROOT = path.join(ROOT, "videos");
const SHAPE_ROOT = path.join(ROOT, "images", "shapes");
const MEDIA_ROOT = path.join(ROOT, "assets", "media");
const POSTER_ROOT = path.join(MEDIA_ROOT, "posters");
const SHAPES_OUTPUT = path.join(ROOT, "js", "shapes-data.js");
const NAIL_TYPES_OUTPUT = path.join(ROOT, "js", "nail-types-data.js");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);

const SHAPE_ORDER = [
  "almond",
  "oval",
  "round",
  "square",
  "squoval",
  "coffin",
  "stiletto",
  "flare"
];

const SHAPE_NAMES = {
  almond: "Almond",
  coffin: "Coffin",
  flare: "Flare",
  oval: "Oval",
  round: "Round",
  square: "Square",
  squoval: "Squoval",
  stiletto: "Stiletto"
};

const SHAPE_DESCRIPTIONS = {
  almond: "A softly tapered tip that elongates the finger with timeless elegance.",
  coffin: "A dramatic squared tip with tapered sides for a bold, editorial finish.",
  flare: "A flared, fan-like silhouette that brings statement energy to the set.",
  oval: "A rounded, elongated shape that flatters every hand with a natural finish.",
  round: "A classic, low-maintenance curve that keeps the look soft and polished.",
  square: "Clean, straight sides and a flat tip for a crisp, modern statement.",
  squoval: "The best of both worlds: square edges softened with a rounded finish.",
  stiletto: "A sharp, pointed tip for high-impact glamour and dramatic length."
};

const NAIL_TYPE_ORDER = [
  "gel",
  "acrylic",
  "builder-gel",
  "dip-powder",
  "fiberglass",
  "press-on",
  "french",
  "chrome",
  "matte",
  "glitter",
  "ombre"
];

const NAIL_TYPE_NAMES = {
  gel: "Gel",
  acrylic: "Acrylic",
  "builder-gel": "Builder Gel",
  "dip-powder": "Dip Powder",
  fiberglass: "Fibreglass",
  "press-on": "Press-on",
  french: "French",
  chrome: "Chrome",
  matte: "Matte",
  glitter: "Glitter",
  ombre: "Ombre"
};

const NAIL_TYPE_DESCRIPTIONS = {
  gel: "A glossy, flexible finish cured under UV/LED light for a natural, long-lasting shine.",
  acrylic: "Liquid-and-powder sculpting for strong, customisable extensions with crisp shape control.",
  "builder-gel": "A thicker gel overlay that builds strength and structure while keeping a lightweight feel.",
  "dip-powder": "Layered resin and pigment powder for durable, lightweight colour with a smooth finish.",
  fiberglass: "Fine fibreglass mesh bonded with resin for flexible reinforcement and natural-looking strength.",
  "press-on": "Pre-sculpted, reusable sets sized and finished for instant salon-level wear at home.",
  french: "A timeless nude base with crisp white tips for a clean, classic manicure.",
  chrome: "A mirror-like metallic finish layered over cured colour for high-shine impact.",
  matte: "A velvety, low-shine top coat that softens colour and adds a modern editorial edge.",
  glitter: "Suspended sparkle and metallic particles layered for depth, texture, and celebration.",
  ombre: "A seamless gradient fade between two or more shades for a soft, blended effect."
};

const FALLBACK_SHAPE_DESCRIPTION =
  "A distinctive nail silhouette from the Aura Atelier collection.";
const FALLBACK_NAIL_TYPE_DESCRIPTION =
  "A signature application technique from the Aura Atelier collection.";

const SHAPE_SLUGS = new Set(SHAPE_ORDER);
const NAIL_TYPE_SLUGS = new Set(NAIL_TYPE_ORDER);

const posterStats = { generated: 0, reused: 0, missing: 0 };
const hasFfmpeg =
  spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status === 0;

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleCase(value) {
  return String(value)
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function displayName(slug, names) {
  return names[slug] || titleCase(slug);
}

function isMediaExtension(extension) {
  return IMAGE_EXTENSIONS.has(extension) || VIDEO_EXTENSIONS.has(extension);
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];

  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  entries.forEach((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  });

  return files.sort();
}

function toPublicPath(fullPath) {
  return path.relative(ROOT, fullPath).split(path.sep).join("/");
}

function toMediaPublicPath(fullPath) {
  return "./assets/media/" + path.relative(MEDIA_ROOT, fullPath).split(path.sep).join("/");
}

function mediaPathKey(src) {
  return String(src || "")
    .replace(/\\/g, "/")
    .split(/[?#]/)[0]
    .replace(/^\.?\//, "")
    .toLowerCase();
}

function copyFileIfNeeded(sourcePath, destinationPath) {
  const sourceStat = fs.statSync(sourcePath);

  if (fs.existsSync(destinationPath)) {
    const destinationStat = fs.statSync(destinationPath);
    if (destinationStat.size === sourceStat.size) return false;
  }

  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
  return true;
}

/**
 * Pulls the first ANMF frame out of an animated WebP and writes it as a
 * standalone still WebP. This is our ffmpeg-free first-frame extractor.
 */
function extractFirstFrameFromWebp(webpPath, posterPath) {
  const buffer = fs.readFileSync(webpPath);

  if (
    buffer.length < 20 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WEBP"
  ) {
    return false;
  }

  let offset = 12;
  let frame = null;

  while (offset + 8 <= buffer.length) {
    const fourcc = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);

    if (fourcc === "ANMF") {
      frame = { offset, size };
      break;
    }

    offset += 8 + size + (size % 2);
  }

  if (!frame) return false;

  const frameDataStart = frame.offset + 8 + 16;
  const frameDataEnd = frame.offset + 8 + frame.size;
  let cursor = frameDataStart;
  let payload = null;
  let payloadFourcc = null;

  while (cursor + 8 <= frameDataEnd) {
    const fourcc = buffer.toString("ascii", cursor, cursor + 4);
    const size = buffer.readUInt32LE(cursor + 4);

    if (fourcc === "VP8 " || fourcc === "VP8L") {
      payloadFourcc = fourcc;
      payload = buffer.subarray(cursor + 8, cursor + 8 + size);
      break;
    }

    cursor += 8 + size + (size % 2);
  }

  if (!payload || !payloadFourcc) return false;

  const chunkSize = payload.length;
  const riffSize = 4 + 8 + chunkSize + (chunkSize % 2);
  const output = Buffer.alloc(8 + riffSize);

  output.write("RIFF", 0, "ascii");
  output.writeUInt32LE(riffSize, 4);
  output.write("WEBP", 8, "ascii");
  output.write(payloadFourcc, 12, "ascii");
  output.writeUInt32LE(chunkSize, 16);
  payload.copy(output, 20);

  fs.mkdirSync(path.dirname(posterPath), { recursive: true });
  fs.writeFileSync(posterPath, output);
  return true;
}

function extractWithFfmpeg(videoPath, posterPath) {
  if (!hasFfmpeg) return false;

  const result = spawnSync(
    "ffmpeg",
    ["-y", "-i", videoPath, "-frames:v", "1", "-q:v", "2", posterPath],
    { stdio: "ignore" }
  );

  return result.status === 0 && fs.existsSync(posterPath);
}

function ensurePoster(base, webpPath, videoPath) {
  const webpPoster = path.join(POSTER_ROOT, base + "-poster.webp");
  const jpgPoster = path.join(POSTER_ROOT, base + "-poster.jpg");

  if (fs.existsSync(webpPoster)) {
    posterStats.reused += 1;
    return toPublicPath(webpPoster);
  }

  if (fs.existsSync(jpgPoster)) {
    posterStats.reused += 1;
    return toPublicPath(jpgPoster);
  }

  if (webpPath && extractFirstFrameFromWebp(webpPath, webpPoster)) {
    posterStats.generated += 1;
    return toPublicPath(webpPoster);
  }

  if (extractWithFfmpeg(videoPath, jpgPoster)) {
    posterStats.generated += 1;
    return toPublicPath(jpgPoster);
  }

  if (webpPath) {
    posterStats.missing += 1;
    return toPublicPath(webpPath);
  }

  posterStats.missing += 1;
  return null;
}

function matchSlug(base, folder, slugs) {
  if (slugs.has(base)) return base;
  if (folder && slugs.has(folder)) return folder;

  const stripped = base
    .replace(
      /-(video|vid|clip|image|img|photo|pic|still|frame|animation|anim)(-\d+)?$/,
      ""
    )
    .replace(/-\d+$/, "");

  if (slugs.has(stripped)) return stripped;

  const parts = base.split("-");
  for (let index = 0; index < parts.length; index += 1) {
    if (slugs.has(parts[index])) return parts[index];
  }

  return null;
}

function groupFor(map, slug, names, descriptions, fallback) {
  if (!map.has(slug)) {
    map.set(slug, {
      slug,
      name: displayName(slug, names),
      description: descriptions[slug] || fallback,
      files: []
    });
  }

  return map.get(slug);
}

function formatRank(format) {
  const order = ["mp4", "webm", "mov", "webp", "jpg", "jpeg", "png", "gif", "svg"];
  const index = order.indexOf(format);
  return index === -1 ? order.length : index;
}

function sortFiles(files, videosFirst) {
  return files.slice().sort((a, b) => {
    const aVideo = a.type === "video" ? 0 : 1;
    const bVideo = b.type === "video" ? 0 : 1;
    const videoRank = videosFirst ? aVideo - bVideo : bVideo - aVideo;
    if (videoRank !== 0) return videoRank;

    const formatDifference = formatRank(a.format) - formatRank(b.format);
    if (formatDifference !== 0) return formatDifference;

    return a.src.localeCompare(b.src);
  });
}

function sortGroups(map, order) {
  return Array.from(map.values())
    .sort((a, b) => {
      const aIndex = order.indexOf(a.slug);
      const bIndex = order.indexOf(b.slug);

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.name.localeCompare(b.name);
    })
    .map((group) => {
      group.files = sortFiles(group.files, group.kind === "nail-type");
      return group;
    });
}

function keepOneVideoPerNailType(nailTypes) {
  return nailTypes.map((group) => {
    const candidates = group.files
      .filter((file) => file.type === "video")
      .sort((a, b) => {
        const aNameMatch = a.base === group.slug ? 0 : 1;
        const bNameMatch = b.base === group.slug ? 0 : 1;
        if (aNameMatch !== bNameMatch) return aNameMatch - bNameMatch;

        const nameDifference = a.base.localeCompare(b.base);
        if (nameDifference !== 0) return nameDifference;

        const formatDifference = formatRank(a.format) - formatRank(b.format);
        if (formatDifference !== 0) return formatDifference;

        return a.src.localeCompare(b.src);
      });
    const selectedPath = candidates.length
      ? mediaPathKey(candidates[0].src)
      : "";
    let selectedAdded = false;

    group.files = group.files.filter((file) => {
      if (file.type !== "video") return true;
      if (selectedAdded || mediaPathKey(file.src) !== selectedPath) return false;
      selectedAdded = true;
      return true;
    });

    return group;
  });
}

function mimeForVideo(extension) {
  if (extension === ".webm") return "video/webm";
  if (extension === ".mov") return "video/quicktime";
  return "video/mp4";
}

function serializeShapes(shapes, videoData, unplaced) {
  return [
    "/* Auto-generated by scripts/generate-media-data.js.",
    "   Add media to videos/ or images/shapes and run `npm run media:data` to refresh. */",
    "",
    "window.SHAPE_DATA = " + JSON.stringify(shapes, null, 2) + ";",
    "",
    "window.SHAPE_UNPLACED = " + JSON.stringify(unplaced, null, 2) + ";",
    ""
  ].join("\n");
}

function serializeNailTypes(nailTypes, unplaced) {
  return [
    "/* Auto-generated by scripts/generate-media-data.js.",
    "   Add media to videos/ and run `npm run media:data` to refresh. */",
    "",
    "window.NAIL_TYPE_DATA = " + JSON.stringify(nailTypes, null, 2) + ";",
    "",
    "window.NAIL_TYPE_UNPLACED = " + JSON.stringify(unplaced, null, 2) + ";",
    ""
  ].join("\n");
}

function printSummary(result) {
  console.log("Scanned " + result.scanned + " media file(s) in videos/");
  console.log("Copied " + result.copied.length + " new file(s) to assets/media/");
  console.log(
    "Posters: " +
      posterStats.generated +
      " generated, " +
      posterStats.reused +
      " reused, " +
      posterStats.missing +
      " missing"
  );
  console.log("ffmpeg available: " + (hasFfmpeg ? "yes" : "no"));

  console.log("");
  console.log("Nail Types");
  result.nailTypes.forEach((group) => {
    console.log(
      "  " + group.name + " (" + group.slug + "): " + group.files.length + " file(s)"
    );
    group.files.forEach((file) => {
      console.log("    - " + file.src + " [" + file.type + "]");
    });
  });

  console.log("");
  console.log("Shapes");
  result.shapes.forEach((group) => {
    console.log(
      "  " + group.name + " (" + group.slug + "): " + group.files.length + " file(s)"
    );
    group.files.forEach((file) => {
      console.log("    - " + file.src + " [" + file.type + "]");
    });
  });

  console.log("");
  console.log("Shape video library: " + result.videoData.length + " group(s)");
  result.videoData.forEach((film) => {
    console.log(
      "  " + film.name + " (" + film.group + "): " + film.sources.length + " source(s)"
    );
  });

  console.log("");
  if (result.unplaced.length) {
    console.log("Unplaced files");
    result.unplaced.forEach((entry) => {
      console.log("  - " + entry.path + " (" + entry.reason + ")");
    });
  } else {
    console.log("Unplaced files: none");
  }

  console.log("");
  console.log("Wrote " + SHAPES_OUTPUT);
  console.log("Wrote " + NAIL_TYPES_OUTPUT);
}

function build() {
  fs.mkdirSync(MEDIA_ROOT, { recursive: true });
  fs.mkdirSync(POSTER_ROOT, { recursive: true });

  const shapes = new Map();
  const nailTypes = new Map();
  const unplaced = [];
  const copied = [];
  const mediaEntries = [];

  const videoFiles = walk(VIDEO_ROOT);

  videoFiles.forEach((fullPath) => {
    const extension = path.extname(fullPath).toLowerCase();
    const relative = path.relative(VIDEO_ROOT, fullPath).split(path.sep).join("/");
    const sourcePath = "videos/" + relative;

    if (!isMediaExtension(extension)) {
      unplaced.push({
        path: sourcePath,
        reason: extension
          ? "Unsupported media extension " + extension
          : "Not an image or video file"
      });
      return;
    }

    const base = slugify(path.basename(fullPath, extension));
    const folderParts = path
      .dirname(relative)
      .split("/")
      .filter((part) => part && part !== ".");
    const folder = folderParts.length ? slugify(folderParts[0]) : "";
    const destination = path.join(MEDIA_ROOT, path.basename(fullPath));

    if (copyFileIfNeeded(fullPath, destination)) {
      copied.push(toPublicPath(destination));
    }

    mediaEntries.push({
      source: sourcePath,
      destination,
      publicPath: toPublicPath(destination),
      base,
      folder,
      extension,
      isVideo: VIDEO_EXTENSIONS.has(extension),
      isImage: IMAGE_EXTENSIONS.has(extension)
    });
  });

  const webpByBase = new Map();
  mediaEntries.forEach((entry) => {
    if (entry.extension === ".webp") webpByBase.set(entry.base, entry);
  });

  const videoBases = new Set(
    mediaEntries.filter((entry) => entry.isVideo).map((entry) => entry.base)
  );

  mediaEntries.forEach((entry) => {
    if (!entry.isVideo) return;

    const webp = webpByBase.get(entry.base);
    entry.poster = ensurePoster(
      entry.base,
      webp ? webp.destination : null,
      entry.destination
    );
  });

  mediaEntries.forEach((entry) => {
    const shapeSlug = matchSlug(entry.base, entry.folder, SHAPE_SLUGS);
    const nailTypeSlug = matchSlug(entry.base, entry.folder, NAIL_TYPE_SLUGS);

    entry.shapeSlug = shapeSlug;
    entry.nailTypeSlug = nailTypeSlug;

    const media = {
      type: entry.isVideo ? "video" : "image",
      src: entry.nailTypeSlug
        ? toMediaPublicPath(entry.destination)
        : entry.publicPath,
      base: entry.base,
      format: entry.extension.slice(1)
    };

    if (entry.poster) {
      media.poster = entry.nailTypeSlug
        ? toMediaPublicPath(path.resolve(ROOT, entry.poster))
        : entry.poster;
    }

    if (shapeSlug) {
      const group = groupFor(
        shapes,
        shapeSlug,
        SHAPE_NAMES,
        SHAPE_DESCRIPTIONS,
        FALLBACK_SHAPE_DESCRIPTION
      );
      group.kind = "shape";
      group.files.push(media);
      return;
    }

    if (nailTypeSlug) {
      if (!entry.isVideo && videoBases.has(entry.base)) return;

      const group = groupFor(
        nailTypes,
        nailTypeSlug,
        NAIL_TYPE_NAMES,
        NAIL_TYPE_DESCRIPTIONS,
        FALLBACK_NAIL_TYPE_DESCRIPTION
      );
      group.kind = "nail-type";
      group.files.push(media);
      return;
    }

    unplaced.push({
      path: entry.source,
      reason: "Filename or folder does not match a shape or nail type"
    });
  });

  walk(SHAPE_ROOT).forEach((fullPath) => {
    const extension = path.extname(fullPath).toLowerCase();
    const relative = path.relative(SHAPE_ROOT, fullPath).split(path.sep).join("/");

    if (!isMediaExtension(extension)) {
      unplaced.push({
        path: "images/shapes/" + relative,
        reason: "Unsupported media extension"
      });
      return;
    }

    const base = slugify(path.basename(fullPath, extension));
    const folderParts = path
      .dirname(relative)
      .split("/")
      .filter((part) => part && part !== ".");
    const folder = folderParts.length ? slugify(folderParts[0]) : "";
    const shapeSlug =
      matchSlug(base, folder, SHAPE_SLUGS) ||
      slugify(path.basename(path.dirname(fullPath)));

    if (!shapeSlug) {
      unplaced.push({
        path: toPublicPath(fullPath),
        reason: "Filename or folder does not match a shape"
      });
      return;
    }

    const group = groupFor(
      shapes,
      shapeSlug,
      SHAPE_NAMES,
      SHAPE_DESCRIPTIONS,
      FALLBACK_SHAPE_DESCRIPTION
    );
    group.kind = "shape";

    const media = {
      type: VIDEO_EXTENSIONS.has(extension) ? "video" : "image",
      src: toPublicPath(fullPath),
      base,
      format: extension.slice(1)
    };

    if (VIDEO_EXTENSIONS.has(extension)) {
      media.poster = ensurePoster(base, null, fullPath) || undefined;
      if (!media.poster) delete media.poster;
    }

    group.files.push(media);
  });

  const orderedShapes = sortGroups(shapes, SHAPE_ORDER);
  const orderedNailTypes = keepOneVideoPerNailType(
    sortGroups(nailTypes, NAIL_TYPE_ORDER)
  );

  const videoGroups = new Map();

  mediaEntries.forEach((entry) => {
    if (!entry.isVideo) return;
    if (!entry.shapeSlug && !entry.nailTypeSlug) return;

    if (!videoGroups.has(entry.base)) {
      const groupSlug = entry.shapeSlug || entry.nailTypeSlug;
      const groupName = entry.shapeSlug
        ? displayName(entry.shapeSlug, SHAPE_NAMES)
        : displayName(entry.nailTypeSlug, NAIL_TYPE_NAMES);

      videoGroups.set(entry.base, {
        slug: entry.base,
        name: groupName,
        group: entry.shapeSlug ? "shape" : "nail-type",
        groupSlug,
        groupName,
        poster: entry.poster || null,
        sources: []
      });
    }

    const film = videoGroups.get(entry.base);
    film.sources.push({
      src: entry.publicPath,
      type: mimeForVideo(entry.extension)
    });

    if (entry.poster) film.poster = entry.poster;
  });

  const videoData = Array.from(videoGroups.values()).sort((a, b) => {
    const aRank =
      a.group === "shape"
        ? SHAPE_ORDER.indexOf(a.groupSlug)
        : 100 + NAIL_TYPE_ORDER.indexOf(a.groupSlug);
    const bRank =
      b.group === "shape"
        ? SHAPE_ORDER.indexOf(b.groupSlug)
        : 100 + NAIL_TYPE_ORDER.indexOf(b.groupSlug);

    if (aRank !== bRank) return aRank - bRank;
    return a.name.localeCompare(b.name);
  });

  const unplacedPaths = unplaced.map((entry) => entry.path);

  fs.writeFileSync(
    SHAPES_OUTPUT,
    serializeShapes(orderedShapes, videoData, unplacedPaths),
    "utf8"
  );
  fs.writeFileSync(
    NAIL_TYPES_OUTPUT,
    serializeNailTypes(orderedNailTypes, unplacedPaths),
    "utf8"
  );

  return {
    scanned: mediaEntries.length,
    copied,
    shapes: orderedShapes,
    nailTypes: orderedNailTypes,
    videoData,
    unplaced
  };
}

const result = build();
printSummary(result);
