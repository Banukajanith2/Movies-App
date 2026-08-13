import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; // 1. Imported Portal utility
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";
import "swiper/css";
import "swiper/css/navigation";

// Firebase Context & Firestore Modules
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import {
  addMovieToFavorites, removeMovieFromFavorites,
  addTvToFavorites, removeTvFromFavorites,
  getUserPlaylists, createPlaylistAndAddItem, addItemToPlaylist
} from "../firebase/useFirestore";

const SliderCard = ({ item }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [isFavorite, setIsFavorite] = useState(false);

  // Playlist UI States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  // Determine media classification dynamically
  const isMovie = item.media_type === "movie" || item.release_date !== undefined;
  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date || "").split("-")[0];
  const isTV = !item.title && item.name;
  const rating = item.vote_average;
  const episodeInfo = item.episode_count ? `${item.episode_count} eps` : null;

  // Real-time isolated favorite syncing block
  useEffect(() => {
    if (!currentUser) {
      setIsFavorite(false);
      return;
    }

    const userRef = doc(db, "users", currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (isMovie) {
          const favs = userData.favoriteMovies || [];
          setIsFavorite(favs.includes(Number(item.id)));
        } else {
          const favs = userData.favoriteTvShows || [];
          setIsFavorite(favs.includes(Number(item.id)));
        }
      } else {
        setIsFavorite(false);
      }
    }, (error) => {
      console.error("Firestore slider listener mismatch:", error);
      setIsFavorite(false);
    });

    return () => unsubscribe();
  }, [currentUser, item.id, isMovie]);

  const createSlug = (title, id) => {
    const slug = (title || "unknown")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return `${slug}-${id}`;
  };

  const handleClick = () => {
    const slug = createSlug(title, item.id);
    if (isMovie) {
      navigate(`/movie/${slug}`);
    } else {
      navigate(`/tv/${slug}`);
    }
  };

  const handleFavoriteClick = async (e) => {
    e.stopPropagation(); 
    if (!currentUser) {
      navigate("/login");
      return;
    }

    try {
      if (isMovie) {
        if (isFavorite) {
          await removeMovieFromFavorites(currentUser.uid, item.id);
        } else {
          await addMovieToFavorites(currentUser.uid, item.id);
        }
      } else {
        if (isFavorite) {
          await removeTvFromFavorites(currentUser.uid, item.id);
        } else {
          await addTvToFavorites(currentUser.uid, item.id);
        }
      }
    } catch (error) {
      console.error("Slider runtime error updating favorite state:", error);
    }
  };

  const handlePlaylistClick = async (e) => {
    e.stopPropagation(); 
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
      console.error("Failed to load user playlists inside slider context", err);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const currentItemPayload = {
    id: Number(item.id),
    type: isMovie ? "movie" : "tv",
    title: title,
    poster_path: item.poster_path,
    year: year,                        // already derived above
    rating: Number(rating) || 0,       // already derived above
    language: item.original_language === "en" ? "EN" : item.original_language?.toUpperCase() || null,
  };

  const handleSelectExistingPlaylist = async (e, playlistId) => {
    e.stopPropagation();
    try {
      await addItemToPlaylist(currentUser.uid, playlistId, currentItemPayload);
      setIsDropdownOpen(false);
      showToast("Added to playlist!");
    } catch (error) {
      console.error("Error saving item to selected slider list", error);
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
      showToast("Playlist created and media item added!");
    } catch (error) {
      console.error("Error handling new slider collection workflow", error);
    }
  };

  return (
    <>
      <div className="media-slider-card" onClick={handleClick}>
        <div className="media-slider-card-img-wrap relative">
          <img
            src={
              item.poster_path
                ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
                : `${import.meta.env.BASE_URL}no-movie.png`
            }
            alt={title}
            loading="lazy"
          />
          <div className="media-slider-card-overlay">
            <div className="media-slider-card-overlay-inner">
              {rating > 0 && (
                <span className="media-card-rating">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#facc15" className="w-5 h-5">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                  </svg>
                  {rating.toFixed(1)}
                </span>
              )}
              
              <div className="flex items-center gap-1.5 matches-card-action-cluster">
                <button 
                  onClick={handlePlaylistClick}
                  className="media-chip-btn"
                  aria-label="Add to Playlist"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>

                <button 
                  onClick={handleFavoriteClick}
                  className={`media-chip-btn ${isFavorite ? "is-fav" : ""}`}
                  aria-label="Favorite Media Item"
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

                <button className="media-card-play-btn" aria-label="Watch Details">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsDropdownOpen(false); }} />
              
              <div className="ui-menu absolute left-1/2 -translate-x-1/2 bottom-14 w-48" onClick={(e) => e.stopPropagation()}>
                <button onClick={handleOpenCreateModal} className="ui-menu-new">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Make a new playlist
                </button>

                {playlists.length > 0 && <div className="ui-menu-divider" />}

                <div className="ui-menu-scroll custom-scrollbar">
                  {isLoadingPlaylists ? (
                    <p className="ui-menu-empty">Loading lists...</p>
                  ) : playlists.length === 0 ? (
                    <p className="ui-menu-empty">No playlists available</p>
                  ) : (
                    playlists.map((list) => (
                      <button
                        key={list.id}
                        onClick={(e) => handleSelectExistingPlaylist(e, list.id)}
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

          <div className={`media-type-tag ${isTV ? "media-type-tag-tv" : "media-type-tag-movie"}`}>
            {isTV ? "TV Show" : "Movie"}
          </div>
        </div>

        <div className="media-slider-card-info">
          <p className="media-slider-card-title">{title}</p>
          <div className="media-slider-card-meta">
            {year && <span>{year}</span>}
            {episodeInfo && <><span className="text-gray-600">•</span><span>{episodeInfo}</span></>}
          </div>
        </div>
      </div>

      {/* ── 2. Wrapped the Modal Markup inside createPortal to escape Swiper's layout constraints ── */}
      {isModalOpen && createPortal(
        <div
          className="ui-modal-backdrop"
          onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }}
        >
          <div className="ui-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Playlist</h3>
            <p>Enter a name for your playlist. This item will be added automatically.</p>

            <input
              type="text"
              autoFocus
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="e.g., Marathon List"
              className="ui-modal-input"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }}
                className="ui-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylistSubmit}
                disabled={!newPlaylistName.trim()}
                className="ui-btn-primary"
              >
                Create
              </button>
            </div>
          </div>
        </div>,
        document.body // Appends the HTML node cleanly straight into the root DOM body
      )}
    </>
  );
};

