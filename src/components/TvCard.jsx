import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";

// Import TV show database services and playlist services
import { addTvToFavorites, removeTvFromFavorites } from "../firebase/useFirestore";
import { getUserPlaylists, createPlaylistAndAddItem, addItemToPlaylist } from "../firebase/useFirestore";

const TvCard = ({
  tvShow: {
    id,
    name, // TMDB native property for TV titles
    vote_average,
    poster_path,
    first_air_date, // TMDB native property for TV premiere dates
    original_language,
  },
  className = "",
}) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  // Playlist UI States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  // Sync real-time favorite status for this TV show from Firestore
  useEffect(() => {
    if (!currentUser) {
      setIsFavorite(false);
      return;
    }

    const userRef = doc(db, "users", currentUser.uid);
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const favs = userData.favoriteTvShows || [];
        setIsFavorite(favs.includes(Number(id)));
      } else {
        setIsFavorite(false);
      }
    }, (error) => {
      console.error("Snapshot error:", error);
      setIsFavorite(false);
    });

    return () => unsubscribe();
  }, [currentUser, id]);

  // Convert TV title + id to a slug
  const createSlug = (name, id) => {
    const slug = (name || "unknown")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // replaces spaces and symbols with -
      .replace(/(^-|-$)/g, ""); // trims starting/ending dashes
    return `${slug}-${id}`;
  };

  const handleClick = () => {
    navigate(`/tv/${createSlug(name, id)}`);
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation(); // Stops parent container layout navigation click
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      if (isFavorite) {
        await removeTvFromFavorites(currentUser.uid, id);
      } else {
        await addTvToFavorites(currentUser.uid, id);
      }
    } catch (error) {
      console.error("Error toggling favorite TV state:", error);
    }
  };

  // On-demand playlist loading when clicking the "+" button
  const handlePlaylistButtonClick = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Toggle dropdown
    if (isDropdownOpen) {
      setIsDropdownOpen(false);
      return;
    }

    setIsDropdownOpen(true);
    setIsLoadingPlaylists(true);
    try {
      const userLists = await getUserPlaylists(currentUser.uid);
      setPlaylists(userLists);
    } catch (err) {
      console.error("Failed to load user playlists", err);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  // Package the current item data (Set type to "tv" and title reference to name)
  const currentItemPayload = {
    id: Number(id),
    type: "tv",
    title: name,
    poster_path: poster_path
  };

  const handleSelectExistingPlaylist = async (e, playlistId) => {
    e.stopPropagation();
    try {
      await addItemToPlaylist(currentUser.uid, playlistId, currentItemPayload);
      setIsDropdownOpen(false);
      alert(`Added to playlist!`);
    } catch (error) {
      console.error("Error saving to playlist", error);
    }
  };

  const handleOpenCreateModal = (e) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleCreatePlaylistSubmit = async (e) => {
    e.stopPropagation();
    if (!newPlaylistName.trim()) return;

    try {
      await createPlaylistAndAddItem(currentUser.uid, newPlaylistName.trim(), currentItemPayload);
      setNewPlaylistName("");
      setIsModalOpen(false);
      alert(`Playlist created and TV show added!`);
    } catch (error) {
      console.error("Error creating new playlist", error);
    }
  };

  const year = first_air_date ? first_air_date.split("-")[0] : null;
  const lang = original_language === "en" ? "EN" : original_language?.toUpperCase();

  return (
    <>
      <div className={`movie-card-new relative ${className}`} onClick={handleClick}>

        {/* ── Poster image wrap ── */}
        <div className="mcn-img-wrap relative">
          <img
            src={poster_path ? `https://image.tmdb.org/t/p/w500${poster_path}` : "no-movie.png"}
            alt={name}
            loading="lazy"
          />

          {/* Hover overlay: rating left, controls right */}
          <div className="mcn-overlay">
            <div className="mcn-overlay-inner">
              
              {/* Vote/Rating Counter (Now on Left Side) */}
              {vote_average > 0 && (
                <span className="mcn-rating">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#facc15" className="w-5 h-5 shrink-0">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                  </svg>
                  {vote_average.toFixed(1)}
                </span>
              )}

              {/* Controls Cluster (Now on Right Side via ml-auto) */}
              <div className="flex items-center gap-2 ml-auto">
                {/* Playlist Addition Plus Button */}
                <button 
                  onClick={handlePlaylistButtonClick}
                  className="w-8 h-8 rounded-full bg-zinc-900/80 hover:bg-indigo-600 text-gray-300 hover:text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm"
                  aria-label="Add to Playlist"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>

                {/* Heart Favorite Button */}
                <button 
                  onClick={handleFavoriteClick}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm ${
                    isFavorite 
                      ? "bg-rose-600/90 border-rose-500 text-white" 
                      : "bg-zinc-900/80 border-white/10 text-gray-300 hover:text-rose-400"
                  }`}
                  aria-label="Favorite TV Show"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill={isFavorite ? "currentColor" : "none"} 
                    stroke="currentColor" 
                    strokeWidth={2} 
                    className="w-4 h-4"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                </button>

                {/* Watch Details Play Button */}
                <button className="mcn-play-btn" aria-label="Watch">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

            </div>
          </div>

          {/* ── Dropdown Options Menu (Centered relative to the entire TV card wrapper) ── */}
          {isDropdownOpen && (
            <>
              {/* Back-layer overlay click catcher */}
              <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); }} />
              
              {/* Centered perfectly using left-1/2 and -translate-x-1/2 */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-14 z-50 w-48 rounded-md bg-zinc-900 border border-zinc-800 p-1 shadow-xl text-left" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={handleOpenCreateModal}
                  className="flex w-full items-center gap-2 rounded px-3 py-2 text-xs font-medium text-indigo-400 hover:bg-zinc-800 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Make a new playlist
                </button>

                {playlists.length > 0 && <div className="my-1 border-t border-zinc-800" />}

                <div className="max-h-32 overflow-y-auto custom-scrollbar">
                  {isLoadingPlaylists ? (
                    <p className="px-3 py-1.5 text-[11px] text-zinc-500">Loading lists...</p>
                  ) : (
                    playlists.map((list) => (
                      <button
                        key={list.id}
                        onClick={(e) => handleSelectExistingPlaylist(e, list.id)}
                        className="block w-full truncate rounded px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                      >
                        {list.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {/* Top-right type badge */}
          <span className="mcn-type-badge mcn-type-badge-tv">TV Show</span>
        </div>

        {/* ── Info below poster ── */}
        <div className="mcn-info">
          <p className="mcn-title">{name}</p>
          <div className="mcn-meta">
            {year && <span>{year}</span>}
            {year && lang && <span className="text-gray-600">•</span>}
            {lang && <span>{lang}</span>}
          </div>
        </div>
      </div>

      {/* ── Playlist Creation Modal (Floating Window) ── */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }}
        >
          <div 
            className="w-full max-w-sm rounded-xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl modal-animation"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-2">Create New Playlist</h3>
            <p className="text-xs text-zinc-400 mb-4">Enter a name for your playlist. This TV show will be added automatically.</p>
            
            <input
              type="text"
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="e.g., Weekend Binge"
              className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors mb-5"
            />

            <div className="flex justify-end gap-2 text-sm">
              <button
                onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }}
                className="px-4 py-2 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylistSubmit}
                disabled={!newPlaylistName.trim()}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TvCard;