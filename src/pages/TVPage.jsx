import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom"; // Safe absolute container rendering
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import {
  addTvToFavorites,
  removeTvFromFavorites,
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
import WatchProviders from "../components/WatchProviders";
import RatingGauge from "../components/RatingGauge";
import Reviews from "../components/Reviews";
import SeasonsOverview from "../components/SeasonsOverview";
import ShortcutsHelp from "../components/ShortcutsHelp";
import TitleLogo from "../components/TitleLogo";
import NextEpisode from "../components/NextEpisode";
import { usePageMeta } from "../hooks/usePageMeta";
import { srcSet } from "../utils/tmdbImage";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

// ── TV Streaming Servers ──
// season & episode are passed through to each URL that supports them.
const TV_SERVERS = [
  {
    label: "VidSrc",
    url: (id, s, e) => `https://vidsrcme.ru/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    label: "EmbosTop",
    url: (id, s, e) => `https://embos.top/tv/?mid=${id}&s=${s}&e=${e}`,
  },
  {
    label: "VidSrc 2",
    url: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    label: "VidKing",
    url: (id, s, e) => `https://www.vidking.net/embed/tv/${id}/${s}/${e}`,
  },
  {
    label: "2Embed",
    url: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    label: "MultiEmbed",
    url: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    label: "VidPlus",
    url: (id, s, e) => `https://player.vidplus.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    label: "Vid Easy",
    url: (id, s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}`,
  },
];

const TVPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // TV Show Core States
  const [tvShow, setTvShow] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);

  // Video Streaming Track States
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodesList, setEpisodesList] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  // Server Selection
  const [activeServer, setActiveServer] = useState(0);
  // Bumped to force-remount the iframe when the user asks for a reload
  const [reloadKey, setReloadKey] = useState(0);

  // Keyboard shortcuts. Handlers live behind a ref because the hook has to run
  // before this component's early returns, while the handlers are defined after.
  const playerRef = useRef(null);
  const actionsRef = useRef({});
  const [showShortcuts, setShowShortcuts] = useState(false);

  useKeyboardShortcuts({
    k: () => actionsRef.current.play?.(),
    f: () => actionsRef.current.fullscreen?.(),
    s: () => actionsRef.current.nextSource?.(),
    r: () => actionsRef.current.reload?.(),
    n: () => actionsRef.current.nextEpisode?.(),
    p: () => actionsRef.current.prevEpisode?.(),
    "?": () => setShowShortcuts((v) => !v),
    Escape: () => setShowShortcuts(false),
  });

  // Firestore Syncing & UI States
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  const tvId = slug?.split("-").pop();

  usePageMeta({
    title: tvShow?.name,
    description: tvShow?.overview,
    image: tvShow?.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${tvShow.backdrop_path}`
      : tvShow?.poster_path
        ? `https://image.tmdb.org/t/p/w780${tvShow.poster_path}`
        : undefined,
    type: "video.tv_show",
    jsonLd: tvShow && {
      "@context": "https://schema.org",
      "@type": "TVSeries",
      name: tvShow.name,
      description: tvShow.overview,
      image: tvShow.poster_path ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : undefined,
      startDate: tvShow.first_air_date || undefined,
      genre: tvShow.genres?.map((g) => g.name),
      numberOfSeasons: tvShow.number_of_seasons,
      numberOfEpisodes: tvShow.number_of_episodes,
      aggregateRating: tvShow.vote_count
        ? {
            "@type": "AggregateRating",
            ratingValue: tvShow.vote_average?.toFixed(1),
            ratingCount: tvShow.vote_count,
            bestRating: 10,
            worstRating: 0,
          }
        : undefined,
    },
  });

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

  // 3. Real-time TV-specific favorite tracking
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

  // Reset server + player when navigating to a different show
  useEffect(() => {
    setActiveServer(0);
    setShowPlayer(false);
    window.scrollTo({ top: 0 });
  }, [tvId]);

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
  const rating = tvShow.vote_average ? tvShow.vote_average.toFixed(1) : null;
  const spokenLanguage =
    tvShow.original_language === "en"
      ? "English"
      : tvShow.spoken_languages?.[0]?.english_name || tvShow.original_language?.toUpperCase();

  const placeholder = `${import.meta.env.BASE_URL}no-movie.png`;
  const backdropUrl = tvShow.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${tvShow.backdrop_path}`
    : tvShow.poster_path
      ? `https://image.tmdb.org/t/p/w780${tvShow.poster_path}`
      : placeholder;

  // The ambient layer is blurred 48px, so a large source would be wasted bytes
  const ambientUrl = tvShow.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${tvShow.backdrop_path}`
    : backdropUrl;

  // Episode count fallback for shows whose season payload fails to load
  const seasonEpisodeCount =
    episodesList.length ||
    tvShow.seasons?.find((s) => s.season_number === selectedSeason)?.episode_count ||
    1;

  const activeEpisode = episodesList.find((ep) => ep.episode_number === selectedEpisode);

  const currentItemPayload = {
    id: Number(tvShow.id),
    type: "tv",
    title: tvShow.name,
    poster_path: tvShow.poster_path,
    year: year,
    rating: Number(tvShow.vote_average),
    language: lang
  };

  const facts = [
    { key: "Status", value: tvShow.status },
    { key: "Seasons", value: tvShow.number_of_seasons },
    { key: "Episodes", value: tvShow.number_of_episodes },
    { key: "Network", value: tvShow.networks?.[0]?.name },
    { key: "First aired", value: tvShow.first_air_date },
    { key: "Language", value: spokenLanguage },
  ].filter((fact) => fact.value);

  // ── Action Handlers ──
  const handleFavoriteClick = async () => {
    if (!currentUser) { navigate("/login"); return; }
    try {
      if (isFavorite) {
        await removeTvFromFavorites(currentUser.uid, Number(tvShow.id));
      } else {
        await addTvToFavorites(currentUser.uid, Number(tvShow.id));
      }
    } catch (error) {
      console.error("Error toggling favorite TV state:", error);
    }
  };

  const handlePlaylistButtonClick = async () => {
    if (!currentUser) { navigate("/login"); return; }
    if (isDropdownOpen) { setIsDropdownOpen(false); return; }

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
      showToast("Playlist created and TV show added!");
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

  const handleEpisodeSelect = (episodeNumber) => {
    setSelectedEpisode(episodeNumber);
    if (!showPlayer) handlePlayClick();
  };

  /* Fullscreens the player shell rather than the iframe, so our own chrome
     (and the browser's fullscreen affordances) stay attached to it. */
  const toggleFullscreen = () => {
    const el = playerRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else el.requestFullscreen?.().catch(() => {});
  };

  const SHORTCUTS = [
    { label: "Play", keys: ["K"] },
    { label: "Fullscreen player", keys: ["F"] },
    { label: "Next / previous episode", keys: ["N", "P"] },
    { label: "Next source", keys: ["S"] },
    { label: "Reload player", keys: ["R"] },
    { label: "Show this help", keys: ["?"] },
  ];

  // Published for the shortcut hook registered above
  actionsRef.current = {
    play: () => !showPlayer && handlePlayClick(),
    fullscreen: toggleFullscreen,
    nextSource: () => handleServerChange((activeServer + 1) % TV_SERVERS.length),
    reload: () => showPlayer && setReloadKey((k) => k + 1),
    nextEpisode: () =>
      selectedEpisode < seasonEpisodeCount && handleEpisodeSelect(selectedEpisode + 1),
    prevEpisode: () => selectedEpisode > 1 && handleEpisodeSelect(selectedEpisode - 1),
  };

  return (
    <main className="watch-page is-tv fade-in">
      {/* Ambient blurred backdrop — fills the previously empty side gutters */}
      <div className="wp-ambient" aria-hidden="true">
        <img className="wp-ambient-img" src={ambientUrl} alt="" />
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
            <button className="hover:text-brand-text transition-colors cursor-pointer" onClick={() => navigate("/tv-shows")}>
              TV Shows
            </button>
            <span>/</span>
            <span className="wp-crumbs-current">{tvShow.name}</span>
          </div>
        </div>

        {/* ── Stage: player (left) + sources & episodes rail (right) ── */}
        <div className="wp-stage">

          <div className="wp-stage-main wp-rise" style={{ "--d": "0.06s" }}>
            <div className="wp-player" ref={playerRef}>
              {showPlayer ? (
                <iframe
                  key={`${activeServer}-${selectedSeason}-${selectedEpisode}-${reloadKey}`}
                  className="wp-frame"
                  src={TV_SERVERS[activeServer].url(tvShow.id, selectedSeason, selectedEpisode)}
                  title={`${tvShow.name} S${selectedSeason}E${selectedEpisode} — ${TV_SERVERS[activeServer].label}`}
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
                  <img
                    className="wp-preview-img"
                    src={backdropUrl}
                    srcSet={srcSet(tvShow.backdrop_path, "backdrop")}
                    sizes="(min-width: 1024px) 1050px, 100vw"
                    alt={tvShow.name}
                  />
                  <div className="wp-preview-scrim" />

                  <span className="wp-play">
                    <span className="wp-play-ring" />
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                    </svg>
                  </span>

                  <div className="wp-preview-caption">
                    <div className="min-w-0">
                      <p className="wp-preview-kicker">
                        Season {selectedSeason} · Episode {selectedEpisode}
                      </p>
                      <p className="wp-preview-title">
                        <TitleLogo
                          id={tvShow.id}
                          mediaType="tv"
                          title={tvShow.name}
                          logoClassName="title-logo-preview"
                        />
                      </p>
                      {activeEpisode?.name && (
                        <p className="wp-preview-episode">{activeEpisode.name}</p>
                      )}
                    </div>
                    <span className="wp-preview-hint">{TV_SERVERS.length} sources</span>
                  </div>
                </div>
              )}
            </div>

            {/* Player status bar + episode stepper */}
            <div className="wp-playbar">
              <span className="wp-playbar-label">
                {showPlayer && <i className="wp-live-dot" />}
                <span className="truncate">
                  <b>S{selectedSeason} · E{selectedEpisode}</b>
                  {activeEpisode?.name ? ` — ${activeEpisode.name}` : ""}
                </span>
              </span>

              <div className="wp-playbar-actions">
                <button
                  className="wp-ghost-btn"
                  onClick={() => setSelectedEpisode((n) => Math.max(1, n - 1))}
                  disabled={selectedEpisode <= 1}
                  title="Previous episode"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                  Prev
                </button>
                <button
                  className="wp-ghost-btn"
                  onClick={() => handleEpisodeSelect(Math.min(seasonEpisodeCount, selectedEpisode + 1))}
                  disabled={selectedEpisode >= seasonEpisodeCount}
                  title="Next episode"
                >
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
                <button
                  className="wp-ghost-btn"
                  onClick={() => setReloadKey((k) => k + 1)}
                  disabled={!showPlayer}
                  title="Reload the current source (R)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992V4.356m-4.992 4.992-1.5-1.5A7.5 7.5 0 0 0 4.5 12m15-3.652V12a7.5 7.5 0 0 1-12.516 5.652l-1.5-1.5m0 0H2.985v4.992" />
                  </svg>
                  Reload
                </button>
                <button className="wp-ghost-btn" onClick={toggleFullscreen} title="Fullscreen (F)">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                </button>
                <button
                  className="wp-ghost-btn"
                  onClick={() => setShowShortcuts(true)}
                  title="Keyboard shortcuts (?)"
                  aria-label="Keyboard shortcuts"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9h.008v.008H6V9Zm3 0h.008v.008H9V9Zm3 0h.008v.008H12V9Zm3 0h.008v.008H15V9Zm3 0h.008v.008H18V9ZM6 12h.008v.008H6V12Zm12 0h.008v.008H18V12ZM9 15h6M3.75 6h16.5a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H3.75a1.5 1.5 0 0 1-1.5-1.5v-9a1.5 1.5 0 0 1 1.5-1.5Z" />
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
                <span className="wp-card-count">{TV_SERVERS.length}</span>
              </div>
              <div className="wp-card-body">
                <div className="wp-server-grid">
                  {TV_SERVERS.map((server, index) => (
                    <button
                      key={server.label}
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
                  Some sources lag behind on new episodes — switch if this one won't load.
                </p>
              </div>
            </div>

            {/* Upcoming episode for returning series */}
            <NextEpisode
              episode={tvShow.next_episode_to_air}
              onSelect={(season, episode) => {
                setSelectedSeason(season);
                setSelectedEpisode(episode);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />

            {/* Legal streaming availability */}
            <WatchProviders id={tvShow.id} mediaType="tv" />

            {/* Episodes */}
            <div className="wp-card">
              <div className="wp-card-head">
                <span className="wp-card-title">Episodes</span>
                <span className="wp-card-count">{seasonEpisodeCount}</span>
              </div>
              <div className="wp-card-body">
                <select
                  value={selectedSeason}
                  onChange={(e) => {
                    setSelectedSeason(Number(e.target.value));
                    setSelectedEpisode(1);
                  }}
                  className="wp-select"
                  aria-label="Select season"
                >
                  {standardSeasons.length > 0 ? (
                    standardSeasons.map((s) => (
                      <option key={s.id} value={s.season_number}>
                        Season {s.season_number}
                        {s.episode_count ? ` · ${s.episode_count} episodes` : ""}
                      </option>
                    ))
                  ) : (
                    <option value={1}>Season 1</option>
                  )}
                </select>

                <div className="wp-eplist">
                  {episodesLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="wp-ep-skeleton" />
                    ))
                  ) : episodesList.length > 0 ? (
                    episodesList.map((ep) => (
                      <button
                        key={ep.id}
                        onClick={() => handleEpisodeSelect(ep.episode_number)}
                        className={`wp-ep ${selectedEpisode === ep.episode_number ? "is-active" : ""}`}
                      >
                        <span className="wp-ep-thumb">
                          {ep.still_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w185${ep.still_path}`}
                              srcSet={srcSet(ep.still_path, "still")}
                              sizes="86px"
                              alt={ep.name || `Episode ${ep.episode_number}`}
                              loading="lazy"
                            />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-muted">
                              <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className="wp-ep-badge">E{ep.episode_number}</span>
                        </span>

                        <span className="wp-ep-body">
                          <span className="wp-ep-title">{ep.name || `Episode ${ep.episode_number}`}</span>
                          <span className="wp-ep-meta">
                            {[ep.runtime ? `${ep.runtime}m` : null, ep.air_date]
                              .filter(Boolean)
                              .join(" · ") || "—"}
                          </span>
                          {selectedEpisode === ep.episode_number && showPlayer && (
                            <span className="wp-ep-now">Now playing</span>
                          )}
                        </span>
                      </button>
                    ))
                  ) : (
                    Array.from({ length: seasonEpisodeCount }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        onClick={() => handleEpisodeSelect(num)}
                        className={`wp-ep ${selectedEpisode === num ? "is-active" : ""}`}
                      >
                        <span className="wp-ep-thumb">
                          <span className="wp-ep-badge">E{num}</span>
                        </span>
                        <span className="wp-ep-body">
                          <span className="wp-ep-title">Episode {num}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* ── Poster + info — sits under the player so the tall rail has a partner column ── */}
        <section className="wp-detail wp-rise" style={{ "--d": "0.18s" }}>
          <div className="wp-poster">
            <img
              src={tvShow.poster_path ? `https://image.tmdb.org/t/p/w500${tvShow.poster_path}` : placeholder}
              srcSet={srcSet(tvShow.poster_path)}
              sizes="(min-width: 1024px) 210px, 160px"
              alt={tvShow.name}
            />
          </div>

          <div className="wp-info">
            <h1 className="wp-title">{tvShow.name}</h1>
            {tvShow.tagline && <p className="wp-tagline">“{tvShow.tagline}”</p>}

            <div className="wp-badges">
              <span className="wp-badge wp-badge-type">TV Show</span>
              {year && <span className="wp-badge">{year}</span>}
              {tvShow.number_of_seasons && (
                <span className="wp-badge">
                  {tvShow.number_of_seasons} season{tvShow.number_of_seasons > 1 ? "s" : ""}
                </span>
              )}
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

            {tvShow.genres?.length > 0 && (
              <div className="wp-genres">
                {tvShow.genres.map((genre) => (
                  <span className="wp-genre" key={genre.id}>{genre.name}</span>
                ))}
              </div>
            )}

            {tvShow.overview && <p className="wp-overview">{tvShow.overview}</p>}

            <div className="mt-6">
              <RatingGauge value={tvShow.vote_average} count={tvShow.vote_count} />
            </div>

            {facts.length > 0 && (
              <div className="wp-facts">
                {facts.map((fact) => (
                  <div className="wp-fact" key={fact.key}>
                    <p className="wp-fact-k">{fact.key}</p>
                    <p className="wp-fact-v">{fact.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Action Bar */}
            <div className="wp-actions">
              <TrailerButton id={tvShow.id} mediaType="tv" />
              <ImdbButton id={tvShow.id} mediaType="tv" />

              <button
                onClick={handleFavoriteClick}
                className={`ui-icon-btn ${isFavorite ? "is-fav" : ""}`}
                aria-label="Favorite TV Show"
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
                  className={`ui-icon-btn ${isDropdownOpen ? "is-open" : ""}`}
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

                    <div className="ui-menu absolute left-0 top-12">
                      <button onClick={handleOpenCreateModal} className="ui-menu-new">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Make a new playlist
                      </button>

                      {playlists.length > 0 && <div className="ui-menu-divider" />}

                      <div className="ui-menu-scroll">
                        {isLoadingPlaylists ? (
                          <p className="ui-menu-empty">Loading lists...</p>
                        ) : playlists.length === 0 ? (
                          <p className="ui-menu-empty">No playlists available</p>
                        ) : (
                          playlists.map((list) => (
                            <button
                              key={list.id}
                              onClick={() => handleSelectExistingPlaylist(list.id)}
                              className="ui-menu-item"
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

              <ShareButton className="ui-icon-btn" />
            </div>
          </div>
          </section>
        </div>

        <div className="wp-rise" style={{ "--d": "0.24s" }}>
          <SeasonsOverview
            seasons={tvShow.seasons || []}
            selectedSeason={selectedSeason}
            onSelectSeason={(n) => {
              setSelectedSeason(n);
              setSelectedEpisode(1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />

          <CastCrew id={tvShow.id} mediaType="tv" creators={tvShow.created_by?.map((c) => c.name) || []} />

          <Reviews id={tvShow.id} mediaType="tv" />

          <MediaSlider
            title="More Like This"
            endpoint={`${API_BASE_URL}/tv/${tvShow.id}/recommendations?language=en-US`}
            accentColor="amber"
          />
        </div>

        <Footer />
      </div>

      <BackToTop />

      {showShortcuts && (
        <ShortcutsHelp items={SHORTCUTS} onClose={() => setShowShortcuts(false)} />
      )}

      {/* ── Playlist Creation Modal ── */}
      {isModalOpen && createPortal(
        <div className="ui-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <form
            className="ui-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreatePlaylistSubmit}
          >
            <h3>Create New Playlist</h3>
            <p>Enter a name for your playlist. This series will be added automatically.</p>

            <input
              type="text"
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="e.g., Series Binge List"
              className="ui-modal-input"
            />

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="ui-btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={!newPlaylistName.trim()} className="ui-btn-primary">
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

export default TVPage;
