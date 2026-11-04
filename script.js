const header = document.querySelector("[data-header]");
document.querySelectorAll('a[href="#topo"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });
});
const menuButton = document.querySelector(".menu-button");
const navigation = document.querySelector(".main-nav");
const dropdownTriggers = [...document.querySelectorAll(".nav-dropdown__trigger")];
const heroVideo = document.querySelector(".hero__media--video");

if (heroVideo) {
  const slowHeroVideo = () => {
    heroVideo.defaultPlaybackRate = 0.3;
    heroVideo.playbackRate = 0.3;
  };
  heroVideo.addEventListener("loadedmetadata", slowHeroVideo, { once: true });
  if (heroVideo.readyState >= 1) slowHeroVideo();
}

document.documentElement.classList.add("js");

const closeDropdowns = (except = null) => {
  dropdownTriggers.forEach((trigger) => {
    if (trigger !== except) trigger.setAttribute("aria-expanded", "false");
  });
};

const closeMenu = () => {
  if (!navigation || !menuButton) return;
  navigation.classList.remove("is-open");
  menuButton.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
  closeDropdowns();
};

menuButton?.addEventListener("click", () => {
  const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
  navigation.classList.toggle("is-open", willOpen);
  menuButton.setAttribute("aria-expanded", String(willOpen));
  document.body.classList.toggle("menu-open", willOpen);
});

navigation?.addEventListener("click", (event) => {
  if (event.target.closest("a")) closeMenu();
});

dropdownTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    const willOpen = trigger.getAttribute("aria-expanded") !== "true";
    closeDropdowns(trigger);
    trigger.setAttribute("aria-expanded", String(willOpen));
  });
});

document.addEventListener("click", () => closeDropdowns());

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDropdowns();
    closeMenu();
  }
});

if (header) {
  const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 48);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.16 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const parallaxLayers = [...document.querySelectorAll("[data-parallax]")];
let parallaxFrame = 0;

const updateParallax = () => {
  parallaxFrame = 0;
  const viewportHeight = window.innerHeight;
  parallaxLayers.forEach((layer) => {
    if (motionPreference.matches) {
      layer.style.transform = "";
      return;
    }
    const section = layer.parentElement.getBoundingClientRect();
    if (section.bottom < 0 || section.top > viewportHeight) return;
    const travel = (viewportHeight / 2 - section.top - section.height / 2) / ((viewportHeight + section.height) / 2);
    const depth = layer.classList.contains("section-backdrop--people") ? 42 : 30;
    layer.style.transform = `translate3d(0, ${Math.round(Math.max(-1, Math.min(1, travel)) * depth)}px, 0)`;
  });
};

const requestParallax = () => {
  if (!parallaxFrame) parallaxFrame = window.requestAnimationFrame(updateParallax);
};

if (parallaxLayers.length) {
  requestParallax();
  window.addEventListener("scroll", requestParallax, { passive: true });
  window.addEventListener("resize", requestParallax);
  motionPreference.addEventListener("change", requestParallax);
}

const heroHeadline = document.querySelector(".hero__headline");
if (heroHeadline) {
  let titleFrame = 0;
  const updateTitleParallax = () => {
    titleFrame = 0;
    const shift = motionPreference.matches ? 0 : Math.min(20, window.scrollY * 0.045);
    heroHeadline.style.setProperty("--hero-scroll-shift", `${shift.toFixed(1)}px`);
  };
  const requestTitleParallax = () => {
    if (!titleFrame) titleFrame = window.requestAnimationFrame(updateTitleParallax);
  };
  requestTitleParallax();
  window.addEventListener("scroll", requestTitleParallax, { passive: true });
  motionPreference.addEventListener("change", requestTitleParallax);
}

document.querySelectorAll("[data-back-link]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (!document.referrer || window.history.length < 2) return;
    try {
      if (new URL(document.referrer).origin !== window.location.origin) return;
      event.preventDefault();
      window.history.back();
    } catch {
      // The regular link to the home page remains available.
    }
  });
});

const galleryButtons = [...document.querySelectorAll(".process-mosaic__open")];
const galleryDialog = document.querySelector(".gallery-lightbox");
if (galleryDialog && galleryButtons.length) {
  const image = galleryDialog.querySelector(".gallery-lightbox__image");
  const caption = galleryDialog.querySelector(".gallery-lightbox__caption span");
  const counter = galleryDialog.querySelector(".gallery-lightbox__count");
  let current = 0;
  let opener = null;

  const showImage = (index) => {
    current = (index + galleryButtons.length) % galleryButtons.length;
    const source = galleryButtons[current].querySelector("img");
    image.src = source.currentSrc || source.src;
    image.alt = source.alt;
    caption.textContent = ''; caption.hidden = true;
    counter.textContent = `${current + 1} / ${galleryButtons.length}`;
  };

  galleryButtons.forEach((button, index) => button.addEventListener("click", () => {
    opener = button;
    showImage(index);
    galleryDialog.showModal();
  }));
  galleryDialog.querySelector(".gallery-lightbox__close").addEventListener("click", () => galleryDialog.close());
  galleryDialog.querySelector(".gallery-lightbox__nav--prev").addEventListener("click", () => showImage(current - 1));
  galleryDialog.querySelector(".gallery-lightbox__nav--next").addEventListener("click", () => showImage(current + 1));
  galleryDialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      showImage(current + (event.key === "ArrowRight" ? 1 : -1));
    }
  });
  galleryDialog.addEventListener("click", (event) => {
    if (event.target === galleryDialog) galleryDialog.close();
  });
  galleryDialog.addEventListener("close", () => opener?.focus());
}

