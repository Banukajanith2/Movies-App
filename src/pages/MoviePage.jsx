import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";

import {
  addMovieToFavorites,
  removeMovieFromFavorites,
  getUserPlaylists,
  createPlaylistAndAddItem,
  addItemToPlaylist,
  recordContinueWatching,
} from "../firebase/useFirestore";

import Spinner from "../components/Spinner";
import Navbar from "../components/Navbar";
import TrailerButton from "../components/TrailerButton";
import ImdbButton from "../components/ImdbButton";
import ShareButton from "../components/ShareButton";
import CastCrew from "../components/CastCrew";
import MediaSlider from "../components/MediaSlider.jsx";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

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

/** 143 → "2h 23m" */
const formatRuntime = (minutes) => {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${rest}m` : `${rest}m`;
};

/** 165000000 → "$165M" */
const formatMoney = (amount) =>
  amount > 0
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(amount)
    : null;

const MoviePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // Movie Details States
  const [movie, setMovie] = useState(null);
  const [pageloading, setPageLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);

  // Server Selection
  const [activeServer, setActiveServer] = useState(0);
  // Bumped to force-remount the iframe when the user asks for a reload
  const [reloadKey, setReloadKey] = useState(0);

  // Firestore Syncing & UI States
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  const movieId = slug?.split("-").pop();

  useDocumentTitle(movie?.title);

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
    window.scrollTo({ top: 0 });
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
  const runtime = formatRuntime(movie.runtime);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const spokenLanguage =
    movie.original_language === "en"
      ? "English"
      : movie.spoken_languages?.[0]?.english_name || movie.original_language?.toUpperCase();

  const placeholder = `${import.meta.env.BASE_URL}no-movie.png`;
  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : movie.poster_path
      ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
      : placeholder;

  const currentItemPayload = {
    id: Number(movie.id),
    type: "movie",
    title: movie.title,
    poster_path: movie.poster_path,
    year: year,
    rating: Number(movie.vote_average),
    language: lang
  };

  const detailRows = [
    { key: "Status", value: movie.status },
    { key: "Released", value: movie.release_date },
    { key: "Runtime", value: runtime },
    { key: "Language", value: spokenLanguage },
    { key: "Budget", value: formatMoney(movie.budget) },
    { key: "Revenue", value: formatMoney(movie.revenue) },
  ].filter((row) => row.value);

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
      showToast("Added to playlist!");
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
      showToast("Playlist created and movie added!");
    } catch (error) {
      console.error("Error creating new playlist", error);
    }
  };

  const handlePlayClick = () => {
    setShowPlayer(true);
    if (currentUser) {
      recordContinueWatching(currentUser.uid, currentItemPayload);
    }
  };

  const handleServerChange = (index) => {
    setActiveServer(index);
    if (!showPlayer) handlePlayClick();
  };

  return (
    <main className="watch-page is-movie fade-in">
      {/* Ambient blurred backdrop — fills the previously empty side gutters */}
      <div className="wp-ambient" aria-hidden="true">
        <img className="wp-ambient-img" src={backdropUrl} alt="" />
        <div className="wp-ambient-veil" />
      </div>

      <Navbar />

      <div className="wp-shell">

        {/* ── Top bar ── */}
        <div className="wp-topbar wp-rise" style={{ "--d": "0s" }}>
          <button className="wp-back" onClick={() => navigate(-1)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back
          </button>
          <div className="wp-crumbs">
            <button className="hover:text-brand-text transition-colors cursor-pointer" onClick={() => navigate("/movies")}>
              Movies
            </button>
            <span>/</span>
            <span className="wp-crumbs-current">{movie.title}</span>
          </div>
        </div>

        {/* ── Stage: player (left) + sources & details rail (right) ── */}
        <div className="wp-stage">

          <div className="wp-stage-main wp-rise" style={{ "--d": "0.06s" }}>
            <div className="wp-player">
              {showPlayer ? (
                <iframe
                  key={`${activeServer}-${reloadKey}`} // remounts iframe on server change / reload
                  className="wp-frame"
                  src={SERVERS[activeServer].url(movie.id)}
                  title={`${movie.title} — ${SERVERS[activeServer].label}`}
                  referrerPolicy="origin"
                  allowFullScreen
                />
              ) : (
                <div
                  className="wp-preview"
                  onClick={handlePlayClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handlePlayClick();
                    }
                  }}
                >
                  <img className="wp-preview-img" src={backdropUrl} alt={movie.title} />
                  <div className="wp-preview-scrim" />

                  <span className="wp-play">
                    <span className="wp-play-ring" />
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                    </svg>
                  </span>

                  <div className="wp-preview-caption">
                    <div className="min-w-0">
                      <p className="wp-preview-kicker">Ready to play</p>
                      <p className="wp-preview-title">{movie.title}</p>
                    </div>
                    <span className="wp-preview-hint">
                      {runtime ? `${runtime} · ` : ""}{SERVERS.length} sources
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Player status bar */}
            <div className="wp-playbar">
              <span className="wp-playbar-label">
                {showPlayer ? (
                  <>
                    <i className="wp-live-dot" />
                    Streaming from <b>{SERVERS[activeServer].label}</b>
                  </>
                ) : (
                  <>Press play to start — pick a different source anytime.</>
                )}
              </span>

              <div className="wp-playbar-actions">
                <button
                  className="wp-ghost-btn"
                  onClick={() => setReloadKey((k) => k + 1)}
                  disabled={!showPlayer}
                  title="Reload the current source"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356m-4.992 4.992-1.5-1.5A7.5 7.5 0 0 0 4.5 12m15-3.652V12a7.5 7.5 0 0 1-12.516 5.652l-1.5-1.5m0 0H2.985v4.992" />
                  </svg>
                  Reload
                </button>
                <button
                  className="wp-ghost-btn"
                  onClick={() => handleServerChange((activeServer + 1) % SERVERS.length)}
                  title="Try the next source"
                >
                  Next source
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* ── Rail ── */}
          <aside className="wp-rail wp-rise" style={{ "--d": "0.12s" }}>

            {/* Sources */}
            <div className="wp-card">
              <div className="wp-card-head">
                <span className="wp-card-title">Sources</span>
                <span className="wp-card-count">{SERVERS.length}</span>
              </div>
              <div className="wp-card-body">
                <div className="wp-server-grid">
                  {SERVERS.map((server, index) => (
                    <button
                      key={server.name}
                      onClick={() => handleServerChange(index)}
                      className={`wp-server ${activeServer === index ? "is-active" : ""}`}
                      aria-pressed={activeServer === index}
                    >
                      <span className="wp-server-dot" />
                      <span className="wp-server-label">{server.label}</span>
                    </button>
                  ))}
                </div>
                <p className="wp-hint">
                  Playback stuttering or blank? Switch to another source — availability varies by title.
                </p>
              </div>
            </div>

            {/* Quick facts */}
            {detailRows.length > 0 && (
              <div className="wp-card">
                <div className="wp-card-head">
                  <span className="wp-card-title">Details</span>
                </div>
                <div className="wp-card-body pt-1">
                  {detailRows.map((row) => (
                    <div className="wp-meta-row" key={row.key}>
                      <span className="wp-meta-k">{row.key}</span>
                      <span className="wp-meta-v">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* ── Poster + info — sits under the player so the tall rail has a partner column ── */}
        <section className="wp-detail wp-rise" style={{ "--d": "0.18s" }}>
          <div className="wp-poster">
            <img
              src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : placeholder}
              alt={movie.title}
            />
          </div>

          <div className="wp-info">
            <h1 className="wp-title">{movie.title}</h1>
            {movie.tagline && <p className="wp-tagline">“{movie.tagline}”</p>}

            <div className="wp-badges">
              <span className="wp-badge wp-badge-type">Movie</span>
              {year && <span className="wp-badge">{year}</span>}
              {runtime && <span className="wp-badge">{runtime}</span>}
              {rating && (
                <span className="wp-badge wp-badge-imdb">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                  </svg>
                  {rating}
                </span>
              )}
              {lang && <span className="wp-badge">{lang}</span>}
            </div>

            {movie.genres?.length > 0 && (
              <div className="wp-genres">
                {movie.genres.map((genre) => (
                  <span className="wp-genre" key={genre.id}>{genre.name}</span>
                ))}
              </div>
            )}

            {movie.overview && <p className="wp-overview">{movie.overview}</p>}

            {/* Action Bar */}
            <div className="wp-actions">
              <TrailerButton id={movie.id} mediaType="movie" />
              <ImdbButton id={movie.id} mediaType="movie" />

              <button
                onClick={handleFavoriteClick}
                className={`wp-icon-btn ${isFavorite ? "is-fav" : ""}`}
                aria-label="Favorite Movie"
                title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={isFavorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
              </button>

              {/* Playlist button + dropdown anchor */}
              <div className="relative flex items-center justify-center">
                <button
                  onClick={handlePlaylistButtonClick}
                  className={`wp-icon-btn ${isDropdownOpen ? "is-open" : ""}`}
                  aria-label="Add to Playlist"
                  title="Add to Playlist"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />

                    <div className="wp-menu">
                      <button onClick={handleOpenCreateModal} className="wp-menu-new">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Make a new playlist
                      </button>

                      {playlists.length > 0 && <div className="wp-menu-divider" />}

                      <div className="wp-menu-scroll">
                        {isLoadingPlaylists ? (
                          <p className="wp-menu-empty">Loading lists...</p>
                        ) : playlists.length === 0 ? (
                          <p className="wp-menu-empty">No playlists available</p>
                        ) : (
                          playlists.map((list) => (
                            <button
                              key={list.id}
                              onClick={() => handleSelectExistingPlaylist(list.id)}
                              className="wp-menu-item"
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

              <ShareButton className="wp-icon-btn" />
            </div>
          </div>
          </section>
        </div>

        <div className="wp-rise" style={{ "--d": "0.24s" }}>
          <CastCrew id={movie.id} mediaType="movie" />

          <MediaSlider
            title="More Like This"
            endpoint={`${API_BASE_URL}/movie/${movie.id}/recommendations?language=en-US`}
            accentColor="indigo"
          />
        </div>

        <Footer />
      </div>

      <BackToTop />

      {/* ── Playlist Creation Modal ── */}
      {isModalOpen && createPortal(
        <div className="wp-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <form
            className="wp-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreatePlaylistSubmit}
          >
            <h3>Create New Playlist</h3>
            <p>Enter a name for your playlist. This movie will be added automatically.</p>

            <input
              type="text"
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="e.g., Chill Weekend Watchlist"
              className="wp-modal-input"
            />

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="wp-btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={!newPlaylistName.trim()} className="wp-btn-primary">
                Create
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </main>
  );
};

export default MoviePage;
