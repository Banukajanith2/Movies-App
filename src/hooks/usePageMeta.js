import { useEffect } from "react";

const DEFAULT_TITLE = "EZ Movies - Watch HD Movies & TV Shows Online";
const DEFAULT_DESCRIPTION =
  "Discover and watch trending movies & tv shows in HD quality. Stream your favorite films online anytime, anywhere with EZ Movies.";

/** Absolute URL for the site's fallback share image. */
const defaultImage = () =>
  `${window.location.origin}${import.meta.env.BASE_URL}preview.jpg`;

/**
 * Upserts a <meta> tag, remembering whether we created it so the cleanup pass can
 * remove ours and restore whatever index.html shipped with.
 */
const setMeta = (attr, key, content, created) => {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
    created.push(el);
  } else if (!el.dataset.originalContent) {
    el.dataset.originalContent = el.getAttribute("content") ?? "";
  }
  el.setAttribute("content", content);
};

const setLink = (rel, href, created) => {
  if (!href) return;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
    created.push(el);
  }
  el.setAttribute("href", href);
};

/**
 * Per-page title, description, canonical URL, Open Graph / Twitter cards and
 * optional schema.org JSON-LD.
 *
 * Caveat worth knowing: this runs on the client. Google renders JS and will see
 * it, but most link-preview scrapers (Discord, WhatsApp, Twitter, Facebook,
 * Telegram) read the raw HTML and will keep showing the defaults from index.html.
 * Fixing those requires prerendering at build time or an SSR/edge host — see
 * README notes. Everything here is the prerequisite for either of those.
 *
 * @param {object}  meta
 * @param {string}  meta.title        Page title (site name is appended)
 * @param {string}  meta.description  ~155 char summary
 * @param {string}  meta.image        Absolute image URL (TMDB backdrop works well)
 * @param {string}  meta.type         Open Graph type — "website" or "video.movie"
 * @param {object}  meta.jsonLd       schema.org object, injected as JSON-LD
 */
export const usePageMeta = ({ title, description, image, type = "website", jsonLd } = {}) => {
  const json = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    const created = [];
    const fullTitle = title ? `${title} • EZ Movies` : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESCRIPTION;
    const img = image || defaultImage();
    const url = window.location.href;

    document.title = fullTitle;

    setMeta("name", "description", desc, created);
    setLink("canonical", url, created);

    setMeta("property", "og:title", fullTitle, created);
    setMeta("property", "og:description", desc, created);
    setMeta("property", "og:image", img, created);
    setMeta("property", "og:url", url, created);
    setMeta("property", "og:type", type, created);
    setMeta("property", "og:site_name", "EZ Movies", created);

    setMeta("name", "twitter:card", "summary_large_image", created);
    setMeta("name", "twitter:title", fullTitle, created);
    setMeta("name", "twitter:description", desc, created);
    setMeta("name", "twitter:image", img, created);
    setMeta("name", "twitter:url", url, created);

    let script = null;
    if (json) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = json;
      document.head.appendChild(script);
    }

    return () => {
      document.title = DEFAULT_TITLE;
      created.forEach((el) => el.remove());
      // Restore the content of tags that already existed in index.html
      document.head.querySelectorAll("meta[data-original-content]").forEach((el) => {
        el.setAttribute("content", el.dataset.originalContent);
        delete el.dataset.originalContent;
      });
      script?.remove();
    };
  }, [title, description, image, type, json]);
};

export default usePageMeta;
