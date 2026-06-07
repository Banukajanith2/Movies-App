import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom"; // Safe absolute container rendering
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { 
  addTvToFavorites, 
  removeTvFromFavorites, 
  getUserPlaylists, 
  createPlaylistAndAddItem, 
  addItemToPlaylist 
} from "../firebase/useFirestore";

import Spinner from "../components/Spinner";
import Navbar from "../components/Navbar";
import TrailerButton from "../components/TrailerButton";
import ImdbButton from "../components/ImdbButton";
import Footer from "../components/Footer";

const TVPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // TV Show Core States
  const [tvShow, setTvShow] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);

  // Video Streaming Track States
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodesList, setEpisodesList] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  // Firestore Syncing & UI States
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  const tvId = slug?.split("-").pop();

  // 1. Fetch Core TV Show details
  useEffect(() => {
    if (!tvId) return;

    const fetchTVDetails = async () => {
      try {
        const endpoint = `${API_BASE_URL}/tv/${tvId}`;
        const response = await fetch(endpoint, API_OPTIONS);
        if (!response.ok) throw new Error("TV show fetch failed");

        const data = await response.json();
        setTvShow(data);
        setSelectedSeason(1);
        setSelectedEpisode(1);
      } catch (error) {
        console.error("Error fetching TV details:", error);
        navigate(`/404-Error`);
      } finally {
        setPageLoading(false);
      }
    };
    fetchTVDetails();
  }, [tvId, navigate]);

  // 2. Fetch Episode lists when Season changes
  useEffect(() => {
    if (!tvId || !tvShow) return;

    const fetchSeasonDetails = async () => {
      setEpisodesLoading(true);
      try {
        const endpoint = `${API_BASE_URL}/tv/${tvId}/season/${selectedSeason}`;
        const response = await fetch(endpoint, API_OPTIONS);
        if (!response.ok) throw new Error("Season details fetch failed");

        const data = await response.json();
        setEpisodesList(data.episodes || []);
      } catch (error) {
        console.error("Error fetching season episodes:", error);
      } finally {
        setEpisodesLoading(false);
      }
    };

    fetchSeasonDetails();
  }, [selectedSeason, tvId, tvShow]);

  // 3. Real-time TV-specific favorite tracking with reliable type normalization
  useEffect(() => {
    if (!currentUser || !tvShow?.id) {
      setIsFavorite(false);
      return;
    }

    const userRef = doc(db, "users", currentUser.uid);
    const targetId = Number(tvShow.id);
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const favs = userData.favoriteTvShows || [];
        
        // Normalize everything to numbers to prevent string-vs-number type bugs
        const hasIt = favs.map(id => Number(id)).includes(targetId);
        setIsFavorite(hasIt);
      } else {
        setIsFavorite(false);
      }
    }, (error) => {
      console.error("Snapshot error:", error);
      setIsFavorite(false);
    });

    return () => unsubscribe();
  }, [currentUser, tvShow?.id]);

  if (pageLoading) {
    return (
      <div className="fixed inset-0 bg-brand-bg flex items-center justify-center z-[9999]">
        <Spinner />
      </div>
    );
  }

  if (!tvShow) {
    navigate(`/404-Error`);
    return null;
  }

  const standardSeasons = tvShow.seasons?.filter((s) => s.season_number > 0) || [];

  const year = tvShow.first_air_date ? tvShow.first_air_date.split("-")[0] : null;
  const lang = tvShow.original_language === "en" ? "EN" : tvShow.original_language?.toUpperCase();

  const currentItemPayload = {
    id: Number(tvShow.id),
    type: "tv",
    title: tvShow.name,
    poster_path: tvShow.poster_path,
    year: year,
    rating: Number(tvShow.vote_average),
    language: lang
  };

  // ── Action Handlers ──
  // TVPage.jsx — handleFavoriteClick
  const handleFavoriteClick = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      if (isFavorite) {
        await removeTvFromFavorites(currentUser.uid, Number(tvShow.id));
      } else {
        await addTvToFavorites(currentUser.uid, Number(tvShow.id));
      }
    } catch (error) {
      console.error("Error toggling favorite TV state:", error);
    }
    // No optimistic flip — onSnapshot will update isFavorite automatically
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
      alert(`Playlist created and TV show added!`);
    } catch (error) {
      console.error("Error creating new playlist", error);
    }
  };

  return (
    <div className="relative bg-brand-bg min-h-screen">
      <Navbar />

      <div className="tv fade-in pt-20">
        
        {/* Backdrop / Main Player Window */}
        <div className="backdrop animate-slide-up" onClick={() => !showPlayer && setShowPlayer(true)}>
          {showPlayer ? (
            <div className="player">
              <iframe
                className="iframe"
                src={`https://vidsrcme.ru/embed/tv?tmdb=${tvShow.id}&season=${selectedSeason}&episode=${selectedEpisode}`}
                referrerPolicy="origin"
                allowFullScreen
              />
            </div>
          ) : (
            <>
              <img
                className="backdrop-img"
                src={tvShow.backdrop_path ? `https://image.tmdb.org/t/p/w500/${tvShow.backdrop_path}` : "no-movie.png"}
                alt={tvShow.name}
              />
              <svg
                className="play-icon"
                onClick={() => setShowPlayer(true)}
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

        {/* Season & Episode Selector Bar */}
        <div className="animate-slide-up w-full my-6 flex flex-col items-center justify-center sm:flex-row sm:flex-wrap sm:items-center gap-4 bg-surface p-4 rounded-xl border border-brand-text/10 backdrop-blur-md">
          <div className="flex flex-col w-full sm:w-auto sm:min-w-[140px]">
            <label className="text-xs lg:text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">Season</label>
            <select
              value={selectedSeason}
              onChange={(e) => {
                setSelectedSeason(Number(e.target.value));
                setSelectedEpisode(1);
              }}
              className="bg-brand-bg text-brand-text rounded-lg px-3 py-2 border border-muted/30 focus:outline-none focus:border-accent cursor-pointer text-sm font-medium transition w-full"
            >
              {standardSeasons.length > 0 ? (
                standardSeasons.map((s) => (
                  <option key={s.id} value={s.season_number}>
                    Season {s.season_number}
                  </option>
                ))
              ) : (
                <option value={1}>Season 1</option>
              )}
            </select>
          </div>

          <div className="flex flex-col w-full sm:w-auto sm:min-w-[140px]">
            <label className="text-xs lg:text-sm font-semibold uppercase tracking-wider text-muted mb-1.5">Episode</label>
            <select
              value={selectedEpisode}
              disabled={episodesLoading}
              onChange={(e) => setSelectedEpisode(Number(e.target.value))}
              className="bg-brand-bg text-brand-text rounded-lg px-3 py-2 border border-muted/30 focus:outline-none focus:border-accent cursor-pointer text-sm font-medium transition disabled:opacity-50 w-full"
            >
              {episodesLoading ? (
                <option>Loading...</option>
              ) : episodesList.length > 0 ? (
                episodesList.map((ep) => (
                  <option key={ep.id} value={ep.episode_number}>
                    Ep {ep.episode_number} : {ep.name || `Episode ${ep.episode_number}`}
                  </option>
                ))
              ) : (
                Array.from({ length: tvShow.seasons?.find(s => s.season_number === selectedSeason)?.episode_count || 1 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    Episode {num}
                  </option>
                ))
              )}
            </select>
          </div>

          {showPlayer && (
            <div className="w-full items-center justify-center text-center text-xs sm:text-sm text-muted italic pt-2 self-center">
              Playing Season {selectedSeason}, Episode {selectedEpisode}
            </div>
          )}
        </div>

        {/* Poster + Info Section */}
        <div className="poster-and-info animate-slide-up">
          <div className="poster">
            <img
              className="poster-img"
              src={tvShow.poster_path ? `https://image.tmdb.org/t/p/w500/${tvShow.poster_path}` : "no-movie.png"}
              alt={tvShow.name}
            />
          </div>
          <div className="movie-info text-brand-text">
            <h2 className="mb-3 text-brand-text">{tvShow.name}</h2>
            <p className="mb-4 overflow-y-scroll max-h-40 text-muted">{tvShow.overview || "No overview available."}</p>
            <p><strong>First Air Date :</strong> <span className="text-muted">{tvShow.first_air_date || "N/A"}</span></p>
            <p><strong>IMDb :</strong> <span className="text-muted">{tvShow.vote_average?.toFixed(1) || "N/A"}/10</span></p>
            <p><strong>Language :</strong> <span className="text-muted">{tvShow.original_language === "en" ? "English" : tvShow.spoken_languages?.[0]?.english_name || tvShow.original_language}</span></p>
            <p><strong>Genre :</strong> <span className="text-muted">{tvShow.genres?.map((genre, key) => (<span key={key}>{genre.name}{key < tvShow.genres.length - 1 ? ", " : ""}</span>))}</span></p>
            
            {/* Action Bar Container */}
            <div className="flex items-center flex-wrap gap-3 mt-5 relative">
              <TrailerButton id={tvShow.id} mediaType="tv" />
              <ImdbButton id={tvShow.id} mediaType="tv" />

              {/* ── Favorite Button ── */}
              <button 
                onClick={handleFavoriteClick}
                className={`h-[40px] w-[40px] shrink-0 rounded-full border flex items-center justify-center transition-all duration-200 cursor-pointer backdrop-blur-sm ${
                  isFavorite 
                    ? "bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-600/20" 
                    : "bg-zinc-900/80 border-zinc-800 text-gray-300 hover:text-rose-400 hover:border-zinc-700"
                }`}
                aria-label="Favorite TV Show"
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
            <p className="text-xs text-zinc-400 mb-4">Enter a name for your playlist. This series will be added automatically.</p>
            
            <input
              type="text"
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="e.g., Series Binge List"
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

export default TVPage;