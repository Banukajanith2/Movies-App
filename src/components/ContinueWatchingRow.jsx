import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { useAuth } from "../context/AuthContext";
import { getContinueWatching } from "../firebase/useFirestore";
import { adaptStoredMediaItem } from "../utils/mediaAdapter";
import MovieCard from "./MovieCard";
import TvCard from "./TvCard";

const ContinueWatchingSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 py-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="aspect-[3/4] rounded-xl bg-brand-text/10" />
        <div className="h-3 w-4/5 rounded bg-brand-text/10 mt-2" />
      </div>
    ))}
  </div>
);

const ContinueWatchingRow = () => {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getContinueWatching(currentUser.uid, 12)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [currentUser]);

  if (!currentUser) return null;
  if (!loading && items.length === 0) return null;

  return (
    <section className="media-slider-section">
      <div className="media-slider-header">
        <div className="media-slider-title-row">
          <span className="media-slider-dot bg-rose-500" />
          <h2 className="media-slider-title text-rose-400">Continue Watching</h2>
        </div>
      </div>

      {loading ? (
        <ContinueWatchingSkeleton />
      ) : (
        <div className="relative media-slider-wrap">
          <Swiper
            modules={[Navigation]}
            slidesPerView={2}
            spaceBetween={12}
            navigation={{ nextEl: ".cw-nav-next", prevEl: ".cw-nav-prev" }}
            breakpoints={{
              480: { slidesPerView: 3, spaceBetween: 14 },
              768: { slidesPerView: 4, spaceBetween: 16 },
              1024: { slidesPerView: 5, spaceBetween: 18 },
            }}
            className="w-full py-3"
          >
            {items.map((item) => {
              const adapted = adaptStoredMediaItem(item);
              return (
                <SwiperSlide key={`${item.type}-${item.id}`}>
                  {item.type === "tv" ? <TvCard tvShow={adapted} /> : <MovieCard movie={adapted} />}
                </SwiperSlide>
              );
            })}
          </Swiper>

          <button className="slider-nav-btn slider-nav-prev cw-nav-prev hover:bg-rose-600" aria-label="Scroll left">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button className="slider-nav-btn slider-nav-next cw-nav-next hover:bg-rose-600" aria-label="Scroll right">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
};

export default ContinueWatchingRow;
