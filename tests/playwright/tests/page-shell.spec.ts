import { test, expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Base layout shell — header + footer (INT8-015), corrected against the
 * refreshed hi-fi design in INT8-027.
 * The header/footer render on every page, so this suite exercises them
 * against a stable core route (/user/login) rather than the front page,
 * which is re-pointed to a real minimal page in INT8-017.
 *
 * Scope note (INT8-027): the transparent header variant is NOT exercised
 * here. `.site-header--transparent` exists in the theme, but no reachable
 * route renders `data-header-variant="transparent"` in this slice (the
 * homepage hero is design-only), so its hover/current/focus colours cannot
 * honestly be asserted against a live page. Only the solid variant — which
 * every real route renders — is covered below.
 */

/** Alpha channel of a computed colour string, handling both `rgba(r, g, b, a)`
 *  and the newer `rgb(r g b / a)` serialisations Chromium may emit. */
function alphaOf(colour: string): number {
  const nums = colour.match(/[\d.]+/g);
  if (!nums) return 1;
  return nums.length > 3 ? parseFloat(nums[3]) : 1;
}

function isVisibleColour(colour: string): boolean {
  return Boolean(colour) && colour !== 'transparent' && alphaOf(colour) > 0;
}

type BoxStyle = {
  borderBottomWidth: string;
  borderBottomStyle: string;
  borderBottomColor: string;
  borderLeftWidth: string;
  borderLeftStyle: string;
  borderLeftColor: string;
  color: string;
  textDecorationLine: string;
  textDecorationColor: string;
  afterContent: string;
  afterHeight: string;
  afterBackgroundColor: string;
  width: number;
};

/** Everything we need to reason about an element's borders/underline in one
 *  round-trip, so assertions can be written in Node against plain strings. */
async function boxStyleOf(locator: Locator): Promise<BoxStyle> {
  return locator.evaluate((el) => {
    const cs = getComputedStyle(el);
    const after = getComputedStyle(el, '::after');
    return {
      borderBottomWidth: cs.borderBottomWidth,
      borderBottomStyle: cs.borderBottomStyle,
      borderBottomColor: cs.borderBottomColor,
      borderLeftWidth: cs.borderLeftWidth,
      borderLeftStyle: cs.borderLeftStyle,
      borderLeftColor: cs.borderLeftColor,
      color: cs.color,
      textDecorationLine: cs.textDecorationLine,
      textDecorationColor: cs.textDecorationColor,
      afterContent: after.content,
      afterHeight: after.height,
      afterBackgroundColor: after.backgroundColor,
      width: el.getBoundingClientRect().width,
    };
  });
}

/**
 * The rendered colour of a nav item's underline, whichever way the theme
 * draws it. The design spec says "underline" without pinning a CSS property,
 * so accept the three ways that reads in a browser — a bottom border, a
 * decorated ::after bar, or text-decoration — and report which one won so a
 * failure message is diagnosable. Returns null when there is no visible
 * underline at all.
 */
function underlineColour(style: BoxStyle): { colour: string; source: string } | null {
  if (
    parseFloat(style.borderBottomWidth) > 0 &&
    style.borderBottomStyle !== 'none' &&
    isVisibleColour(style.borderBottomColor)
  ) {
    return { colour: style.borderBottomColor, source: 'border-bottom' };
  }
  if (
    style.afterContent !== 'none' &&
    parseFloat(style.afterHeight) > 0 &&
    isVisibleColour(style.afterBackgroundColor)
  ) {
    return { colour: style.afterBackgroundColor, source: '::after background' };
  }
  if (style.textDecorationLine.includes('underline') && isVisibleColour(style.textDecorationColor)) {
    return { colour: style.textDecorationColor, source: 'text-decoration' };
  }
  return null;
}

type FocusIndicator = {
  outlineStyle: string;
  outlineWidth: string;
  outlineColor: string;
  outlineOffset: string;
  boxShadow: string;
};

async function focusIndicatorOf(locator: Locator): Promise<FocusIndicator> {
  return locator.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      outlineStyle: cs.outlineStyle,
      outlineWidth: cs.outlineWidth,
      outlineColor: cs.outlineColor,
      outlineOffset: cs.outlineOffset,
      boxShadow: cs.boxShadow,
    };
  });
}

/**
 * "Is there a visible focus ring?" judged the way a reviewer would, without
 * assuming the property used: an outline with a real style/width/colour, OR
 * an equivalent box-shadow ring. §4 of the design system asks for a 2px
 * outline; a shadow-based ring satisfies the same NFR-1 intent, so either
 * passes and `outline: none` with no replacement fails.
 */
