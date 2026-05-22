import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { addMovieToFavorites, removeMovieFromFavorites } from "../firebase/useFirestore";

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
  const { currentUser } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  // 1. Real-time active favorite tracking for this specific movie card instance
  useEffect(() => {
  // CRITICAL FALLBACK: If there's no logged-in user, immediately reset state to false
  if (!currentUser) {
    setIsFavorite(false);
    return;
  }

    const userRef = doc(db, "users", currentUser.uid);
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const favs = userData.favoriteMovies || [];
        setIsFavorite(favs.includes(Number(id)));
      } else {
        // CRITICAL FALLBACK: If the document doesn't exist in Firestore yet for this new user,
        // explicitly reset the favorite visual state so it doesn't leak from the old user.
        setIsFavorite(false);
      }
    }, (error) => {
      console.error("Snapshot error:", error);
      setIsFavorite(false);
    });

    return () => unsubscribe();
  }, [currentUser, id]); // Listens intently to changes in user profile switching

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

  // 2. Trapped action handler for Favorite toggle
  const handleFavoriteClick = async (e) => {
    e.stopPropagation(); // Prevents page navigation when clicking the heart icon
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      if (isFavorite) {
        await removeMovieFromFavorites(currentUser.uid, id);
      } else {
        await addMovieToFavorites(currentUser.uid, id);
      }
    } catch (error) {
      console.error("Error toggling favorite movie state:", error);
    }
  };

  // 3. Trapped action handler for Playlist inclusion placeholder
  const handlePlaylistClick = (e) => {
    e.stopPropagation(); // Stops card layout click trigger
    if (!currentUser) {
      navigate("/login");
      return;
    }
    // Placeholder function where you can invoke your playlist selector modal later
    console.log(`Add movie ${id} to a custom user playlist collection`);
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

        {/* Hover overlay: rating left, controls right */}
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
            
            {/* Control Panel Cluster stacked above/around the play interface */}
            <div className="flex items-center gap-2">
              {/* Playlist Addition Plus Button */}
              <button 
                onClick={handlePlaylistClick}
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
                aria-label="Favorite Movie"
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

              {/* Standard Play Details Anchor Hook Link Trigger Button */}
              <button className="mcn-play-btn" aria-label="Watch">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
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