const communityRows = [...document.querySelectorAll(".community-marquee__row")];
if (communityRows.length) {
  const prepareMarquees = () => {
    communityRows.forEach((row) => {
      const track = row.querySelector(".community-marquee__track");
      const original = track.querySelector(".community-marquee__group");
      track.classList.remove("is-animated");
      track.querySelectorAll(".community-marquee__group[data-clone]").forEach((copy) => copy.remove());
      if (motionPreference.matches) return;

      const groupWidth = original.getBoundingClientRect().width;
      if (!groupWidth) return;
      const groupsNeeded = Math.max(2, Math.ceil(row.clientWidth / groupWidth) + 1);
      for (let index = 1; index < groupsNeeded; index += 1) {
        const copy = original.cloneNode(true);
        copy.dataset.clone = "true";
        copy.setAttribute("aria-hidden", "true");
        track.append(copy);
      }
      track.style.setProperty("--marquee-distance", `${groupWidth}px`);
      track.style.setProperty("--marquee-duration", `${Math.max(28, groupWidth / 35)}s`);
      track.classList.add("is-animated");
    });
  };

  let resizeFrame = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(prepareMarquees);
  });
  motionPreference.addEventListener("change", prepareMarquees);
  prepareMarquees();
}

const faqHover = window.matchMedia("(hover: hover) and (pointer: fine)");
const faqWide = window.matchMedia("(min-width: 641px)");
const faqReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
document.querySelectorAll(".faq-list, .kiln-program__list, .kiln-modules").forEach((list) => {
  if (list.classList.contains("geo-faq-compact")) return;
  const items = [...list.querySelectorAll(":scope > details")];
  const isFaq = list.classList.contains("faq-list");
  const hoverOpens = isFaq || list.classList.contains("kiln-program__list");
  let lensFrame = 0;
  let pointerX = 0;
  let pointerY = 0;
  let hoverOpened = null;
  const canUseLens = (event) => faqHover.matches && faqWide.matches && !faqReducedMotion.matches && event.pointerType === "mouse";
  const updateLens = () => {
    items.forEach((item) => {
      const rect = item.querySelector("summary").getBoundingClientRect();
      const distanceY = Math.abs(pointerY - (rect.top + rect.height / 2));
      const distanceX = Math.max(0, Math.abs(pointerX - (rect.left + rect.width / 2)) - rect.width / 2);
      const distance = isFaq ? distanceY : Math.hypot(distanceX, distanceY);
      const strength = Math.max(0, 1 - distance / (isFaq ? 180 : 220));
      item.style.setProperty("--faq-scale", (1 + (isFaq ? .13 : .075) * strength * strength).toFixed(3));
      item.style.zIndex = String(1 + Math.round(strength * 10));
    });
    lensFrame = 0;
  };
  list.addEventListener("pointermove", (event) => {
    if (!canUseLens(event)) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (!lensFrame) lensFrame = window.requestAnimationFrame(updateLens);
  });
  list.addEventListener("pointerleave", (event) => {
    if (!canUseLens(event)) return;
    window.cancelAnimationFrame(lensFrame);
    lensFrame = 0;
    items.forEach((item) => {
      item.style.removeProperty("--faq-scale");
      item.style.removeProperty("z-index");
    });
    if (hoverOpens && hoverOpened) hoverOpened.open = false;
    hoverOpened = null;
  });
  items.forEach((item) => {
    let hoverTimer;
    item.addEventListener("pointerenter", (event) => {
      if (!hoverOpens || !canUseLens(event)) return;
      hoverTimer = window.setTimeout(() => {
        items.forEach((other) => { if (other !== item) other.open = false; });
        item.open = true;
        hoverOpened = item;
      }, 100);
    });
    item.addEventListener("pointerleave", (event) => {
      if (!hoverOpens || !canUseLens(event)) return;
      window.clearTimeout(hoverTimer);
      if (hoverOpened === item) {
        item.open = false;
        hoverOpened = null;
      }
    });
    item.addEventListener("click", () => { hoverOpened = null; });
  });
});
