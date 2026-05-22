import { useNavigate } from "react-router-dom";

const PlaylistCard = ({
  playlist: {
    id,
    title,
    itemCount = 0, // Fallback default value if not specified
    cover_path,    // A backdrop or poster image path from one of the items inside
  },
  className = "",
}) => {
  const navigate = useNavigate();

  // URL slug generation for clean routing to the individual playlist views
  const createSlug = (name, uid) => {
    const slug = (name || "unnamed-playlist")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return uid ? `${slug}-${uid}` : slug;
  };

  const handleClick = () => {
    navigate(`/playlist/${createSlug(title, id)}`);
  };

  return (
    <div className={`movie-card-new cursor-pointer ${className}`} onClick={handleClick}>
      
      {/* ── Playlist Image/Icon Wrap ── */}
      <div className="mcn-img-wrap relative aspect-[2/3] bg-zinc-900 border border-white/5 rounded-xl overflow-hidden shadow-md">
        {cover_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w500/${cover_path}`}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          /* Sleek alternative empty placeholder if playlist doesn't have an item backdrop yet */
          <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-indigo-950/40 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-indigo-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5-3.75h16.5m-16.5 7.5h16.5m-16.5 3.75h16.5" />
              </svg>
            </div>
          </div>
        )}

        {/* Hover overlay containing info details mirroring moviecard's look */}
        <div className="mcn-overlay absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <button className="mcn-play-btn p-3 bg-indigo-600 rounded-full text-white shadow-lg shadow-indigo-600/30" aria-label="Open Playlist">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Metadata / Description Footer ── */}
      <div className="mcn-info mt-3 px-1">
        <h3 className="mcn-title text-sm font-semibold text-gray-200 tracking-wide line-clamp-1 hover:text-white transition-colors">
          {title || "Untitled Playlist"}
        </h3>
        
        <div className="mcn-meta flex items-center gap-2 mt-1 text-xs font-medium text-zinc-500">
          <span className="mcn-lang bg-zinc-800/80 px-1.5 py-0.5 rounded text-[10px] text-zinc-400 font-bold border border-white/5 uppercase tracking-wider">
            List
          </span>
          <span className="mcn-year">
            {itemCount} {itemCount === 1 ? "video" : "videos"}
          </span>
        </div>
      </div>

    </div>
  );
};

export default PlaylistCard;