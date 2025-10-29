document.addEventListener('DOMContentLoaded', () => {
  Fancybox.bind('[data-fancybox]', {
    dragToClose: false,
    autoFocus: false,
    placeFocusBack: false,
    Thumbs: false,
    Images: {
      zoom: false,
    },
    Iframe: {
      attr: {
        allow: 'autoplay; fullscreen; picture-in-picture; screen-wake-lock',
      },
    },
    on: {
      'Carousel.createSlide': (fancybox, carousel, slide) => {
        const src = String(slide.src || '');

        if (src.includes('video_ext.php')) {
          slide.type = 'iframe';
          slide.isVk = true;
          return;
        }

        const ids = extractVkIds(src);
        if (ids) {
          const { oid, id, host } = ids;
          const params = new URLSearchParams({
            autoplay: '1',
            hd: '2',
            js_api: '1',
            frameBorder: '0',
          });

          const embedHost = host === 'vkvideo.ru' ? 'vkvideo.ru' : 'vk.com';
          slide.type = 'iframe';
          slide.src = `https://${embedHost}/video_ext.php?oid=${oid}&id=${id}&${params.toString()}`;
          slide.isVk = true;
        }
      },

      reveal: (fancybox, slide) => {
        if (!slide?.isVk) return;
        const add = () => {
          const content = slide.el?.querySelector('.fancybox__content');
          if (content) content.classList.add('is-vkvideo');
        };
        add();
        requestAnimationFrame(add);
      },
    },
  });

  function extractVkIds(url) {
    return parse(url) || parse(tryDecode(url));

    function tryDecode(u) {
      try {
        return decodeURIComponent(u);
      } catch {
        return u;
      }
    }

    function parse(u) {
      const hostMatch = u.match(/^https?:\/\/(?:www\.)?([^\/?#]+)/i);
      const host = hostMatch?.[1] || '';

      const patterns = [
        /^https?:\/\/(?:www\.)?vk\.com\/video(?:\?z=video|)(-?\d+)_(\d+)/i,
        /^https?:\/\/(?:www\.)?vk\.com\/video\?z=video(-?\d+)_(\d+)/i,
        /^https?:\/\/(?:www\.)?vkvideo\.ru\/video(-?\d+)_(\d+)/i,
        /^https?:\/\/(?:www\.)?vkvideo\.ru\/video(-?\d+)_(\d+)/i,
        /^https?:\/\/(?:www\.)?vkvideo\.ru\/video\?z=video(-?\d+)_(\d+)/i,
      ];

      for (const re of patterns) {
        const m = u.match(re);
        if (m) {
          return { oid: m[1], id: m[2], host };
        }
      }
      return null;
    }
  }

  const maskOptions = {
    mask: '+7 (000) 000-00-00',
    onFocus() {
      if (this.value === '') this.value = '+7 ';
    },
    onBlur() {
      if (this.value === '+7 ') this.value = '';
    },
  };

  document.querySelectorAll('.masked').forEach((item) => new IMask(item, maskOptions));

  const header = document.querySelector('.header');
  if (!header) return;

  const nav = header.querySelector('.header-bottom__nav');
  const dropdown = header.querySelector('.header-dropdown');
  const categories = dropdown?.querySelectorAll('.header-dropdown__category') || [];
  const menuItems = nav?.querySelectorAll('li[data-category]') || [];

  let closeTimer = null;

  const openDropdown = (categoryId) => {
    if (!dropdown) return;

    dropdown.classList.add('is-open');

    menuItems.forEach((li) => {
      li.classList.toggle('is-active', li.dataset.category === categoryId);
    });

    categories.forEach((cat) => {
      const isTarget = cat.dataset.category === categoryId;
      cat.classList.toggle('is-active', isTarget);
      if (isTarget) ensureDefaultContent(cat);
    });
  };

  const closeDropdown = () => {
    dropdown?.classList.remove('is-open');
    menuItems.forEach((li) => li.classList.remove('is-active'));
    setTimeout(() => {
      categories.forEach((cat) => cat.classList.remove('is-active'));
    }, 200);
  };

  const ensureDefaultContent = (categoryEl) => {
    const activeSidebarItem = categoryEl.querySelector('.header-dropdown__sidebar-nav li.is-active');
    if (activeSidebarItem) {
      showContent(categoryEl, activeSidebarItem.dataset.content);
      return;
    }
    const firstItem = categoryEl.querySelector('.header-dropdown__sidebar-nav li[data-content]');
    if (firstItem) {
      firstItem.classList.add('is-active');
      showContent(categoryEl, firstItem.dataset.content);
    }
  };

  const showContent = (categoryEl, contentId) => {
    const allContent = categoryEl.querySelectorAll('.header-dropdown__main-content');
    allContent.forEach((c) => c.classList.toggle('is-active', c.dataset.content === contentId));

    const sidebarItems = categoryEl.querySelectorAll('.header-dropdown__sidebar-nav li[data-content]');
    sidebarItems.forEach((li) => li.classList.toggle('is-active', li.dataset.content === contentId));
  };

  if (nav) {
    nav.addEventListener('mouseenter', () => {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    });

    nav.addEventListener('mouseover', (e) => {
      const li = e.target.closest('li[data-category]');
      if (!li) return;
      openDropdown(li.dataset.category);
    });

    nav.addEventListener('click', (e) => {
      const linkLI = e.target.closest('li[data-category]');
      if (linkLI) e.preventDefault();
    });
  }

  dropdown?.addEventListener('mouseenter', () => {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  });

  dropdown?.addEventListener('mouseover', (e) => {
    const currentCategory = e.target.closest('.header-dropdown__category.is-active');
    const li = e.target.closest('.header-dropdown__sidebar-nav li[data-content]');
    if (!currentCategory || !li) return;
    showContent(currentCategory, li.dataset.content);
  });

  header.addEventListener('mouseleave', () => {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(closeDropdown, 0);
  });

  header.addEventListener('focusin', (e) => {
    const li = e.target.closest('.header-bottom__nav li[data-category]');
    if (li) openDropdown(li.dataset.category);
    const sideItem = e.target.closest('.header-dropdown__sidebar-nav li[data-content]');
    if (sideItem) {
      const cat = sideItem.closest('.header-dropdown__category');
      if (cat?.classList.contains('is-active')) showContent(cat, sideItem.dataset.content);
    }
  });

  header.addEventListener('focusout', (e) => {
    if (!header.contains(e.relatedTarget)) closeDropdown();
  });

  const manufacturedCarousel = document.querySelector('.manufactured-carousel');
  if (manufacturedCarousel) {
    new Splide(manufacturedCarousel, {
      type: 'loop',
      perPage: 1,
      focus: 0,
      omitEnd: true,
      pagination: false,
    }).mount();
  }

  const objectsCarousel = document.querySelector('.objects-carousel');
  if (objectsCarousel) {
    const thumbs = new Splide('.objects-carousel__thumbs', {
      type: 'loop',
      rewind: true,
      pagination: false,
      arrows: true,
      isNavigation: true,
      autoWidth: true,
      perPage: 1,
      drag: 'free',
      snap: true,
      keyboard: 'global',
      speed: 500,
      breakpoints: {
        768: {
          autoWidth: false,
        },
      },
    });

    const main = new Splide('.objects-carousel__main', {
      type: 'loop',
      rewind: true,
      pagination: false,
      arrows: false,
      autoplay: false,
      pauseOnHover: true,
      keyboard: 'global',
      autoHeight: true,
      speed: 1000,
    });

    main.sync(thumbs);

    main.mount();
    thumbs.mount();
  }

  const lazyVideos = document.querySelectorAll('.lazy-video');
  lazyVideos.forEach((video) => {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const vid = entry.target;
            const src = vid.querySelector('source');
            if (!src || !src.dataset.src) return;
            src.src = src.dataset.src;
            vid.load();
            vid.play();
            obs.unobserve(vid);
          }
        });
      },
      { rootMargin: '0px 0px 0px 0px' }
    );

    observer.observe(video);
  });

  const lazyIframes = document.querySelectorAll('.lazy-iframe');
  lazyIframes.forEach((iframe) => {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const src = el.dataset.src;

            if (!src) return;

            el.src = src;
            obs.unobserve(el);
          }
        });
      },
      { rootMargin: '0px 0px 0px 0px' }
    );

    observer.observe(iframe);
  });

  document.querySelectorAll('.installation-tabs li').forEach((tab) => {
    tab.addEventListener('click', () => {
      const id = tab.getAttribute('data-id');

      document.querySelectorAll('.installation-tabs li').forEach((t) => t.classList.remove('active'));
      document.querySelectorAll('.installation-tab').forEach((c) => c.classList.remove('active'));

      tab.classList.add('active');
      document.querySelector(`.installation-tab[data-tab="${id}"]`).classList.add('active');
    });
  });

  const laminateCarousel = document.querySelector('.laminate-carousel');
  const laminateCurrentEl = document.querySelector('.laminate-counter__current');
  const laminateTotalEl = document.querySelector('.laminate-counter__total');
  const laminateProgressBar = document.querySelector('.laminate-counter__progress span');
  const laminateArrowPrev = document.querySelector('.laminate-arrows .splide__arrow--prev');
  const laminateArrowNext = document.querySelector('.laminate-arrows .splide__arrow--next');

  if (laminateCarousel && laminateCurrentEl && laminateTotalEl && laminateProgressBar) {
    const pad2 = (n) => String(n).padStart(2, '0');
    const normalize = (i, n) => ((i % n) + n) % n;

    const splide = new Splide(laminateCarousel, {
      type: 'loop',
      perPage: 1,
      arrows: false,
      pagination: false,
      speed: 600,
      grid: {
        rows: 2,
        cols: 2,
        gap: { row: '24px', col: '24px' },
      },
      breakpoints: {
        768: {
          grid: {
            rows: 1,
            cols: 1,
            gap: { row: '24px', col: '24px' },
          },
        },
      },
    }).mount(window.splide.Extensions);

    laminateArrowPrev?.addEventListener('click', () => splide.go('<'));
    laminateArrowNext?.addEventListener('click', () => splide.go('>'));

    const totalPages = splide.length || 1;
    laminateTotalEl.textContent = pad2(totalPages);

    const setBar = (pct) => {
      const clamped = Math.max(0, Math.min(100, Math.round(pct)));
      laminateProgressBar.style.width = clamped + '%';
    };

    const updateUI = () => {
      const page = normalize(splide.index, totalPages) + 1;
      laminateCurrentEl.textContent = pad2(page);
      const pct = (page / totalPages) * 100;
      setBar(pct);
    };

    splide.on('mounted move', updateUI);

    updateUI();
  }

  const previewLinks = document.querySelectorAll('[data-manufactured-preview]');
  const previewModal = document.querySelector('.manufactured-preview');
  const previewImage = previewModal?.querySelector('.manufactured-preview__image');
  const previewClose = previewModal?.querySelector('.manufactured-preview__close');
  const previewBg = previewModal?.querySelector('.manufactured-preview__bg');

  if (previewLinks.length && previewModal && previewImage) {
    previewLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const imgSrc = link.getAttribute('href');
        previewImage.setAttribute('src', imgSrc);
        previewModal.classList.add('show');
      });
    });

    const closePreview = () => {
      previewModal.classList.remove('show');
      setTimeout(() => {
        previewImage.removeAttribute('src');
      }, 400);
    };

    [previewClose, previewBg].forEach((el) => {
      el?.addEventListener('click', closePreview);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && previewModal.classList.contains('show')) {
        closePreview();
      }
    });
  }

  const promoCarousel = document.querySelector('.promo-carousel');
  const promoArrowPrev = document.querySelector('.promo-control__arrows .splide__arrow--prev');
  const promoArrowNext = document.querySelector('.promo-control__arrows .splide__arrow--next');
  const promoNextText = document.querySelector('.promo-control__next p');

  if (promoCarousel) {
    const splide = new Splide(promoCarousel, {
      type: 'loop',
      perPage: 1,
      arrows: false,
      pagination: false,
      speed: 600,
      breakpoints: {
        768: {
          destroy: true,
        },
      },
    }).mount();

    const { slides } = splide.Components.Elements;

    const setNextName = (currentIndex) => {
      if (!promoNextText || !slides?.length) return;
      const nextIndex = (currentIndex + 1) % slides.length;
      const nextSlide = slides[nextIndex];
      promoNextText.textContent = nextSlide?.dataset?.slideName ?? '';
    };

    setNextName(splide.index);

    splide.on('move', (newIndex) => setNextName(newIndex));

    promoArrowPrev?.addEventListener('click', () => splide.go('<'));
    promoArrowNext?.addEventListener('click', () => splide.go('>'));
  }

  const cityItems = document.querySelectorAll('.warehouses-group__list li');
  const cityPaths = document.querySelectorAll('.warehouses-map [data-city]');

  cityItems.forEach((li) => {
    li.addEventListener('mouseenter', () => {
      const cityName = li.textContent.trim();
      const path = document.querySelector(`.warehouses-map [data-city="${cityName}"]`);
      if (path) path.classList.add('active');
      li.classList.add('active');
    });

    li.addEventListener('mouseleave', () => {
      const cityName = li.textContent.trim();
      const path = document.querySelector(`.warehouses-map [data-city="${cityName}"]`);
      if (path) path.classList.remove('active');
      li.classList.remove('active');
    });
  });

  cityPaths.forEach((path) => {
    const cityName = path.getAttribute('data-city');
    path.addEventListener('mouseenter', () => {
      const li = Array.from(cityItems).find((el) => el.textContent.trim() === cityName);
      if (li) li.classList.add('active');
      path.classList.add('active');
    });

    path.addEventListener('mouseleave', () => {
      const li = Array.from(cityItems).find((el) => el.textContent.trim() === cityName);
      if (li) li.classList.remove('active');
      path.classList.remove('active');
    });
  });
});

function updateDropdownPos() {
  const header = document.querySelector('.header');
  const container = document.querySelector('.header .container');
  const dropdown = document.querySelector('.header-dropdown');

  if (!header || !container || !dropdown) return;

  const headerWidth = header.offsetWidth;
  const containerStyle = getComputedStyle(container);
  const containerWidth = container.clientWidth - parseFloat(containerStyle.paddingLeft) - parseFloat(containerStyle.paddingRight);

  const diff = -((headerWidth - containerWidth) / 2);
  document.documentElement.style.setProperty('--pos-right', `${diff}px`);
}

window.addEventListener('load', updateDropdownPos);
window.addEventListener('resize', updateDropdownPos);
