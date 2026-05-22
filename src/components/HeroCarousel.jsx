import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";
import Spinner from "./Spinner";
import TrailerButton from "./TrailerButton";
import ImdbButton from "./ImdbButton";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

// Firebase Context & Firestore Modules
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { 
  addMovieToFavorites, removeMovieFromFavorites, 
  addTvToFavorites, removeTvFromFavorites 
} from "../firebase/useFirestore";

// ── SELF-CONTAINED SLIDE ITEM COMPONENT ──────────────────────────────────────
const HeroSlideItem = ({ item, handleWatch }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  const isMovie = item.media_type === "movie";
  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date || "").split("-")[0];
  const overview = item.overview || "";
  const truncatedOverview = overview.length > 200 ? overview.slice(0, 200) + "…" : overview;

  // Sync real-time favorite profile states from Firestore
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
      console.error("Hero Carousel live sync error:", error);
      setIsFavorite(false);
    });

    return () => unsubscribe();
  }, [currentUser, item.id, isMovie]);

  const handleFavoriteClick = async () => {
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
      console.error("Error updating favorite status within Hero context:", error);
    }
  };

  const handlePlaylistClick = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    console.log(`Add media reference ${item.id} (${item.media_type}) to user playlist`);
  };

  return (
    <div className="hero-slide">
      {/* Backdrop image */}
      <img
        className="hero-backdrop"
        src={`https://image.tmdb.org/t/p/original${item.backdrop_path}`}
        alt={title}
        loading="lazy"
      />

      {/* Gradient overlays */}
      <div className="hero-overlay-bottom" />
      <div className="hero-overlay-left" />

      {/* Content */}
      <div className="hero-content animate-slide-up">
        {/* Badges */}
        <div className="hero-badges">
          {year && <span className="hero-badge-year">{year}</span>}
          <span className={`hero-badge-type ${item.media_type === "tv" ? "hero-badge-tv" : "hero-badge-movie"}`}>
            {item.media_type === "tv" ? "TV Show" : "Movie"}
          </span>
        </div>

        {/* Title */}
        <h2 className="hero-title">{title}</h2>

        {/* Overview */}
        <p className="hero-overview">{truncatedOverview}</p>

        {/* Action Buttons Wrap (Changes to flex-col to force stacked rows) */}
        <div className="hero-actions flex flex-col gap-4">
          
          {/* Row 1: Primary Actions (Watch Now, Trailer, IMDb) */}
          <div className="flex items-center gap-3 w-full">
            <button
              className="hero-watch-btn"
              onClick={() => handleWatch(item)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
              </svg>
              Watch Now
            </button>
            <TrailerButton id={item.id} mediaType={item.media_type} />
            <ImdbButton id={item.id} mediaType={item.media_type} />
          </div>

          {/* Row 2: Secondary Utilities (Playlist, Favorite) */}
          <div className="flex items-center gap-3 w-full ">
            
            {/* Playlist Addition Button */}
            <button
              onClick={handlePlaylistClick}
              className="w-10 h-10 rounded-full bg-zinc-900/80 hover:bg-indigo-600 text-gray-300 hover:text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm"
              title="Add to Playlist"
              aria-label="Add to Playlist"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>

            {/* Heart Favorite Toggle Button */}
            <button
              onClick={handleFavoriteClick}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm ${
                isFavorite
                  ? "bg-rose-600/90 border-rose-500 text-white"
                  : "bg-zinc-900/80 border-white/10 text-gray-300 hover:text-rose-400"
              }`}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              aria-label="Favorite Toggle Button"
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
            
          </div>

        </div>
      </div>
    </div>
  );
};


// ── MAIN CAROUSEL CONTAINER COMPONENT ────────────────────────────────────────
const HeroCarousel = () => {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Track auth state globally to clear swiper identities

  const createSlug = (title, id) => {
    const slug = (title || "unknown")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return `${slug}-${id}`;
  };

  const handleWatch = (item) => {
    const title = item.title || item.name;
    const slug = createSlug(title, item.id);
    if (item.media_type === "movie") {
      navigate(`/movie/${slug}`);
    } else {
      navigate(`/tv/${slug}`);
    }
  };

  useEffect(() => {
    const fetchHero = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/trending/all/week?language=en-US`,
          API_OPTIONS
        );
        const data = await response.json();
        const withBackdrop = (data.results || [])
          .filter(
            (item) =>
              item.backdrop_path &&
              (item.media_type === "movie" || item.media_type === "tv")
          )
          .slice(0, 10);
        setItems(withBackdrop);
      } catch (error) {
        console.error("Hero carousel fetch error:", error);
      }
    };
    fetchHero();
  }, []);

  if (!items.length) {
    return (
      <div className="hero-loading">
        <Spinner />
      </div>
    );
  }

  return (
    <section className="hero-section">
      <div className="relative">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          slidesPerView={1}
          loop={true}
          speed={900}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
          }}
          navigation={{
            nextEl: ".hero-nav-next",
            prevEl: ".hero-nav-prev",
          }}
          pagination={{ clickable: true }}
          style={{
            "--swiper-pagination-color": "#6366f1",
            "--swiper-pagination-bullet-inactive-color": "rgba(255,255,255,0.25)",
            "--swiper-pagination-bullet-size": "8px",
          }}
          className="hero-swiper"
        >
          {items.map((item) => (
            // Appending user identity tracking prevents cache bleeding across account logout switches
            <SwiperSlide key={`${currentUser?.uid || "guest"}-${item.id}`}>
              <HeroSlideItem item={item} handleWatch={handleWatch} />
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Navigation Arrows */}
        <button className="hero-nav-prev">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button className="hero-nav-next">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default HeroCarousel;