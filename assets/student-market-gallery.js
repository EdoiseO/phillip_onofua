(() => {
  const galleries = {
    marketplace: {
      label: "Marketplace and listings",
      images: [
        {
          src: "assets/student-market-browse-desktop.png",
          width: 1440,
          height: 1000,
          title: "Bounded marketplace catalogue",
          alt: "Student Market desktop marketplace showing active student listings, prices, campuses, search, categories, and seller navigation",
          caption: "The visible catalogue is produced by bounded server queries over database-controlled listing state."
        },
        {
          src: "assets/student-market-miles-morales-listing-desktop.png",
          width: 1470,
          height: 726,
          title: "Miles Morales listing detail",
          alt: "Student Market listing page for MILES MORALES: SPIDER-MAN #1 with cover art, price, campus, condition, description, and seller profile",
          caption: "The listing route renders the committed result after ownership, lifecycle, revision, and media rules have been enforced."
        }
      ]
    },
    messaging: {
      label: "Messaging and media",
      images: [
        {
          src: "assets/student-market-messages-desktop.png",
          width: 1440,
          height: 1000,
          title: "Listing-linked inbox",
          alt: "Student Market desktop inbox with announcement and listing-linked buyer and seller conversations",
          caption: "The inbox is capped at 100 conversations and refreshes through recipient-safe notification signals."
        },
        {
          src: "assets/student-market-conversation-desktop.png",
          width: 1470,
          height: 670,
          title: "Bounded conversation history",
          alt: "Student Market desktop conversation showing its listing, buyer and seller messages, and a disabled composer after the listing closed",
          caption: "The scrollable thread combines bounded history, signed attachment access, reactions, read state, and lifecycle-aware controls."
        }
      ]
    },
    profiles: {
      label: "Profiles and accounts",
      images: [
        {
          src: "assets/student-market-public-profile-desktop.png",
          width: 1084,
          height: 983,
          title: "Public seller profile",
          alt: "Student Market public seller profile with identity, school, bio, active listings, and seller activity",
          caption: "Public profile data is projected from the shared account model while private account fields remain outside the route."
        },
        {
          src: "assets/student-market-profile-settings-desktop.png",
          width: 1084,
          height: 1391,
          title: "Authenticated profile settings",
          alt: "Student Market profile settings with avatar, school identity, personal details, and account controls",
          caption: "Authenticated settings update the same seller identity used across listings, messages, reports, and account lifecycle controls."
        }
      ]
    },
    admin: {
      label: "Admin and moderation",
      images: [
        {
          src: "assets/student-market-admin-desktop.png",
          width: 1440,
          height: 1000,
          title: "Role-gated admin overview",
          alt: "Student Market admin overview with operational navigation and moderation summaries",
          caption: "The admin shell separates ordinary marketplace activity from role-gated operational workflows."
        },
        {
          src: "assets/student-market-reports-registry-desktop.png",
          width: 1470,
          height: 771,
          title: "Bounded reports registry",
          alt: "Student Market Reports registry with status, subject, reason, and search filters above the newest active reports",
          caption: "The registry normalizes status, subject, reason, search, and pagination inputs before querying the newest bounded records."
        },
        {
          src: "assets/student-market-report-review-current-desktop.png",
          width: 1470,
          height: 1823,
          title: "Evidence-backed report review",
          alt: "Student Market report review showing reported listing evidence, related reports, listing and seller context, moderator notes, and decision fields",
          caption: "The review route assembles evidence, related reports, private note history, subject context, and decision controls without exposing privileged data to ordinary users."
        },
        {
          src: "assets/student-market-admin-listings-desktop.png",
          width: 1084,
          height: 1140,
          title: "Listing review registry",
          alt: "Student Market admin listing registry with review status filters and submitted listings",
          caption: "Submitted listings are filtered by explicit review state before a moderator opens the decision workflow."
        },
        {
          src: "assets/student-market-listing-review-desktop.png",
          width: 1084,
          height: 1977,
          title: "Listing approval decision",
          alt: "Student Market listing review with submitted details, seller feedback, approval controls, seller context, and decision history",
          caption: "A reviewer sees the submitted record, seller context, required rejection feedback, and immutable decision history in one bounded workflow."
        },
        {
          src: "assets/student-market-enforcement-desktop.png",
          width: 1084,
          height: 788,
          title: "Account enforcement registry",
          alt: "Student Market enforcement registry with search filters and a critical account restriction record",
          caption: "Standing, sanctions, severity, expiry, and appeals are handled separately from ordinary marketplace records."
        }
      ]
    },
    mobile: {
      label: "Mobile application",
      layout: "mobile",
      images: [
        {
          src: "assets/student-market-browse-mobile.png",
          width: 390,
          height: 844,
          title: "Mobile marketplace",
          alt: "Student Market mobile marketplace with responsive listing cards and bottom navigation",
          caption: "The mobile catalogue uses the same server query and listing model with a touch-first navigation shell."
        },
        {
          src: "assets/student-market-messages-mobile.png",
          width: 390,
          height: 844,
          title: "Mobile listing-linked messaging",
          alt: "Student Market mobile conversation showing its listing, participant, message history, and closed composer state",
          caption: "Conversation context, bounded history, and lifecycle-aware controls remain visible in the narrower composition."
        },
        {
          src: "assets/student-market-ben10-conversation-mobile.jpg",
          width: 585,
          height: 1266,
          title: "Mobile media-rich conversation",
          alt: "Student Market mobile conversation linked to a Ben 10 comic listing with participant details, image attachments, reactions, and the message composer",
          caption: "The compact conversation keeps listing context, participants, attachments, reactions, message history, and the composer within one touch-first thread."
        },
        {
          src: "assets/student-market-profile-mobile.png",
          width: 390,
          height: 844,
          title: "Mobile student identity",
          alt: "Student Market mobile profile with account identity, school, seller information, and account navigation",
          caption: "Profile and school identity remain consistent across the public marketplace and authenticated account surface."
        }
      ]
    },
    "data-model": {
      label: "Relational data model",
      images: [
        {
          src: "assets/student-market-data-model-overview.jpg",
          width: 1140,
          height: 786,
          title: "Connected marketplace records",
          alt: "Dark relational diagram connecting listings, conversations, messages, notifications, reports, profiles, and audit records",
          caption: "Listings, conversations, messages, notifications, profiles, reports, and audit operations share explicit relational links instead of isolated feature storage."
        },
        {
          src: "assets/student-market-data-model-full.png",
          width: 2736,
          height: 1276,
          title: "Full relational schema",
          alt: "Wide relational diagram of the complete Student Market PostgreSQL schema and its table relationships",
          caption: "The full model shows the connected operational surface across marketplace, messaging, moderation, media, notifications, and user lifecycle data."
        },
        {
          src: "assets/student-market-data-model-integrity.png",
          width: 2482,
          height: 1195,
          title: "Integrity and account lifecycle focus",
          alt: "Relational diagram focused on reports, notifications, profiles, blocks, account standing, and email delivery records",
          caption: "This focused view shows how reports and notifications connect to profiles, blocks, account standing, and delivery state."
        }
      ]
    }
  };

  const dialog = document.querySelector("[data-gallery-dialog]");
  const triggers = Array.from(document.querySelectorAll("[data-gallery-group]"));

  if (!dialog || triggers.length === 0) {
    return;
  }

  const image = dialog.querySelector("[data-gallery-image]");
  const figure = dialog.querySelector(".case-study-lightbox-figure");
  const groupLabel = dialog.querySelector("[data-gallery-group-label]");
  const title = dialog.querySelector("[data-gallery-title]");
  const caption = dialog.querySelector("[data-gallery-caption]");
  const original = dialog.querySelector("[data-gallery-original]");
  const closeButton = dialog.querySelector("[data-gallery-close]");
  const previousButton = dialog.querySelector("[data-gallery-prev]");
  const nextButton = dialog.querySelector("[data-gallery-next]");
  const thumbnails = dialog.querySelector("[data-gallery-thumbnails]");
  const zoomOutButton = dialog.querySelector("[data-gallery-zoom-out]");
  const zoomInButton = dialog.querySelector("[data-gallery-zoom-in]");
  const zoomLevelOutput = dialog.querySelector("[data-gallery-zoom-level]");

  if (!image || !figure || !groupLabel || !title || !caption || !original || !closeButton || !previousButton || !nextButton || !thumbnails || !zoomOutButton || !zoomInButton || !zoomLevelOutput) {
    return;
  }

  const minimumZoom = 1;
  const maximumZoom = 2;
  const zoomStep = 0.25;
  let activeGroup = "marketplace";
  let activeIndex = 0;
  let lastTrigger = null;
  let pointerStart = null;
  let zoomLevel = minimumZoom;

  const applyZoom = (nextZoom, { resetScroll = false } = {}) => {
    const previousScrollWidth = figure.scrollWidth || figure.clientWidth;
    const previousScrollHeight = figure.scrollHeight || figure.clientHeight;
    const horizontalCenter = previousScrollWidth > 0 ? (figure.scrollLeft + figure.clientWidth / 2) / previousScrollWidth : 0.5;
    const verticalCenter = previousScrollHeight > 0 ? (figure.scrollTop + figure.clientHeight / 2) / previousScrollHeight : 0.5;
    const gallery = galleries[activeGroup];

    zoomLevel = Math.min(maximumZoom, Math.max(minimumZoom, nextZoom));

    const percentage = Math.round(zoomLevel * 100);
    image.style.width = gallery.layout === "mobile" ? `min(${percentage}%, ${390 * zoomLevel}px)` : `${percentage}%`;
    figure.dataset.galleryZoomed = zoomLevel > minimumZoom ? "true" : "false";
    zoomLevelOutput.textContent = `${percentage}%`;
    zoomOutButton.disabled = zoomLevel <= minimumZoom;
    zoomInButton.disabled = zoomLevel >= maximumZoom;

    if (resetScroll) {
      figure.scrollTop = 0;
      figure.scrollLeft = 0;
      return;
    }

    requestAnimationFrame(() => {
      figure.scrollLeft = Math.max(0, horizontalCenter * figure.scrollWidth - figure.clientWidth / 2);
      figure.scrollTop = Math.max(0, verticalCenter * figure.scrollHeight - figure.clientHeight / 2);
    });
  };

  const buildThumbnails = (gallery) => {
    thumbnails.replaceChildren();

    gallery.images.forEach((item, index) => {
      const button = document.createElement("button");
      const thumbnail = document.createElement("img");

      button.type = "button";
      button.className = "case-study-lightbox-thumbnail";
      button.setAttribute("aria-label", `Open ${item.title}, image ${index + 1} of ${gallery.images.length}`);
      button.addEventListener("click", () => {
        activeIndex = index;
        render();
      });

      thumbnail.src = item.src;
      thumbnail.alt = "";
      thumbnail.loading = "lazy";
      button.append(thumbnail);
      thumbnails.append(button);
    });

    thumbnails.dataset.galleryGroup = activeGroup;
  };

  const render = () => {
    const gallery = galleries[activeGroup];
    const item = gallery.images[activeIndex];

    if (thumbnails.dataset.galleryGroup !== activeGroup) {
      buildThumbnails(gallery);
    }

    dialog.dataset.galleryLayout = gallery.layout || "desktop";
    groupLabel.textContent = gallery.label;
    title.textContent = item.title;
    image.src = item.src;
    image.alt = item.alt;
    image.width = item.width;
    image.height = item.height;
    caption.textContent = item.caption;
    original.href = item.src;
    previousButton.setAttribute("aria-label", `Show previous image in ${gallery.label}`);
    nextButton.setAttribute("aria-label", `Show next image in ${gallery.label}`);
    applyZoom(minimumZoom, { resetScroll: true });

    Array.from(thumbnails.children).forEach((button, index) => {
      if (index === activeIndex) {
        button.setAttribute("aria-current", "true");

        if (dialog.open) {
          button.scrollIntoView({ block: "nearest", inline: "center" });
        }
      } else {
        button.removeAttribute("aria-current");
      }
    });
  };

  const move = (direction) => {
    const gallery = galleries[activeGroup];
    activeIndex = (activeIndex + direction + gallery.images.length) % gallery.images.length;
    render();
  };

  const openGallery = (groupName, trigger) => {
    const gallery = galleries[groupName];

    if (!gallery) {
      return;
    }

    if (typeof dialog.showModal !== "function") {
      window.open(gallery.images[0].src, "_blank", "noopener");
      return;
    }

    activeGroup = groupName;
    activeIndex = 0;
    lastTrigger = trigger;
    dialog.showModal();
    render();
    document.body.classList.add("case-study-gallery-open");
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => openGallery(trigger.dataset.galleryGroup, trigger));
  });

  previousButton.addEventListener("click", () => move(-1));
  nextButton.addEventListener("click", () => move(1));
  zoomOutButton.addEventListener("click", () => applyZoom(zoomLevel - zoomStep));
  zoomInButton.addEventListener("click", () => applyZoom(zoomLevel + zoomStep));
  closeButton.addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    }

    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      applyZoom(zoomLevel + zoomStep);
    }

    if (event.key === "-") {
      event.preventDefault();
      applyZoom(zoomLevel - zoomStep);
    }

    if (event.key === "0") {
      event.preventDefault();
      applyZoom(minimumZoom);
    }
  });

  figure.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || zoomLevel > minimumZoom) {
      pointerStart = null;
      return;
    }

    pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };

    if (figure.setPointerCapture) {
      figure.setPointerCapture(event.pointerId);
    }
  });

  figure.addEventListener("pointerup", (event) => {
    if (!pointerStart || pointerStart.id !== event.pointerId) {
      return;
    }

    const distanceX = event.clientX - pointerStart.x;
    const distanceY = event.clientY - pointerStart.y;
    pointerStart = null;

    if (figure.hasPointerCapture?.(event.pointerId)) {
      figure.releasePointerCapture(event.pointerId);
    }

    if (Math.abs(distanceX) >= 45 && Math.abs(distanceX) > Math.abs(distanceY) * 1.25) {
      move(distanceX < 0 ? 1 : -1);
    }
  });

  figure.addEventListener("pointercancel", (event) => {
    if (figure.hasPointerCapture?.(event.pointerId)) {
      figure.releasePointerCapture(event.pointerId);
    }

    pointerStart = null;
  });

  dialog.addEventListener("close", () => {
    document.body.classList.remove("case-study-gallery-open");

    if (lastTrigger) {
      lastTrigger.focus();
    }
  });
})();
