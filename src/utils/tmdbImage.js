const BASE = "https://image.tmdb.org/t/p";

/** Widths TMDB actually serves per image kind — requesting others 404s. */
const WIDTHS = {
  poster: [154, 185, 342, 500, 780],
  backdrop: [300, 780, 1280],
  profile: [185, 632],
  still: [92, 185, 300],
  logo: [154, 185, 300, 500],
};

/**
 * Builds a `srcset` for a TMDB image path.
 *
 * Every image on the site used to request one fixed width regardless of how big
 * it rendered — the hero backdrop pulled `original`, which can be several MB.
 * Pairing this with a `sizes` attribute lets the browser pick a sensible file.
 */
export const srcSet = (path, kind = "poster") => {
  if (!path) return undefined;
  const widths = WIDTHS[kind] || WIDTHS.poster;
  return widths.map((w) => `${BASE}/w${w}${path} ${w}w`).join(", ");
};

/** Single-URL fallback for browsers (or code paths) that ignore srcset. */
export const imageUrl = (path, width = 500) => (path ? `${BASE}/w${width}${path}` : null);

/** Profile images are portraits; TMDB's largest profile size is h632. */
export const profileSrcSet = (path) =>
  path ? `${BASE}/w185${path} 185w, ${BASE}/h632${path} 421w` : undefined;

export default srcSet;
