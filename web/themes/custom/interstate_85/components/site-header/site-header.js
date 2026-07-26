(function (Drupal) {
  Drupal.behaviors.i8SiteHeader = {
    attach(context) {
      const headers = context.querySelectorAll
        ? context.querySelectorAll('.site-header')
        : [];

      headers.forEach((header) => {
        if (header.dataset.i8HeaderBound) {
          return;
        }
        header.dataset.i8HeaderBound = 'true';

        const toggle = header.querySelector('.site-header__toggle');
        const nav = header.querySelector('.site-header__nav');
        if (toggle && nav) {
          toggle.addEventListener('click', () => {
            const isOpen = nav.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(isOpen));
          });
        }

        if (header.classList.contains('site-header--transparent')) {
          const solidify = () => {
            header.classList.toggle('is-scrolled', window.scrollY > 24);
          };
          window.addEventListener('scroll', solidify, { passive: true });
          solidify();
        }

        // Published so other sticky elements (the song ledger's letter
        // rail, INT8-029) can dock below the real header height instead of
        // a guessed pixel value — the header's own height varies with the
        // admin toolbar and the responsive breakpoint, a plain CSS token
        // can't express that.
        const publishHeaderHeight = () => {
          document.documentElement.style.setProperty(
            '--i8-header-height',
            `${header.getBoundingClientRect().height}px`,
          );
        };
        window.addEventListener('resize', publishHeaderHeight, { passive: true });
        publishHeaderHeight();
      });
    },
  };
})(Drupal);
