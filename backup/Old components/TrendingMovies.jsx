import { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import MovieCard from "./MovieCard";
import Spinner from "./Spinner";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";

const TrendingMovies = ({ scrollOnClick = false }) => {
  const [trendingMovies, setTrendingMovies] = useState([]);

  const handleClick = () => {
    if (scrollOnClick) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/trending/movie/week?language=en-US`,
          API_OPTIONS
        );
        if (!response.ok) throw new Error("Failed to fetch trending movies");
        const data = await response.json();
        setTrendingMovies(data.results.slice(0, 10) || []);
      } catch (error) {
        console.error("Error fetching trending movies:", error.message);
      }
    };

    fetchTrending();
  }, []);

  return (
    <section className="trending-movies mt-10 sm:p-0 pl-1 pr-1">
      <h2 className="mb-5 sm:text-3xl font-semibold">Trending Movies</h2>

      {trendingMovies.length > 0 ? (
        <div className="relative">
          <Swiper
            onClick={handleClick}
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={2}
            loop={trendingMovies.length > 5}
            speed={1000}
            autoplay={{
              delay: 1000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            navigation={{
              nextEl: ".custom-next",
              prevEl: ".custom-prev",
            }}
            pagination={{ clickable: true }}
            observer={true}
            observeParents={true}
            breakpoints={{
              640: { slidesPerView: 3 },
              768: { slidesPerView: 4 },
              1024: { slidesPerView: 5 },
            }}
            style={{
            "--swiper-pagination-color": "#cbd5e1", // Active bullet color (e.g., your light-200)
            "--swiper-pagination-bullet-inactive-color": "#334155", // Inactive bullet color (e.g., dark-100)
            }}
            className="w-full h-[400px] animate-slide-up sm:opacity-100 opacity-0"
          >
            {trendingMovies.map((movie, index) => (
              <SwiperSlide key={movie.id}>
                <MovieCard movie={movie} index={index} className="trendingmovie-card h-[350px]" />
              </SwiperSlide>
            ))}
          </Swiper>

          <button className="custom-prev absolute -left-1 sm:-left-5 top-40 -translate-y-1/2 z-10 bg-dark-100 hover:bg-slate-400 p-2 rounded-full text-white shadow-lg transition3s">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          <button className="custom-next absolute -right-1 sm:-right-5 top-40 -translate-y-1/2 z-10 bg-dark-100 hover:bg-slate-400 p-2 rounded-full text-white shadow-lg transition3s">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      ) : (
        <Spinner />
      )}
    </section>
  );
};

export default TrendingMovies;