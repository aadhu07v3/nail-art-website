/* ==========================================================================
   AURA ATELIER — interactions
   Mobile navigation, sticky-header state, scroll reveals, nav highlighting
   and the front-end contact form validation.
   ========================================================================== */

(function () {
  "use strict";

  var header = document.getElementById("site-header");
  var hamburger = document.getElementById("hamburger");
  var mobileNav = document.getElementById("mobile-nav");

  /* ------------------------------------------------------------------------
     Sticky header shadow on scroll
     ------------------------------------------------------------------------ */
  function updateHeader() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  /* ------------------------------------------------------------------------
     Mobile navigation drawer
     ------------------------------------------------------------------------ */
  function setNav(open) {
    if (!hamburger || !mobileNav) return;

    hamburger.setAttribute("aria-expanded", open ? "true" : "false");
    mobileNav.setAttribute("aria-hidden", open ? "false" : "true");
    mobileNav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
  }

  if (hamburger && mobileNav) {
    hamburger.addEventListener("click", function () {
      setNav(hamburger.getAttribute("aria-expanded") !== "true");
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setNav(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setNav(false);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) setNav(false);
    });
  }

  /* ------------------------------------------------------------------------
     Fade-in on scroll
     ------------------------------------------------------------------------ */
  var revealItems = document.querySelectorAll(
    ".fade-up, .fade-left, .fade-right"
  );

  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  /* ------------------------------------------------------------------------
     Highlight the nav link for the section in view
     ------------------------------------------------------------------------ */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll(".nav-link")
  );
  var sections = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var spyObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = "#" + entry.target.id;
          navLinks.forEach(function (link) {
            link.classList.toggle("is-active", link.getAttribute("href") === id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach(function (section) {
      spyObserver.observe(section);
    });
  }

  /* ------------------------------------------------------------------------
     Contact form — front-end validation & confirmation
     ------------------------------------------------------------------------ */
  var form = document.getElementById("contact-form");
  var formMessage = document.getElementById("form-success");

  if (form && formMessage) {
    var nameField = form.elements.namedItem("name");
    var emailField = form.elements.namedItem("email");

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = nameField.value.trim();
      var email = emailField.value.trim();
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      var valid = true;

      nameField.removeAttribute("aria-invalid");
      emailField.removeAttribute("aria-invalid");

      if (!name) {
        nameField.setAttribute("aria-invalid", "true");
        valid = false;
      }

      if (!emailPattern.test(email)) {
        emailField.setAttribute("aria-invalid", "true");
        valid = false;
      }

      if (!valid) {
        formMessage.textContent =
          "Please add your name and a valid email address so we can reply.";
        formMessage.classList.add("is-visible", "is-error");
        (name ? emailField : nameField).focus();
        return;
      }

      formMessage.textContent =
        "Thank you, " +
        name.split(" ")[0] +
        ". Your enquiry is on its way — we will be in touch shortly.";
      formMessage.classList.remove("is-error");
      formMessage.classList.add("is-visible");

      form.reset();
    });
  }

  /* ------------------------------------------------------------------------
     Footer year
     ------------------------------------------------------------------------ */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