function hasVisibleFocusRing(i: FocusIndicator): boolean {
  const outline =
    i.outlineStyle !== 'none' && parseFloat(i.outlineWidth) > 0 && isVisibleColour(i.outlineColor);
  const shadow = i.boxShadow !== 'none' && i.boxShadow.trim() !== '' && isVisibleColour(i.boxShadow);
  return outline || shadow;
}

/**
 * Focus an element the way a keyboard user would. `:focus-visible` only
 * matches when the browser is in keyboard modality, which a bare
 * `locator.focus()` does not always establish — so Tab to the element for
 * real. If it sits beyond the tab budget we fall back to programmatic focus,
 * by which point the Tab presses have already put Chromium in keyboard
 * modality, so the ring still applies.
 */
async function focusViaKeyboard(page: Page, locator: Locator, maxTabs = 40): Promise<void> {
  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');
    if (await locator.evaluate((el) => el === document.activeElement)) return;
  }
  await locator.focus();
}

/**
 * Mark a nav link as the current page the way core/drupal.active-link does.
 * The primary menu placed on /user/login points at content routes, so none
 * of its links is ever genuinely current on this route — and per the file's
 * standing convention we test the shell against /user/login, not a content
 * route. Applying both markers core uses lets the current-section styling be
 * exercised regardless of which one the CSS keys off.
 */
async function markAsCurrent(locator: Locator): Promise<void> {
  await locator.evaluate((el) => {
    el.classList.add('is-active');
    el.setAttribute('aria-current', 'page');
  });
}

