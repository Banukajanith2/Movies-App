import { useState } from "react";
import { useTitleLogo } from "../hooks/useTitleLogo";

/**
 * Renders a title's logo treatment over artwork, falling back to plain text.
 *
 * Only use this where there's a dark backdrop behind it — logo art is nearly
 * always white with transparency, so it would vanish against the light theme's
 * page background. Text stays the right choice in the metadata blocks.
 *
 * The text renders immediately and is swapped for the image once it decodes, so
 * the title is never missing while the request is in flight.
 */
const TitleLogo = ({ id, mediaType, title, textClassName = "", logoClassName = "" }) => {
  const logo = useTitleLogo(id, mediaType);
  const [loaded, setLoaded] = useState(false);

  if (!logo) return <span className={textClassName}>{title}</span>;

  return (
    <>
      {!loaded && <span className={textClassName}>{title}</span>}
      <img
        src={logo.url}
        alt={title}
        className={`title-logo ${logoClassName} ${loaded ? "is-loaded" : "is-pending"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(false)}
        loading="lazy"
        draggable="false"
      />
    </>
  );
};

export default TitleLogo;
