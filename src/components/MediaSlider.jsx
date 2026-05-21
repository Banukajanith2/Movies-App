import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";
import Spinner from "./Spinner";
import "swiper/css";
import "swiper/css/navigation";

const SliderCard = ({ item }) => {
  const navigate = useNavigate();

  const createSlug = (title, id) => {
    const slug = (title || "unknown")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return `${slug}-${id}`;
  };

  const handleClick = () => {
    const title = item.title || item.name;
    const slug = createSlug(title, item.id);
    if (item.media_type === "movie" || item.release_date !== undefined) {
      navigate(`/movie/${slug}`);
    } else {
      navigate(`/tv/${slug}`);
    }
  };

  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date || "").split("-")[0];
  const isTV = !item.title && item.name;
  const rating = item.vote_average;
  const episodeInfo = item.episode_count ? `${item.episode_count} eps` : null;

  return (
    <div className="media-slider-card" onClick={handleClick}>
      <div className="media-slider-card-img-wrap">
        <img
          src={
            item.poster_path
              ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
              : "/no-movie.png"
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
            <button className="media-card-play-btn">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
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
  const safeId = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const nextId = `slider-next-${safeId}`;
  const prevId = `slider-prev-${safeId}`;

  const accentMap = {
    indigo: {
      title: "text-indigo-400",
      btn: "hover:bg-indigo-600",
      border: "border-indigo-500",
      dot: "bg-indigo-500",
    },
    amber: {
      title: "text-amber-400",
      btn: "hover:bg-amber-700",
      border: "border-amber-600",
      dot: "bg-amber-500",
    },
    cyan: {
      title: "text-cyan-500",
      btn: "hover:bg-cyan-700",
      border: "border-cyan-600",
      dot: "bg-cyan-500",
    },
  };

  const accent = accentMap[accentColor] || accentMap.indigo;

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await fetch(endpoint, API_OPTIONS);
        const data = await response.json();
        setItems((data.results || []).slice(0, 10));
      } catch (error) {
        console.error(`Error fetching ${title}:`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [endpoint, title]);

  return (
    <section className="media-slider-section" ref={sectionRef}>
      <div className="media-slider-header">
        <div className="media-slider-title-row">
          <span className={`media-slider-dot ${accent.dot}`} />
          <h2 className={`media-slider-title ${accent.title}`}>{title}</h2>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner />
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
              <SwiperSlide key={item.id}>
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
