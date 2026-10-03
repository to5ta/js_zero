/**
 * Shared look for every on-screen control: dark forged iron with a thin brass
 * edge, so the overlay reads as part of the world rather than as a web page on
 * top of it.
 *
 * Icons are inline SVG silhouettes. Emoji were the previous approach and they
 * render differently on every platform, carry their own colour, and cannot be
 * tinted to match a pressed state.
 */

export const Theme = {
    iron: '#1b1916',
    ironRaised: '#272320',
    ironPressed: '#3a332b',
    brass: '#c6a05e',
    brassBright: '#f0d9a4',
    edge: 'rgba(198, 160, 94, 0.38)',
    edgeSoft: 'rgba(198, 160, 94, 0.18)',
    text: '#e8dfcc',
    shadow: '0 2px 10px rgba(0, 0, 0, 0.45)',
} as const;

/** Bottom inset so controls clear the home indicator on notched phones. */
export const SAFE_BOTTOM = 'env(safe-area-inset-bottom, 0px)';

type IconName = 'move' | 'look' | 'jump' | 'action' | 'fullscreen' | 'fullscreenExit' | 'debug';

const PATHS: Record<IconName, string> = {
    // compass rose
    move: 'M12 2.5 14 10l7.5 2-7.5 2-2 7.5-2-7.5L2.5 12 10 10z',
    // eye
    look: 'M12 5c-5 0-9 4.2-9 7s4 7 9 7 9-4.2 9-7-4-7-9-7zm0 10.2A3.2 3.2 0 1 1 12 8.8a3.2 3.2 0 0 1 0 6.4z',
    // chevron over a ground line
    jump: 'M12 3 4.8 11h4.4v5h5.6v-5h4.4zM4 19.5h16V22H4z',
    // a block with an arrow, for pick up and set down
    action: 'M12 2 3.5 6.5v11L12 22l8.5-4.5v-11zm0 2.6 5.8 3.1L12 10.8 6.2 7.7zM5.5 9.4l5.5 2.9v6.5l-5.5-2.9zm13 0v6.5L13 18.8v-6.5z',
    fullscreen: 'M3 3h7v2.4H5.4V10H3zm11 0h7v7h-2.4V5.4H14zM3 14h2.4v4.6H10V21H3zm15.6 0H21v7h-7v-2.4h4.6z',
    fullscreenExit: 'M10 3h2.4v7H5.4V7.6H10zM21 3v2.4h-4.6V10H14V3zM3 14h7v7H7.6v-4.6H3zm11 0h7v2.4h-4.6V21H14z',
    // sliders, for the debug overlay. Calipers read as two bare bars at 18px.
    debug: 'M3 5.8h7.2v2.4H3zm11.6 0H21v2.4h-6.4zM3 15.8h6.4v2.4H3zm10.8 0H21v2.4h-7.2zM12.4 3.4h2.4v7.2h-2.4zM9.2 13.4h2.4v7.2H9.2z',
};

/**
 * An icon sized to its button. `currentColor` lets the button tint it on press
 * without rebuilding the markup.
 */
export function icon(name: IconName, size = 22): string {
    return (
        `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" ` +
        `style="display:block;pointer-events:none">` +
        `<path d="${PATHS[name]}" fill="currentColor"/></svg>`
    );
}

/** The common surface: dark plate, hairline brass edge, legible on any level. */
export function applyIronSurface(el: HTMLElement, radius = '10px'): void {
    el.style.background = Theme.ironRaised;
    el.style.border = `1px solid ${Theme.edge}`;
    el.style.borderRadius = radius;
    el.style.color = Theme.text;
    el.style.boxShadow = Theme.shadow;
    el.style.backdropFilter = 'blur(2px)';
}
