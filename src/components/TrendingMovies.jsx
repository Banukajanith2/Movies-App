// TrendingMovies.jsx
import { useState, useEffect } from "react";
import { getTrendingMovies } from "../FirestoreService";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import MovieCard from "./MovieCard";
import Spinner from "./Spinner";

const TrendingMovies = ({scrollOnClick = false }) => {
  const [trendingMovies, setTrendingMovies] = useState([]);

  //scroll
  const handleClick = () => {
    if (scrollOnClick) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Fetch trending movies from Firestore
  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error(
        `Error Fetching Trending Movies From Firebase: ${error.message}`
      );
    }
  };

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <section className="trending-movies mt-10 sm:p-0 pl-1 pr-1 ">
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
            className="w-full  h-[400px] animate-slide-up"
          >
            {trendingMovies.map((movie, index) => (
              <SwiperSlide key={movie.id}>
                <MovieCard movie={movie} index={index} />
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Left Arrow */}
          <button className="custom-prev absolute -left-1 sm:-left-5 top-40 -translate-y-1/2 z-10 bg-indigo-400 hover:bg-indigo-600 p-2 rounded-full text-white shadow-lg transition3s">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>

          </button>

          {/* Custom Right Arrow */}
          <button className="custom-next absolute -right-1 sm:-right-5 top-40 -translate-y-1/2 z-10 bg-indigo-400 hover:bg-indigo-600 p-2 rounded-full text-white shadow-lg transition3s">
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