const ENDPOINTS = {
  popularTV: `${API_BASE_URL}/tv/popular?language=en-US&page=1`,
  popularMovies: `${API_BASE_URL}/movie/popular?language=en-US&vote_count.gte=500&page=1`,
  upcoming: `${API_BASE_URL}/movie/upcoming?language=en-US&page=1`,
};

const MediaSlider = ({ title, endpoint, accentColor = "indigo", sectionRef }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  
  const safeId = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const nextId = `slider-next-${safeId}`;
  const prevId = `slider-prev-${safeId}`;

  const accentMap = {
    indigo: { title: "text-indigo-400", btn: "hover:bg-indigo-600", border: "border-indigo-500", dot: "bg-indigo-500" },
    amber: { title: "text-amber-400", btn: "hover:bg-amber-700", border: "border-amber-600", dot: "bg-amber-500" },
    cyan: { title: "text-cyan-500", btn: "hover:bg-cyan-700", border: "border-cyan-600", dot: "bg-cyan-500" },
  };

  const accent = accentMap[accentColor] || accentMap.indigo;

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await fetch(endpoint, API_OPTIONS);
        const data = await response.json();
        setItems((data.results || []).slice(0, 25));
      } catch (error) {
        console.error(`Error fetching ${title}:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [endpoint, title]);

  if (!loading && items.length === 0) return null;

  return (
    <section className="media-slider-section" ref={sectionRef}>
      <div className="media-slider-header">
        <div className="media-slider-title-row">
          <span className={`media-slider-dot ${accent.dot}`} />
          <h2 className={`media-slider-title ${accent.title}`}>{title}</h2>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 py-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="media-slider-card-img-wrap bg-brand-text/10" />
              <div className="media-slider-card-info">
                <div className="h-3 w-4/5 rounded bg-brand-text/10 mb-2" />
                <div className="h-2.5 w-2/5 rounded bg-brand-text/10" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative media-slider-wrap">
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={12}
            slidesPerView={2}
            loop={items.length > 5}
            speed={700}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            navigation={{
              nextEl: `.${nextId}`,
              prevEl: `.${prevId}`,
            }}
            breakpoints={{
              480: { slidesPerView: 3, spaceBetween: 14 },
              768: { slidesPerView: 4, spaceBetween: 16 },
              1024: { slidesPerView: 5, spaceBetween: 18 },
            }}
            className="w-full py-3"
          >
            {items.map((item) => (
              <SwiperSlide key={`${currentUser?.uid || "guest"}-${item.id}`}>
                <SliderCard item={item} />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Nav Buttons */}
          <button className={`slider-nav-btn slider-nav-prev ${prevId} ${accent.btn}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button className={`slider-nav-btn slider-nav-next ${nextId} ${accent.btn}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
};

export { ENDPOINTS };
export default MediaSlider;