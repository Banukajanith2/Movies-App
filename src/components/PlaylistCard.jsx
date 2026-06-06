import { useNavigate } from "react-router-dom";

const PlaylistCard = ({
  playlist: {
    id,
    name,
    items = [], // Array of saved movies/TV shows
  },
  className = "",
  onClick, // 1. Accepted the custom click callback from parent components
}) => {
  const navigate = useNavigate();

  // Extract the poster from the first item in the playlist array (if it exists)
  const firstItem = items.length > 0 ? items[0] : null;
  const posterPath = firstItem?.poster_path;

  // Count total items inside the collection
  const itemCount = items.length;

  // Convert playlist name + id to a clean URL slug structure
  const createSlug = (text, uid) => {
    const slug = (text || "unnamed-playlist")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return `${slug}-${uid}`;
  };

  const handleClick = (e) => {
    if (onClick) {
      // 2. Intercept navigation and use parent inline layout toggler instead
      onClick(e);
    } else {
      // Fallback: Navigates to your standalone PlaylistPage route
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

        {/* Top-right identity badge */}
        <span className="mcn-type-badge bg-indigo-600/90 text-white border-none">
          Playlist
        </span>
      </div>

      {/* ── Info below poster (Matches title and year layout) ── */}
      <div className="mcn-info">
        <p className="mcn-title truncate text-white font-medium">{name}</p>
        <div className="mcn-meta text-zinc-400 text-xs mt-1">
          <span>
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </div>
      </div>

    </div>
  );
};

export default PlaylistCard;