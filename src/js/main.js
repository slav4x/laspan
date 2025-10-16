document.addEventListener('DOMContentLoaded', () => {
  Fancybox.bind('[data-fancybox]', {
    dragToClose: false,
    autoFocus: false,
    placeFocusBack: false,
    Thumbs: false,
    Images: {
      zoom: false,
    },
  });

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
  dropdown.style.setProperty('--pos-right', `${diff}px`);
}

window.addEventListener('load', updateDropdownPos);
window.addEventListener('resize', updateDropdownPos);
