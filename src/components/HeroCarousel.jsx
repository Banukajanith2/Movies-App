import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";
import Spinner from "./Spinner";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const HeroCarousel = () => {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

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
          .slice(0, 8);
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
          {items.map((item) => {
            const title = item.title || item.name;
            const year = (item.release_date || item.first_air_date || "").split("-")[0];
            const overview = item.overview || "";
            const truncatedOverview = overview.length > 200 ? overview.slice(0, 200) + "…" : overview;

            return (
              <SwiperSlide key={item.id}>
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
                      {year && (
                        <span className="hero-badge-year">{year}</span>
                      )}
                      {item.vote_average > 0 && (
                        <span className="hero-badge-imdb">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#facc15" className="w-3.5 h-3.5 inline mr-1">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                          </svg>
                          IMDb {item.vote_average.toFixed(1)}
                        </span>
                      )}
                      <span className={`hero-badge-type ${item.media_type === "tv" ? "hero-badge-tv" : "hero-badge-movie"}`}>
                        {item.media_type === "tv" ? "TV Show" : "Movie"}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="hero-title">{title}</h2>

                    {/* Overview */}
                    <p className="hero-overview">{truncatedOverview}</p>

                    {/* Action Buttons */}
                    <div className="hero-actions">
                      <button
                        className="hero-watch-btn"
                        onClick={() => handleWatch(item)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                        </svg>
                        Watch Now
                      </button>
                      <button className="hero-trailer-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                        Trailer
                      </button>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
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
