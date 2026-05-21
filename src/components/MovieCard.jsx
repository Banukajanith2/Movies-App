import { useNavigate } from "react-router-dom";

const MovieCard = ({
  movie: {
    id,
    title,
    vote_average,
    poster_path,
    release_date,
    original_language,
  },
  className = "",
}) => {
  const navigate = useNavigate();

  const createSlug = (title, id) => {
    const slug = (title || "unknown")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return `${slug}-${id}`;
  };

  const handleClick = () => {
    navigate(`/movie/${createSlug(title, id)}`);
  };

  const year = release_date ? release_date.split("-")[0] : null;
  const lang = original_language === "en" ? "EN" : original_language?.toUpperCase();

  return (
    <div className={`movie-card-new ${className}`} onClick={handleClick}>

      {/* ── Poster image wrap ── */}
      <div className="mcn-img-wrap">
        <img
          src={poster_path ? `https://image.tmdb.org/t/p/w500/${poster_path}` : "no-movie.png"}
          alt={title}
          loading="lazy"
        />

        {/* Hover overlay: rating left, play button right */}
        <div className="mcn-overlay">
          <div className="mcn-overlay-inner">
            {vote_average > 0 && (
              <span className="mcn-rating">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#facc15" className="w-5 h-5 shrink-0">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                </svg>
                {vote_average.toFixed(1)}
              </span>
            )}
            <button className="mcn-play-btn" aria-label="Watch">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Top-right type badge */}
        <span className="mcn-type-badge">Movie</span>
      </div>

      {/* ── Info below poster ── */}
      <div className="mcn-info">
        <p className="mcn-title">{title}</p>
        <div className="mcn-meta">
          {year && <span>{year}</span>}
          {year && lang && <span className="text-gray-600">•</span>}
          {lang && <span>{lang}</span>}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
