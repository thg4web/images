/* Henderson Astrophotography — images.thgnetworks.com
   Client-rendered from site/feed/*.json. No build step.
   Managed by the whimages tool; this file just renders the feed. */
(function () {
  "use strict";

  var FEED = {};            // images, targets, sessions, facets
  var byId = {};            // image id -> image
  var STATE = { list: null };

  var V = {};
  ["home", "gallery", "events", "image", "target", "session", "about"].forEach(function (k) {
    V[k] = document.getElementById("view-" + k);
  });
  var sheet = document.getElementById("sheet");
  var sheetBody = document.getElementById("sheetBody");
  var loadingEl = document.getElementById("loading");

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
    });
  }
  function published() { return FEED.images.filter(function (i) { return i.revision !== "frame"; }); }
  function galleryList() { return published().filter(function (i) { return !i.supersedes || true; }); }

  /* ---- media ---------------------------------------------------------- */
  function img(src, alt, cls) {
    var e = document.createElement("img");
    e.src = src; e.alt = alt || ""; e.loading = "lazy";
    if (cls) e.className = cls;
    return e;
  }
  function rightsLine(im) {
    var y = String(im.captured).slice(0, 4);
    return "&copy; " + y + " Aaron Henderson &middot; free for non-commercial use with credit &middot; " +
      '<a href="#/about">commercial use / permissions</a> &middot; CC BY-NC 4.0';
  }
  function acqDL(a) {
    var rows = [
      ["Scope", a.scope],
      ["Sensor", a.sensor + (a.sensor_temp_c != null ? " · " + a.sensor_temp_c + " °C" : "")],
      ["Exposure", a.exposure ? (a.exposure + (a.integration ? "  (" + a.integration + " total)" : "")) : (a.integration ? a.integration + " total" : "")],
      ["Filter", a.filter],
      ["Sky", a.location + (a.moon ? " · Moon " + a.moon : "")],
      ["Processing", (a.processing || []).join(" · ")]
    ];
    var out = "<dl>";
    rows.forEach(function (r) { if (r[1]) out += "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; });
    return out + "</dl>";
  }

  /* ---- info sheet --------------------------------------------------- */
  function openSheet(id) {
    var im = byId[id]; if (!im) return;
    var c = im.classification;
    sheetBody.innerHTML =
      '<form method="dialog" class="sheet-close-row"><button class="sheet-close" type="submit" aria-label="Close">&#10005;</button></form>' +
      '<h2 id="sheetTitle">' + esc(im.title) + "</h2>" +
      '<p class="sheet-sub">' + esc((c.catalogs || []).join(" · ") || (FEED.targets.find(function (t) { return t.id === im.target; }) || {}).name) +
      (c.constellation ? " · " + esc(c.constellation) : "") + "</p>" +
      '<p class="sheet-prose">' + (im.body_html || "") + "</p>" +
      '<div class="acq"><h3>Acquisition</h3>' + acqDL(im.acquisition) + "</div>" +
      '<p class="sheet-foot">' + rightsLine(im) + ' &nbsp;·&nbsp; <a href="#/image/' + im.id + '">full page &rarr;</a></p>';
    if (typeof sheet.showModal === "function") sheet.showModal(); else sheet.setAttribute("open", "");
  }
  sheet.addEventListener("click", function (e) {
    var b = sheetBody.getBoundingClientRect();
    if (e.clientX < b.left || e.clientX > b.right || e.clientY < b.top || e.clientY > b.bottom) sheet.close();
  });

  /* ---- tiles ------------------------------------------------------- */
  function tile(im) {
    var c = im.classification;
    var badge = c.is_event ? c.event_type : "";
    var d = document.createElement("div");
    d.className = "tile";
    d.innerHTML =
      '<div class="tile-imgwrap"></div>' +
      (badge ? '<span class="tile-badge">' + esc(badge) + "</span>" : "") +
      '<button class="tile-info" type="button" aria-haspopup="dialog" aria-label="Info for ' + esc(im.title) + '"><span class="glyph" aria-hidden="true">i</span> Info</button>' +
      '<a class="tile-link" href="#/image/' + im.id + '" aria-label="' + esc(im.title) + '"></a>' +
      '<div class="tile-body"><p class="tile-name">' + esc(im.title) + "</p>" +
      '<p class="tile-meta">' + String(im.captured).slice(0, 4) + " · " + esc(im.acquisition.scope) + "</p></div>";
    d.querySelector(".tile-imgwrap").appendChild(img(im.media.thumb, im.title));
    d.querySelector(".tile-info").addEventListener("click", function () { openSheet(im.id); });
    return d;
  }

  /* ---- views ---------------------------------------------------- */
  function show(name) {
    Object.keys(V).forEach(function (k) { V[k].hidden = k !== name; });
    var map = { home: "home", gallery: "gallery", events: "events", image: "gallery", target: "gallery", session: "events", about: "about" };
    document.querySelectorAll(".site-nav a").forEach(function (a) {
      if (a.getAttribute("data-nav") === map[name]) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    window.scrollTo(0, 0);
  }

  function renderHome() {
    var pool = published().filter(function (i) { return !i.classification.is_event; });
    if (!pool.length) pool = published();
    var im = pool[Math.floor(Math.random() * pool.length)];
    var today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    V.home.innerHTML =
      '<h1 class="hpod-eyebrow">Henderson&rsquo;s Picture of the Day <span>&bull;</span> ' + today + "</h1>" +
      '<figure class="hpod-frame">' +
        '<a class="media-link" href="' + im.media.full + '" target="_blank" rel="noopener noreferrer" aria-label="Open the full-resolution image">' +
          '<span class="media-slot"></span>' +
          '<span class="media-zoom" aria-hidden="true"><span class="glyph">&#10530;</span> Full resolution</span></a>' +
        '<button class="media-info" type="button" aria-haspopup="dialog"><span class="glyph" aria-hidden="true">i</span> Info</button>' +
        '<figcaption class="media-watermark" aria-hidden="true">By A. Henderson</figcaption>' +
      "</figure>" +
      '<div class="hpod-caption"><p class="hpod-title">' + esc(im.title) + "</p>" +
        '<p class="hpod-meta">Captured ' + esc(im.captured) + " · " + esc(im.acquisition.scope) +
        (im.acquisition.integration ? " · " + esc(im.acquisition.integration) : "") + "</p></div>" +
      '<p class="lede">One image from the archive, chosen each day. Everything I&rsquo;ve shot &mdash; with the full acquisition data behind every frame &mdash; lives in the gallery.</p>' +
      '<a class="cta" href="#/gallery">View the gallery <span aria-hidden="true">&rarr;</span></a>';
    V.home.querySelector(".media-slot").replaceWith(img(im.media.web, im.title));
    V.home.querySelector(".media-info").addEventListener("click", function () { openSheet(im.id); });
  }

  var FILTERS = { type: [], event: [], filter: [], bucket: [], q: "", sort: "new" };
  var FACETS = [
    { key: "type", label: "Object type", get: function (im) { return im.classification.object_type; },
      optsFrom: "object_type" },
    { key: "event", label: "Special event", get: function (im) { return im.classification.event_type; },
      optsFrom: "event_type" },
    { key: "filter", label: "Filter", get: function (im) { return im.acquisition.filter; }, optsFrom: "filter" },
    { key: "bucket", label: "Integration", get: function (im) { return im.acquisition.integration_bucket; },
      opts: [["under1h", "Under 1 h"], ["1-3h", "1–3 h"], ["3h+", "3 h+"]] }
  ];
  function facetOpts(f) {
    if (f.opts) return f.opts;
    var counts = FEED.facets[f.optsFrom] || {};
    return Object.keys(counts).sort().map(function (k) {
      return [k, k.charAt(0).toUpperCase() + k.slice(1)];
    });
  }
  function galMatch(im) {
    var f;
    for (var i = 0; i < FACETS.length; i++) {
      f = FACETS[i];
      var arr = FILTERS[f.key];
      if (arr.length && arr.indexOf(f.get(im)) < 0) return false;
    }
    if (FILTERS.q) {
      var c = im.classification;
      var hay = (im.title + " " + (c.catalogs || []).join(" ") + " " + (c.constellation || "") + " " + (c.tags || []).join(" ")).toLowerCase();
      if (hay.indexOf(FILTERS.q.toLowerCase()) < 0) return false;
    }
    return true;
  }
  function galSorted(list) {
    var a = list.slice();
    if (FILTERS.sort === "old") a.sort(function (x, y) { return x.captured < y.captured ? -1 : 1; });
    else if (FILTERS.sort === "az") a.sort(function (x, y) { return x.title.localeCompare(y.title); });
    else if (FILTERS.sort === "int") {
      var o = { "under1h": 0, "1-3h": 1, "3h+": 2 };
      a.sort(function (x, y) { return o[y.acquisition.integration_bucket] - o[x.acquisition.integration_bucket]; });
    } else a.sort(function (x, y) { return x.captured < y.captured ? 1 : -1; });
    return a;
  }
  function renderGallery() {
    var base = galleryList();
    var rail = "";
    FACETS.forEach(function (f) {
      rail += '<div class="facet"><h3>' + f.label + '</h3><div class="facet-opts">';
      facetOpts(f).forEach(function (o) {
        var on = FILTERS[f.key].indexOf(o[0]) >= 0;
        rail += '<button class="pill" type="button" data-facet="' + f.key + '" data-val="' + esc(o[0]) + '" aria-pressed="' + on + '">' + esc(o[1]) + "</button>";
      });
      rail += "</div></div>";
    });
    V.gallery.innerHTML =
      '<p class="crumb">Gallery</p>' +
      '<div class="gal"><div class="gal-filters">' + rail + '</div><div class="gal-main">' +
        '<div class="gal-controls">' +
          '<input class="gal-search" type="search" placeholder="Search objects, catalogues, tags…" aria-label="Search the gallery" value="' + esc(FILTERS.q) + '">' +
          '<select class="gal-sort" aria-label="Sort">' +
            '<option value="new">Newest first</option><option value="old">Oldest first</option>' +
            '<option value="int">Most integration</option><option value="az">A – Z</option></select>' +
          '<span class="gal-count"></span>' +
        '</div><div class="grid"></div></div></div>';
    V.gallery.querySelector(".gal-sort").value = FILTERS.sort;
    paintGrid(base);
    V.gallery.querySelectorAll(".pill").forEach(function (p) {
      p.addEventListener("click", function () {
        var arr = FILTERS[p.dataset.facet], v = p.dataset.val, i = arr.indexOf(v);
        if (i >= 0) arr.splice(i, 1); else arr.push(v);
        renderGallery();
      });
    });
    var s = V.gallery.querySelector(".gal-search");
    s.addEventListener("input", function () { FILTERS.q = s.value; paintGrid(base); });
    V.gallery.querySelector(".gal-sort").addEventListener("change", function (e) { FILTERS.sort = e.target.value; paintGrid(base); });
  }
  function paintGrid(base) {
    var res = galSorted(base.filter(galMatch));
    var g = V.gallery.querySelector(".grid");
    g.innerHTML = "";
    if (!res.length) g.innerHTML = '<p class="empty">No images match those filters.</p>';
    res.forEach(function (im) { g.appendChild(tile(im)); });
    V.gallery.querySelector(".gal-count").textContent = res.length + " of " + base.length + " images";
    STATE.list = res.map(function (i) { return i.id; });
  }

  function renderEvents() {
    var cards = FEED.sessions.map(function (s) {
      var first = byId[s.frames[0]];
      return '<div class="tile" data-hero="' + (first ? first.media.thumb : "") + '">' +
        '<div class="tile-imgwrap"></div>' +
        '<span class="tile-badge">' + esc(s.event_type) + "</span>" +
        '<a class="tile-link" href="#/session/' + s.id + '" aria-label="' + esc(s.title) + '"></a>' +
        '<div class="tile-body"><p class="tile-name">' + esc(s.title) + "</p>" +
        '<p class="tile-meta">' + esc(s.date) + " · " + s.frames.length + " frame" + (s.frames.length === 1 ? "" : "s") + "</p></div></div>";
    });
    var loose = published().filter(function (i) { return i.classification.is_event && !i.session; });
    loose.forEach(function (im) {
      cards.push('<div class="tile" data-hero="' + im.media.thumb + '">' +
        '<div class="tile-imgwrap"></div>' +
        '<span class="tile-badge">' + esc(im.classification.event_type) + "</span>" +
        '<a class="tile-link" href="#/image/' + im.id + '" aria-label="' + esc(im.title) + '"></a>' +
        '<div class="tile-body"><p class="tile-name">' + esc(im.title) + "</p>" +
        '<p class="tile-meta">' + String(im.captured).slice(0, 4) + "</p></div></div>");
    });
    V.events.innerHTML = '<p class="crumb">Events</p>' +
      '<p class="events-intro">Nights built around something happening — an eclipse, a comet, a close pass. Each keeps its own page with the frames from that session.</p>' +
      '<div class="grid">' + cards.join("") + "</div>";
    V.events.querySelectorAll(".tile").forEach(function (t) {
      if (t.dataset.hero) t.querySelector(".tile-imgwrap").appendChild(img(t.dataset.hero, ""));
    });
  }

  function renderImage(id) {
    var im = byId[id];
    if (!im) { location.hash = "#/gallery"; return; }
    var list = (STATE.list && STATE.list.indexOf(id) >= 0) ? STATE.list : galleryList().sort(function (a, b) { return a.captured < b.captured ? 1 : -1; }).map(function (i) { return i.id; });
    var idx = list.indexOf(id);
    var prev = idx > 0 ? list[idx - 1] : null;
    var next = (idx >= 0 && idx < list.length - 1) ? list[idx + 1] : null;
    var versions = FEED.images.filter(function (i) { return i.target === im.target && i.revision !== "frame"; })
      .sort(function (a, b) { return a.captured < b.captured ? 1 : -1; });
    var strip = "";
    if (versions.length > 1) {
      strip = '<div class="progression"><h3>Versions</h3><div class="prog-row">' +
        versions.map(function (v) {
          return '<a class="prog-item' + (v.id === im.id ? " is-current" : "") + '" href="#/image/' + v.id + '">' +
            '<div class="prog-thumb"></div><p class="prog-cap">' + esc(v.revision) + " · " + String(v.captured).slice(5) + "</p></a>";
        }).join("") + "</div></div>";
    }
    var sess = im.session ? FEED.sessions.filter(function (s) { return s.id === im.session; })[0] : null;
    var c = im.classification;
    V.image.innerHTML =
      '<p class="crumb"><a href="#/gallery">Gallery</a> / ' + esc(im.title) + "</p>" +
      '<div class="img-hero">' +
        '<a class="media-link" href="' + im.media.full + '" target="_blank" rel="noopener noreferrer" aria-label="Open the full-resolution image">' +
          '<span class="media-slot"></span>' +
          '<span class="media-zoom" aria-hidden="true"><span class="glyph">&#10530;</span> Full resolution</span></a>' +
        '<figcaption class="media-watermark" aria-hidden="true">By A. Henderson</figcaption>' +
      "</div>" +
      '<div class="pn-bar">' +
        '<a href="' + (prev ? "#/image/" + prev : "#") + '"' + (prev ? "" : ' aria-disabled="true"') + ">&larr; Previous</a>" +
        "<span>" + (idx >= 0 ? (idx + 1) + " / " + list.length : "") + "</span>" +
        '<a href="' + (next ? "#/image/" + next : "#") + '"' + (next ? "" : ' aria-disabled="true"') + ">Next &rarr;</a>" +
      "</div>" +
      '<h1 class="detail-title">' + esc(im.title) + "</h1>" +
      '<p class="detail-sub">' + esc((c.catalogs || []).join(" · ")) + (c.constellation ? " · " + esc(c.constellation) : "") + " · captured " + esc(im.captured) + "</p>" +
      '<div class="detail-prose">' + (im.body_html || "") + "</div>" +
      '<div class="acq"><h3>Acquisition</h3>' + acqDL(im.acquisition) + "</div>" +
      strip +
      '<p class="detail-links"><a href="#/target/' + im.target + '">&rarr; ' + esc((FEED.targets.filter(function (t) { return t.id === im.target; })[0] || { name: im.target }).name) + " page</a>" +
        (sess ? ' <a href="#/session/' + im.session + '">&rarr; this session</a>' : "") +
        ' <a href="' + im.media.full + '" target="_blank" rel="noopener noreferrer">&darr; full-resolution image</a></p>' +
      '<p class="rights-line">' + rightsLine(im) + "</p>";
    V.image.querySelector(".media-slot").replaceWith(img(im.media.web, im.title));
    if (strip) V.image.querySelectorAll(".prog-thumb").forEach(function (t, i) { t.appendChild(img(versions[i].media.thumb, versions[i].title)); });
  }

  function renderTarget(tid) {
    var t = FEED.targets.filter(function (x) { return x.id === tid; })[0];
    if (!t) { location.hash = "#/gallery"; return; }
    var imgs = FEED.images.filter(function (i) { return i.target === tid && i.revision !== "frame"; })
      .sort(function (a, b) { return a.captured < b.captured ? 1 : -1; });
    var best = byId[t.current_best] || imgs[0];
    var strip = "";
    if (imgs.length > 1) {
      strip = '<div class="progression"><h3>Progression</h3><div class="prog-row">' +
        imgs.map(function (v) {
          return '<a class="prog-item' + (v.id === best.id ? " is-current" : "") + '" href="#/image/' + v.id + '">' +
            '<div class="prog-thumb"></div><p class="prog-cap">' + esc(v.revision) + " · " + String(v.captured).slice(5) + "</p></a>";
        }).join("") + '</div><p class="prog-total">' + imgs.length + " images of this target</p></div>";
    }
    V.target.innerHTML =
      '<p class="crumb"><a href="#/gallery">Gallery</a> / ' + esc(t.name) + "</p>" +
      '<div class="identity"><h1 class="detail-title" style="margin-top:0">' + esc(t.name) + "</h1>" +
        '<p class="kind">' + esc(t.kind) + ((t.catalogs || []).length ? " · " + esc(t.catalogs.join(" · ")) : "") + "</p>" +
        '<p class="detail-prose" style="margin-top:0.9rem">' + esc(t.description) + "</p></div>" +
      '<div class="img-hero">' +
        '<a class="media-link" href="#/image/' + best.id + '" aria-label="Open the current best image page"><span class="media-slot"></span></a>' +
        '<figcaption class="media-watermark" aria-hidden="true">By A. Henderson</figcaption></div>' +
      '<p class="detail-links"><a href="#/image/' + best.id + '">&rarr; ' + esc(best.revision) + ", captured " + esc(best.captured) + "</a></p>" +
      strip;
    V.target.querySelector(".media-slot").replaceWith(img(best.media.web, best.title));
    if (strip) V.target.querySelectorAll(".prog-thumb").forEach(function (el, i) { el.appendChild(img(imgs[i].media.thumb, imgs[i].title)); });
  }

  function renderSession(id) {
    var s = FEED.sessions.filter(function (x) { return x.id === id; })[0];
    if (!s) { location.hash = "#/events"; return; }
    var frames = s.frames.map(function (fid) { return byId[fid]; }).filter(Boolean);
    var hero = frames[0];
    V.session.innerHTML =
      '<p class="crumb"><a href="#/events">Events</a> / ' + esc(s.title) + "</p>" +
      '<h1 class="detail-title" style="margin-top:0">' + esc(s.title) + "</h1>" +
      '<p class="detail-sub">' + esc(s.date) + " · " + esc(s.location) + " · " + esc(s.conditions) + "</p>" +
      '<div class="img-hero">' +
        '<a class="media-link" href="' + (hero ? hero.media.full : "#") + '" target="_blank" rel="noopener noreferrer" aria-label="Open the full-resolution image"><span class="media-slot"></span></a>' +
        '<figcaption class="media-watermark" aria-hidden="true">By A. Henderson</figcaption></div>' +
      '<div class="detail-prose" style="margin-top:1.2rem">' + (s.body_html || "") + "</div>" +
      '<p class="frames-h">Frames from this session</p><div class="grid"></div>' +
      '<div class="acq"><h3>Acquisition &middot; session</h3><dl>' +
        "<dt>Scope</dt><dd>" + esc(s.scope) + "</dd><dt>Event</dt><dd>" + esc(s.event_type) + "</dd>" +
        "<dt>Sky</dt><dd>" + esc(s.location) + " · " + esc(s.conditions) + "</dd><dt>Moon</dt><dd>" + esc(s.moon) + "</dd></dl></div>";
    if (hero) V.session.querySelector(".media-slot").replaceWith(img(hero.media.web, hero.title));
    var g = V.session.querySelector(".grid");
    frames.forEach(function (f) { g.appendChild(tile(f)); });
  }

  function renderAbout() {
    V.about.innerHTML =
      '<p class="crumb">About</p>' +
      '<h1 class="detail-title" style="margin-top:0">About</h1>' +
      "<p>I&rsquo;m Aaron Henderson. I shoot the night sky from a backyard in the Raleigh area of North Carolina, mostly with a ZWO Seestar&nbsp;S50 and an S30&nbsp;Pro. This gallery is the finished work, each frame with the acquisition data behind it, and one picked out each day.</p>" +
      '<h2 id="rights">Using these images</h2>' +
      '<div class="rights-block">' +
        '<p style="margin-top:0"><strong>Non-commercial use</strong> &mdash; personal, educational, non-profit, or editorial &mdash; is welcome at no charge. Please credit the image to Aaron Henderson.</p>' +
        "<p><strong>Commercial use</strong> needs permission in advance. Email <strong>image-permission@thgnetworks.com</strong> and I&rsquo;ll almost certainly say yes.</p>" +
        "<p>Either way, please attribute the work as <em>Aaron Henderson &mdash; images.thgnetworks.com</em>. These terms correspond to the Creative Commons Attribution&ndash;NonCommercial 4.0 International licence (CC BY-NC 4.0).</p>" +
        "<p style=\"margin-bottom:0\">&copy; 2026 Aaron Henderson. Each image is my own work, from my own equipment and data.</p>" +
      "</div>" +
      "<h2>Tools &amp; data</h2>" +
      '<div class="tools"><div>Seestar S50 / S30 Pro — capture and on-mount stacking</div>' +
        "<div>Siril — stacking and processing</div><div>GIMP — finishing</div>" +
        "<div>StarNet2 — star separation</div><div>Stellarium, SIMBAD — object identification and framing</div></div>" +
      "<h2>Corrections &amp; removal</h2>" +
      "<p>Spotted a misidentified object, a wrong date, or something that shouldn&rsquo;t be here? Email <strong>image-permission@thgnetworks.com</strong> and I&rsquo;ll fix or remove it promptly.</p>";
  }

  /* ---- router ---------------------------------------------------- */
  function route() {
    var p = (location.hash || "#/").replace(/^#/, "").split("/").filter(Boolean);
    if (!p.length) { renderHome(); show("home"); return; }
    if (p[0] === "gallery") { renderGallery(); show("gallery"); return; }
    if (p[0] === "events") { renderEvents(); show("events"); return; }
    if (p[0] === "about") { renderAbout(); show("about"); return; }
    if (p[0] === "image" && p[1]) { renderImage(decodeURIComponent(p[1])); show("image"); return; }
    if (p[0] === "target" && p[1]) { renderTarget(decodeURIComponent(p[1])); show("target"); return; }
    if (p[0] === "session" && p[1]) { renderSession(decodeURIComponent(p[1])); show("session"); return; }
    renderHome(); show("home");
  }
  window.addEventListener("hashchange", route);

  /* ---- theme + starfield -------------------------------------- */
  (function () {
    var root = document.documentElement, KEY = "images-theme", btn = document.getElementById("themeToggle");
    function cur() { return root.getAttribute("data-theme") || "dark"; }  // head script stamps this; dark by default
    function apply(m, persist) { root.setAttribute("data-theme", m); btn.setAttribute("aria-pressed", m === "dark"); if (persist) { try { localStorage.setItem(KEY, m); } catch (e) { } } }
    btn.setAttribute("aria-pressed", cur() === "dark");
    btn.addEventListener("click", function () { apply(cur() === "dark" ? "light" : "dark", true); });
  })();
  (function () {
    var canvas = document.getElementById("sky"); if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d"), root = document.documentElement, toggle = document.getElementById("themeToggle");
    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dpr = Math.min(devicePixelRatio || 1, 2), w = 0, h = 0, stars = [];
    function isLight() { var t = root.getAttribute("data-theme"); if (t) return t === "light"; return !matchMedia("(prefers-color-scheme: dark)").matches; }
    function build() {
      stars.length = 0;
      var n = Math.max(120, Math.min(Math.round(w * h / 6400), 300));
      for (var i = 0; i < n; i++) stars.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.2 + 0.25, a: Math.random() * 0.5 + 0.28, sp: Math.random() * 3200 + 2400, off: Math.random() * 7, tint: Math.random() < 0.18 });
    }
    function resize() {
      w = canvas.clientWidth || innerWidth; h = canvas.clientHeight || innerHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build(); draw(0);
    }
    function draw(t) {
      var light = isLight(); ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var pulse = reduce ? 0.78 : (0.5 + 0.5 * Math.sin(t / s.sp + s.off));
        var al = (s.a * (0.42 + 0.58 * pulse)).toFixed(3);
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7);
        ctx.fillStyle = light ? (s.tint ? "rgba(30,64,110," + al + ")" : "rgba(22,28,42," + al + ")")
                              : (s.tint ? "rgba(150,190,235," + al + ")" : "rgba(255,255,255," + al + ")");
        ctx.fill();
      }
    }
    function loop(t) { draw(t); requestAnimationFrame(loop); }
    var rt; addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
    if (toggle) toggle.addEventListener("click", function () { requestAnimationFrame(function () { draw(performance.now()); }); });
    resize(); if (!reduce) requestAnimationFrame(loop);
  })();

  /* ---- boot -------------------------------------------------- */
  document.getElementById("yr").textContent = String(new Date().getFullYear());
  Promise.all(["images", "targets", "sessions", "facets"].map(function (n) {
    return fetch("site/feed/" + n + ".json", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(n + " " + r.status);
      return r.json();
    });
  })).then(function (res) {
    FEED.images = res[0]; FEED.targets = res[1]; FEED.sessions = res[2]; FEED.facets = res[3];
    FEED.images.forEach(function (i) { byId[i.id] = i; });
    if (loadingEl) loadingEl.remove();
    route();
  }).catch(function (e) {
    if (loadingEl) loadingEl.textContent = "Couldn’t load the gallery feed. " + e.message;
  });
})();
