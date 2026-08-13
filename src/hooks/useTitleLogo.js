import { useEffect, useState } from "react";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";

/**
 * Module-level cache keyed by "type:id". The hero carousel mounts every slide at
 * once (and Swiper's loop mode duplicates them), so without this the home page
 * would refetch the same logos several times over.
 * `null` is a cached "this title has no logo" answer, so we don't retry it.
 */
const cache = new Map();

/**
 * Picks the best logo: English first, then language-neutral, then by TMDB's own
 * vote average. `include_image_language=en,null` already narrows the response to
 * those two, so this is mostly choosing between good candidates.
 */
const pickLogo = (logos = []) => {
  if (logos.length === 0) return null;
  const langScore = (l) => (l.iso_639_1 === "en" ? 2 : l.iso_639_1 === null ? 1 : 0);
  return [...logos].sort(
    (a, b) => langScore(b) - langScore(a) || (b.vote_average || 0) - (a.vote_average || 0)
  )[0];
};

/**
 * SVG logos must be served from /original — TMDB's width-prefixed paths only
 * apply to raster images.
 */
const buildUrl = (filePath) =>
  filePath.toLowerCase().endsWith(".svg")
    ? `https://image.tmdb.org/t/p/original${filePath}`
    : `https://image.tmdb.org/t/p/w500${filePath}`;

/**
 * Fetches a title's logo treatment — the stylised wordmark streaming services
 * show over artwork instead of typed text. Returns null when the title has none,
 * which is common for older or less popular entries.
 */
export const useTitleLogo = (id, mediaType = "movie") => {
  const type = mediaType?.toLowerCase() === "tv" ? "tv" : "movie";
  const key = `${type}:${id}`;

  const [logo, setLogo] = useState(() => (cache.has(key) ? cache.get(key) : null));

  useEffect(() => {
    if (!id) return;

    if (cache.has(key)) {
      setLogo(cache.get(key));
      return;
    }

    let cancelled = false;

    const fetchLogo = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/${type}/${id}/images?include_image_language=en,null`,
          API_OPTIONS
        );
        if (!response.ok) throw new Error("Failed to fetch images");

        const data = await response.json();
        const best = pickLogo(data.logos);
        const result = best
          ? { url: buildUrl(best.file_path), aspectRatio: best.aspect_ratio }
          : null;

        cache.set(key, result);
        if (!cancelled) setLogo(result);
      } catch (error) {
        console.error("Error fetching title logo:", error);
        cache.set(key, null);
      }
    };

    fetchLogo();
    return () => {
      cancelled = true;
    };
  }, [id, type, key]);

  return logo;
};

export default useTitleLogo;
