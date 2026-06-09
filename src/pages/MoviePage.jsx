import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";

import { 
  addMovieToFavorites, 
  removeMovieFromFavorites, 
  getUserPlaylists, 
  createPlaylistAndAddItem, 
  addItemToPlaylist 
} from "../firebase/useFirestore";

import Spinner from "../components/Spinner";
import Navbar from "../components/Navbar";
import TrailerButton from "../components/TrailerButton";
import ImdbButton from "../components/ImdbButton";
import MediaSlider, { ENDPOINTS } from "../components/MediaSlider.jsx";
import Footer from "../components/Footer";

// ── Streaming Servers ──
// Each server is a free embed provider. Add/remove as needed.
// They're tried in order — if one is down, the user picks another.
const SERVERS = [
  {
    name: "VidSrc",
    label: "VidSrc",
    url: (id) => `https://vidsrcme.ru/embed/movie?tmdb=${id}`,
  },
  {
    name: "EmbosTop",
    label: "EmbosTop",
    url: (id) => `https://embos.top/movie/?mid=${id}`,
  },
  {
    name: "VidSrc 2",
    label: "VidSrc 2",
    url: (id) => `https://vidsrc.to/embed/movie/${id}`,
  },
  {
    name: "VidKing",
    label: "VidKing",
    url: (id) => `https://www.vidking.net/embed/movie/${id}`,
  },
  {
    name: "2Embed",
    label: "2Embed",
    url: (id) => `https://www.2embed.cc/embed/${id}`,
  },
  {
    name: "MultiEmbed",
    label: "MultiEmbed",
    url: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
  },
  {
    name: "VidPlus",
    label: "VidPlus",
    url: (id) => `https://player.vidplus.to/embed/movie/${id}`,
  },
  {
    name: "Vid Easy",
    label: "Vid Easy",
    url: (id) => `https://player.videasy.net/movie/${id}`,
  },
  
];

const MoviePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Movie Details States
  const [movie, setMovie] = useState(null);
  const [pageloading, setPageLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);

  // Server Selection
  const [activeServer, setActiveServer] = useState(0);

  // Firestore Syncing & UI States
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  const movieId = slug?.split("-").pop();

  // 1. Fetch Movie Details
  useEffect(() => {
    if (!movieId) return;
    const fetchMovieDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/movie/${movieId}`, API_OPTIONS);
        if (!response.ok) throw new Error("Movie fetch failed");
        const data = await response.json();
        setMovie(data);
      } catch (error) {
        console.error("Error fetching movie details:", error);
        navigate("/404-Error");
      } finally {
        setPageLoading(false);
      }
    };
    fetchMovieDetails();
  }, [movieId, navigate]);

  // 2. Real-time active favorite tracking
  useEffect(() => {
    if (!currentUser || !movie?.id) {
      setIsFavorite(false);
      return;
    }

    const userRef = doc(db, "users", currentUser.uid);
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const favs = userData.favoriteMovies || [];
        setIsFavorite(favs.includes(Number(movie.id)));
      } else {
        setIsFavorite(false);
      }
    }, (error) => {
      console.error("Snapshot error:", error);
      setIsFavorite(false);
    });

    return () => unsubscribe();
  }, [currentUser, movie?.id]);

  // Reset server selection when movie changes
  useEffect(() => {
    setActiveServer(0);
    setShowPlayer(false);
  }, [movieId]);

  if (pageloading)
    return (
      <div className="fixed inset-0 bg-brand-bg flex items-center justify-center z-[9999]">
        <Spinner />
      </div>
    );

  if (!movie) {
    navigate("/404-Error");
    return null;
  }

  // Data processing for standard uniform payload structure
  const year = movie.release_date ? movie.release_date.split("-")[0] : null;
  const lang = movie.original_language === "en" ? "EN" : movie.original_language?.toUpperCase();

  const currentItemPayload = {
    id: Number(movie.id),
    type: "movie",
    title: movie.title,
    poster_path: movie.poster_path,
    year: year,
    rating: Number(movie.vote_average),
    language: lang
  };

  // ── Action Handlers ──
  const handleFavoriteClick = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    try {
      if (isFavorite) {
        await removeMovieFromFavorites(currentUser.uid, movie.id);
      } else {
        await addMovieToFavorites(currentUser.uid, movie.id);
      }
    } catch (error) {
      console.error("Error toggling favorite movie state:", error);
    }
  };

  const handlePlaylistButtonClick = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
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

  const handleSelectExistingPlaylist = async (playlistId) => {
    try {
      await addItemToPlaylist(currentUser.uid, playlistId, currentItemPayload);
      setIsDropdownOpen(false);
      alert(`Added to playlist!`);
    } catch (error) {
      console.error("Error saving to playlist", error);
    }
  };

  const handleOpenCreateModal = () => {
    setIsDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleCreatePlaylistSubmit = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    try {
      await createPlaylistAndAddItem(currentUser.uid, newPlaylistName.trim(), currentItemPayload);
      setNewPlaylistName("");
      setIsModalOpen(false);
      alert(`Playlist created and movie added!`);
    } catch (error) {
      console.error("Error creating new playlist", error);
    }
  };

  const handlePlayClick = () => {
    setShowPlayer(true);
  };

  const handleServerChange = (index) => {
    setActiveServer(index);
  };

  return (
    <div className="relative bg-brand-bg min-h-screen">
      <Navbar />

      <div className="movie fade-in pt-20">

        {/* ── Backdrop / Player + Server Panel ── */}
        {/* 'relative' here lets the server panel hang outside via absolute positioning */}
        <div className="animate-slide-up relative">

          {/* Backdrop / Player Area — never changes width */}
          <div
            className="backdrop"
            onClick={!showPlayer ? handlePlayClick : undefined}
          >
            {showPlayer ? (
              <div className="player">
                <iframe
                  key={activeServer} // remounts iframe on server change
                  className="iframe"
                  src={SERVERS[activeServer].url(movie.id)}
                  referrerPolicy="origin"
                  allowFullScreen
                />
              </div>
            ) : (
              <>
                <img
                  className="backdrop-img"
                  src={
                    movie.backdrop_path
                      ? `https://image.tmdb.org/t/p/w500/${movie.backdrop_path}`
                      : "no-movie.png"
                  }
                  alt={movie.title}
                />
                <svg
                  className="play-icon"
                  onClick={handlePlayClick}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z"
                    clipRule="evenodd"
                  />
                </svg>
              </>
            )}
          </div>

          {/* ── Server Panel (visible only after play) ── */}
          {/* Sits outside the player: absolute at top-0, left: 100% pushes it into the right page margin */}
          {showPlayer && (
            <div
              className="server-panel bg-brand-bg border border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col"
              style={{
                position: "absolute",
                top: "0",
                left: "100%",
                width: "200px",
                minWidth: "200px",
                animation: "serverPanelSlideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            >
              {/* Panel Header */}
              <div className="px-4 pt-4 pb-2">
                <p className="text-[12px] font-semibold tracking-widest uppercase text-brand-text select-none">
                  Server
                </p>
              </div>

              {/* Server List — scrollable, max 5 visible */}
              <div
                className="overflow-y-auto flex flex-col gap-1 px-2 pb-3 custom-scrollbar"
                style={{ maxHeight: "calc(5 * 44px)" }}
              >
                {SERVERS.map((server, index) => (
                  <label
                    key={index}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 select-none ${
                      activeServer === index
                        ? "bg-indigo-600 text-white"
                        : "text-brand-text hover:bg-zinc-100 dark:hover:bg-zinc-800/70"
                    }`}
                  >
                    {/* Custom Radio Dial */}
                    <span
                      className={`relative flex-shrink-0 w-[15px] h-[15px] rounded-full border-2 transition-all duration-150 ${
                        activeServer === index
                          ? "border-white"
                          : "border-zinc-400 dark:border-zinc-600"
                      }`}
                    >
                      {activeServer === index && (
                        <span className="absolute inset-[3px] rounded-full bg-white" />
                      )}
                    </span>

                    <input
                      type="radio"
                      name="server"
                      className="sr-only"
                      checked={activeServer === index}
                      onChange={() => handleServerChange(index)}
                    />

                    <span className="text-[12px] font-medium leading-tight truncate">
                      {server.label}
                    </span>
                  </label>
                ))}
              </div>

              {/* Hint */}
              <p className="px-4 pb-4 pt-4 text-[12px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
                Switch server if video won't load.
              </p>
            </div>
          )}
        </div>

        {/* Poster + Info */}
        <div className="poster-and-info animate-slide-up">
          <div className="poster">
            <img
              className="poster-img"
              src={movie.poster_path ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}` : "no-movie.png"}
              alt={movie.title}
            />
          </div>
          
          {/* Movie Info */}
          <div className="movie-info text-brand-text">
            <h2 className="mb-3 text-brand-text">{movie.title}</h2>
            <p className="mb-4 overflow-y-scroll text-muted">{movie.overview}</p>
            <p><strong>Release Date :</strong> <span className="text-muted">{movie.release_date}</span></p>
            <p><strong>IMDb :</strong> <span className="text-muted">{movie.vote_average?.toFixed(1) || "N/A"}/10</span></p>
            <p><strong>Language :</strong> <span className="text-muted">{movie.original_language === "en" ? "English" : movie.spoken_languages?.[0]?.english_name || movie.original_language}</span></p>
            <p><strong>Genre :</strong> <span className="text-muted">{movie.genres?.map((genre, key) => (
              <span key={key}>{genre.name}{key < movie.genres.length - 1 ? ", " : ""}</span>
            ))}</span></p>
            
            {/* Action Bar Container */}
            <div className="flex items-center flex-wrap gap-3 mt-4 relative">
              <TrailerButton id={movie.id} mediaType="movie" />
              <ImdbButton id={movie.id} mediaType="movie" />

              {/* ── Favorite Button (Fixed Dimensions & Shape) ── */}
              <button 
                onClick={handleFavoriteClick}
                className={`h-[40px] w-[40px] shrink-0 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer backdrop-blur-sm ${
                  isFavorite 
                    ? "bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-600/20" 
                    : "bg-zinc-900/80 border-zinc-800 text-gray-300 hover:text-rose-400 hover:border-zinc-700"
                }`}
                aria-label="Favorite Movie"
                title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill={isFavorite ? "currentColor" : "none"} 
                  stroke="currentColor" 
                  strokeWidth={2} 
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
              </button>

              {/* ── Playlist Button Anchor Context ── */}
              <div className="relative flex items-center justify-center">
                <button 
                  onClick={handlePlaylistButtonClick}
                  className={`h-[40px] w-[40px] shrink-0 rounded-full text-gray-300 hover:text-white border flex items-center justify-center transition-all duration-200 cursor-pointer backdrop-blur-sm ${
                    isDropdownOpen 
                      ? "bg-indigo-600 border-indigo-500 text-white" 
                      : "bg-zinc-900/80 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700"
                  }`}
                  aria-label="Add to Playlist"
                  title="Add to Playlist"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>

                {/* ── Playlist Dropdown Menu ── */}
                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                    
                    <div className="absolute left-0 top-12 mt-1 z-50 w-52 rounded-lg bg-zinc-900 border border-zinc-800 p-1 shadow-2xl text-left animate-fade-in">
                      <button
                        onClick={handleOpenCreateModal}
                        className="flex w-full items-center gap-2 rounded px-3 py-2.5 text-xs font-semibold text-indigo-400 hover:bg-zinc-800 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Make a new playlist
                      </button>

                      {playlists.length > 0 && <div className="my-1 border-t border-zinc-800/60" />}

                      <div className="max-h-40 overflow-y-auto custom-scrollbar">
                        {isLoadingPlaylists ? (
                          <p className="px-3 py-2 text-[11px] text-zinc-500">Loading lists...</p>
                        ) : playlists.length === 0 ? (
                          <p className="px-3 py-2 text-[11px] text-zinc-500">No playlists available</p>
                        ) : (
                          playlists.map((list) => (
                            <button
                              key={list.id}
                              onClick={() => handleSelectExistingPlaylist(list.id)}
                              className="block w-full truncate rounded px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                            >
                              {list.name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>

        <MediaSlider
          title="Trending Popular Movies"
          endpoint={ENDPOINTS.popularMovies}
          accentColor="indigo"
        />

        <MediaSlider
          title="Latest Movies"
          endpoint={ENDPOINTS.upcoming}
          accentColor="cyan"
        />

        <Footer />
      </div>

      {/* ── Playlist Creation Modal ── */}
      {isModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <form 
            className="w-full max-w-sm rounded-xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl scale-in"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreatePlaylistSubmit}
          >
            <h3 className="text-lg font-semibold text-white mb-1">Create New Playlist</h3>
            <p className="text-xs text-zinc-400 mb-4">Enter a name for your playlist. This movie will be added automatically.</p>
            
            <input
              type="text"
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="e.g., Chill Weekend Watchlist"
              className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-indigo-500 transition-colors mb-5"
            />

            <div className="flex justify-end gap-2 text-sm">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-md bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newPlaylistName.trim()}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                OK
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
};

export default MoviePage;
