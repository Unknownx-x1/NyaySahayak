/**
 * NyaySahayak — Full-Bleed Video Background Scrolling Landing Page JS
 * 
 * Features:
 * 1. Active Nav Link Highlighting on Scroll
 * 2. Mobile Menu Controller
 */

document.addEventListener("DOMContentLoaded", () => {
  initMobileMenu();
  initScrollNavObserver();
});

/**
 * Active Nav Link Highlighting on Scroll
 */
function initScrollNavObserver() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link, .mobile-nav-link");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          navLinks.forEach((link) => {
            const href = link.getAttribute("href");
            if (href === `#${id}`) {
              link.classList.add("active");
            } else {
              link.classList.remove("active");
            }
          });
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach((sec) => observer.observe(sec));
}

/**
 * Mobile Menu Controller
 */
function initMobileMenu() {
  const burgerBtn = document.getElementById("burger-btn");
  const overlay = document.getElementById("mobile-overlay");
  if (!burgerBtn || !overlay) return;

  function openMenu() {
    burgerBtn.setAttribute("aria-expanded", "true");
    overlay.classList.add("active");
    document.body.classList.add("menu-open");
  }

  function closeMenu() {
    burgerBtn.setAttribute("aria-expanded", "false");
    overlay.classList.remove("active");
    document.body.classList.remove("menu-open");
  }

  burgerBtn.addEventListener("click", () => {
    const isOpen = burgerBtn.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && burgerBtn.getAttribute("aria-expanded") === "true") {
      closeMenu();
    }
  });

  const mobileLinks = document.querySelectorAll(".mobile-nav-link, .mobile-sign-in-btn");
  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720 && burgerBtn.getAttribute("aria-expanded") === "true") {
      closeMenu();
    }
  });
}
