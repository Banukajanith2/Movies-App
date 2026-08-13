import { useNavigate } from "react-router-dom";

const PlaylistCard = ({
  playlist: {
    id,
    name,
    items = [],
  },
  className = "",
  onClick,
}) => {
  const navigate = useNavigate();

  const firstItem = items.length > 0 ? items[0] : null;
  const posterPath = firstItem?.poster_path;
  const itemCount = items.length;

  const createSlug = (text, uid) => {
    const slug = (text || "unnamed-playlist")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return `${slug}-${uid}`;
  };

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else {
      navigate(`/playlist/${createSlug(name, id)}`);
    }
  };

  return (
    <div className={`movie-card-new cursor-pointer ${className}`} onClick={handleClick}>

      {/* ── Poster image wrap ── */}
      <div className="mcn-img-wrap relative">
        <img
          src={posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : "no-movie.png"}
          alt={name}
          loading="lazy"
        />

        {/* Updated: Uses theme-aware brand colors */}
        <span className="mcn-type-badge bg-brand-primary/90 text-white border-none">
          Playlist
        </span>
      </div>

      {/* ── Info below poster ── */}
      <div className="mcn-info">
        {/* Updated: Uses theme-aware brand-text */}
        <p className="mcn-title truncate text-brand-text font-medium">{name}</p>
        
        {/* Updated: Uses theme-aware muted text */}
        <div className="mcn-meta text-muted text-xs mt-1">
          <span>
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </div>
      </div>

    </div>
  );
};

export default PlaylistCard;