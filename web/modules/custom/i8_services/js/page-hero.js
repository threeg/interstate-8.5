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
        img.setAttribute('src', pick.src);
        img.setAttribute('srcset', pick.srcset);
      });
    },
  };
})(Drupal, once);
