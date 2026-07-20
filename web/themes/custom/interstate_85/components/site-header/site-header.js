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
      });
    },
  };
})(Drupal);
