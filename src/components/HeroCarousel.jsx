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
                      <TrailerButton id={item.id} mediaType={item.media_type} />
                      <ImdbButton id={item.id} mediaType={item.media_type} />
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