test.describe('page shell — header + footer', () => {
  test('header renders the badge, wordmark link and primary nav landmark', async ({ page }) => {
    await page.goto('/user/login');

    const header = page.locator('header.site-header');
    await expect(header).toBeVisible();
    await expect(header).toHaveAttribute('data-header-variant', 'solid');

    const wordmark = header.locator('a[rel="home"]');
    await expect(wordmark).toBeVisible();
    // The badge is inside the same link as the wordmark, so it's clickable
    // through to the front page too, not just the text.
    await expect(wordmark.locator('.site-badge')).toBeVisible();

    // The nav landmark is always in the DOM; it's only visually collapsed
    // behind the ☰ toggle below --bp-nav (760px), so check attachment, not
    // role-query visibility (hidden elements aren't exposed to getByRole).
    await expect(header.locator('nav.site-header__nav[aria-label="Primary"]')).toBeAttached();
  });

  test('wordmark and nav render uppercase', async ({ page }) => {
    await page.goto('/user/login');
    const header = page.locator('header.site-header');
    await expect(header.locator('.site-branding__name')).toHaveCSS('text-transform', 'uppercase');
    await expect(header.locator('nav.site-header__nav')).toHaveCSS('text-transform', 'uppercase');
  });

  test('the slogan shows on the solid header at desktop width', async ({ page }) => {
    // Pinned above --bp-nav (760px) explicitly: the project matrix includes
    // Pixel 5 / iPhone 12, whose default viewports are below the breakpoint
    // where the slogan is legitimately hidden.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/user/login');

    const header = page.locator('header.site-header');
    // Guard the premise: /user/login renders the solid variant, which is
    // exactly the variant that used to hide the slogan unconditionally.
    await expect(header).toHaveAttribute('data-header-variant', 'solid');

    const slogan = header.locator('.site-branding__slogan');
    // Corrected spec (INT8-027 §1): the slogan shows under the wordmark on
    // BOTH header variants at every desktop/tablet width — it is not a
    // homepage/transparent-only element.
    await expect(slogan).toBeVisible();
    await expect(slogan).toContainText(/modest mouse/i);
  });

  test('the slogan is hidden on the mobile toggle bar at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/user/login');

    // Below --bp-nav (760px) the bar has no room for it, so hiding is the
    // one place the slogan is still correctly absent. Not-visible rather
    // than not-attached: it may be display:none in the markup either way.
    await expect(page.locator('header.site-header .site-branding__slogan')).not.toBeVisible();
  });

  test('nav links change colour on hover', async ({ page }) => {
    await page.goto('/user/login');
    // Login's own always-present local-task link is a stable, non-test-data
    // link to exercise general <a> hover, independent of whatever's placed
    // in the primary-nav region.
    const link = page.locator('a[data-drupal-link-system-path="user/password"]').first();
    const before = await link.evaluate((el) => getComputedStyle(el).color);
    await link.hover();
    const after = await link.evaluate((el) => getComputedStyle(el).color);
    expect(after).not.toBe(before);
  });

  test('solid header: nav hover and current-section are visibly different treatments', async ({
    page,
  }) => {
    // Desktop width: the underline treatment under test is the desktop one
    // (the mobile panel uses a left-border accent instead), and the mobile
    // projects in the matrix default below 760px.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/user/login');

    const nav = page.locator('header.site-header nav.site-header__nav');
    const links = nav.locator('a');
    // Two items are needed so hover and current can be observed in the same
    // DOM snapshot — one hovered, a different one current. The primary menu
    // has several (FR-16 alone requires a Songs path).
    expect(await links.count()).toBeGreaterThanOrEqual(2);

    const hovered = links.nth(0);
    const current = links.nth(1);
    await markAsCurrent(current);

    await hovered.hover();

    const hoveredStyle = await boxStyleOf(hovered);
    const currentStyle = await boxStyleOf(current);

    const hoveredUnderline = underlineColour(hoveredStyle);
    const currentUnderline = underlineColour(currentStyle);

    // Both states draw an underline — hover is not "no underline", and the
    // current-section indicator is unchanged from INT8-015.
    expect(hoveredUnderline, `hovered nav link has no visible underline: ${JSON.stringify(hoveredStyle)}`).not.toBeNull();
    expect(currentUnderline, `current nav link has no visible underline: ${JSON.stringify(currentStyle)}`).not.toBeNull();

    // The point of INT8-027 §2: the two underlines must not be the same
    // colour, so "I am hovering this" never reads as "this is the section
    // I am in". Compared as resolved colours rather than token names so the
    // assertion survives any token indirection.
    expect(
      hoveredUnderline!.colour,
      `hover underline (${hoveredUnderline!.source}) must differ from current underline (${currentUnderline!.source})`,
    ).not.toBe(currentUnderline!.colour);

    // Per the design system: solid header — current = teal text + teal
    // underline; hover = teal text + Polo Blue underline. Expressed
    // relatively (underline vs the element's own text colour) so no hex is
    // hardcoded here, mirroring the tokens-only rule for the CSS itself.
    expect(currentUnderline!.colour, 'current: underline should match its teal text').toBe(currentStyle.color);
    expect(hoveredUnderline!.colour, 'hover: underline should be Polo Blue, not the teal text colour').not.toBe(
      hoveredStyle.color,
    );
    // …and hover keeps the same teal text as current — only the underline
    // distinguishes them.
    expect(hoveredStyle.color).toBe(currentStyle.color);
  });

  test('the active-link mechanism marks the current-page link', async ({ page }) => {
    await page.goto('/user/login');
    // core/drupal.active-link adds .is-active/aria-current="page" to links
    // matching the current path client-side; Drupal's own "Log in" local
    // task on the login page is a stable, always-present link to prove the
    // library is actually loaded and firing (core's default menu.html.twig
    // does no active-trail marking server-side at all).
    const loginTab = page.locator('a[data-drupal-link-system-path="user/login"]').first();
    await expect(loginTab).toHaveClass(/is-active/);
  });

  test('footer renders the secondary labels, copyright and disclaimer', async ({ page }) => {
    await page.goto('/user/login');

    const footer = page.locator('footer.site-footer');
    await expect(footer).toBeVisible();
    for (const label of ['About', 'Contact', 'Support', 'Legal', 'Privacy']) {
      await expect(footer.getByText(label, { exact: false })).toBeVisible();
    }
    await expect(footer.locator('.site-footer__copyright')).toContainText('Interstate-8');
    await expect(footer.getByText(/no way associated/i)).toBeVisible();
  });

  test('the wordmark link is keyboard-reachable with a visible focus ring', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/user/login');

    const wordmark = page.locator('header.site-header a[rel="home"]');
    await focusViaKeyboard(page, wordmark);
    await expect(wordmark).toBeFocused();

    // §4 names the logo link explicitly. Previously this test only proved
    // the element could take focus, which says nothing about whether a
    // sighted keyboard user can see where they are (NFR-1 / WCAG 2.4.7).
    const indicator = await focusIndicatorOf(wordmark);
    expect(hasVisibleFocusRing(indicator), `wordmark focus ring: ${JSON.stringify(indicator)}`).toBe(true);
  });

  test('a nav link shows a visible focus ring when tabbed to', async ({ page }) => {
    // Desktop width so the nav is expanded and in the tab order without
    // going through the toggle.
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/user/login');

    const navLink = page.locator('header.site-header nav.site-header__nav a').first();
    await focusViaKeyboard(page, navLink);
    await expect(navLink).toBeFocused();

    const indicator = await focusIndicatorOf(navLink);
    expect(hasVisibleFocusRing(indicator), `nav link focus ring: ${JSON.stringify(indicator)}`).toBe(true);
  });

  test('the mobile toggle button shows a visible focus ring when tabbed to', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/user/login');

    const toggle = page.getByRole('button', { name: /menu/i });
    await focusViaKeyboard(page, toggle);
    await expect(toggle).toBeFocused();

    const indicator = await focusIndicatorOf(toggle);
    expect(hasVisibleFocusRing(indicator), `toggle focus ring: ${JSON.stringify(indicator)}`).toBe(true);
  });

  test('the mobile nav toggle is keyboard-operable below 760px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/user/login');

    const toggle = page.getByRole('button', { name: /menu/i });
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  test('mobile nav toggle reveals the nav at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/user/login');

    const nav = page.locator('header.site-header nav.site-header__nav');
    const toggle = page.getByRole('button', { name: /menu/i });

    await expect(toggle).toBeVisible();
    await expect(nav).not.toBeVisible();
    await toggle.click();
    await expect(nav).toBeVisible();
  });

  test('the open mobile nav panel is full-width rows with dividers and a left-border current accent', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/user/login');

    const nav = page.locator('header.site-header nav.site-header__nav');
    const links = nav.locator('a');
    expect(await links.count()).toBeGreaterThanOrEqual(2);

    // Second item is marked current so the accent has something to attach
    // to; see markAsCurrent() for why it is simulated rather than routed.
    await markAsCurrent(links.nth(1));

    await page.getByRole('button', { name: /menu/i }).click();
    await expect(nav).toBeVisible();

    // A "row" is whatever element actually carries the row treatment — the
    // <a> itself or its single-link wrapper (<li>). Ancestors containing
    // more than one link (the <ul>, the nav) are excluded so a list-level
    // border is never mistaken for a per-row divider.
    const panel = await nav.evaluate((navEl) => {
      const navStyle = getComputedStyle(navEl);
      const contentWidth =
        navEl.getBoundingClientRect().width -
        parseFloat(navStyle.paddingLeft) -
        parseFloat(navStyle.paddingRight);

      const describe = (el: Element) => {
        const cs = getComputedStyle(el);
        return {
          borderBottomWidth: cs.borderBottomWidth,
          borderBottomStyle: cs.borderBottomStyle,
          borderBottomColor: cs.borderBottomColor,
          borderLeftWidth: cs.borderLeftWidth,
          borderLeftStyle: cs.borderLeftStyle,
          borderLeftColor: cs.borderLeftColor,
          width: el.getBoundingClientRect().width,
        };
      };

      return {
        contentWidth,
        rows: Array.from(navEl.querySelectorAll('a')).map((link) => {
          const chain: Element[] = [link];
          let node: Element | null = link.parentElement;
          while (node && node !== navEl) {
            if (node.querySelectorAll('a').length !== 1) break;
            chain.push(node);
            node = node.parentElement;
          }
          const styles = chain.map(describe);
          const outer = styles[styles.length - 1];
          return {
            text: (link.textContent ?? '').trim(),
            isCurrent: link.classList.contains('is-active') || link.getAttribute('aria-current') === 'page',
            width: outer.width,
            divider: styles.find((s) => parseFloat(s.borderBottomWidth) > 0 && s.borderBottomStyle !== 'none') ?? null,
            accent: styles.find((s) => parseFloat(s.borderLeftWidth) > 0 && s.borderLeftStyle !== 'none') ?? null,
          };
        }),
      };
    });

    expect(panel.rows.length).toBeGreaterThanOrEqual(2);

    // Full-width rows, not a gap-separated column of intrinsic-width links.
    for (const row of panel.rows) {
      expect(row.width, `row "${row.text}" should span the panel: ${row.width} of ${panel.contentWidth}`).toBeGreaterThanOrEqual(
        panel.contentWidth * 0.95,
      );
    }

    // A real 1px border between rows — visual spacing alone does not satisfy
    // "border-bottom:1px solid divider between rows". The last row is allowed
    // to omit it, so only the rows that have a following sibling are checked.
    for (const row of panel.rows.slice(0, -1)) {
      expect(row.divider, `row "${row.text}" has no divider border`).not.toBeNull();
      expect(isVisibleColour(row.divider!.borderBottomColor), `row "${row.text}" divider is transparent`).toBe(true);
    }

    const current = panel.rows.find((r) => r.isCurrent);
    expect(current, 'no current row found in the open panel').toBeTruthy();

    // Current item = 3px solid LEFT BORDER accent in the panel, replacing the
    // desktop underline treatment.
    expect(current!.accent, `current row "${current!.text}" has no left-border accent`).not.toBeNull();
    expect(parseFloat(current!.accent!.borderLeftWidth)).toBeGreaterThan(0);
    expect(
      isVisibleColour(current!.accent!.borderLeftColor),
      `current row accent colour is transparent: ${current!.accent!.borderLeftColor}`,
    ).toBe(true);

    // …and the accent is what distinguishes it: non-current rows must not
    // carry a left border, or it marks nothing.
    for (const row of panel.rows.filter((r) => !r.isCurrent)) {
      expect(row.accent, `non-current row "${row.text}" should not have a left-border accent`).toBeNull();
    }
  });

  test('has no serious or critical accessibility violations at desktop', async ({ page }) => {
    await page.goto('/user/login');
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });

  test('has no serious or critical accessibility violations at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('/user/login');
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''));
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
});
