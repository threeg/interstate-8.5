/**
 * @file
 * Rerolls the page hero's background to a genuinely random pick on every
 * page load — including one served byte-for-byte from Drupal's internal
 * page cache. That cache stores responses permanently regardless of any
 * render-array #cache max-age (see PageCache::storeResponse()), so a
 * server-side-only random pick freezes solid for every anonymous visitor
 * once the page is cached; this JS reroll is what makes each page LOAD vary
 * even when the underlying HTML is identical.
 */
((Drupal, once) => {
  Drupal.behaviors.i8PageHero = {
    attach(context, settings) {
      const alternates = settings.i8PageHero && settings.i8PageHero.alternates;
      if (!alternates || !alternates.length) {
        return;
      }

      once('i8-page-hero', '.hero__image-picture', context).forEach((img) => {
        const pick = alternates[Math.floor(Math.random() * alternates.length)];
        const picture = img.closest('picture');

        (picture ? picture.querySelectorAll('source') : []).forEach((source) => {
          if (source.media.includes('max-width')) {
            source.setAttribute('srcset', `${pick.mobile} 1x`);
          }
          else if (source.media.includes('min-width')) {
            source.setAttribute('srcset', `${pick.desktop} 1x`);
          }
        });

        img.setAttribute('src', pick.desktop);
      });
    },
  };
})(Drupal, once);
