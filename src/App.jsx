import { useState, useEffect, useRef, useCallback } from "react";
import { useDebounce } from "./hooks/useDebounce.js";
import { API_BASE_URL, API_OPTIONS } from "./constants/tmdbapicall";
import Search from "./components/Search.jsx";
import MovieCard from "./components/MovieCard.jsx";
import TvCard from "./components/TvCard"; // Keep this clean import
import TrendingMovies from "./components/TrendingMovies.jsx";
import TrendingTVShows from "./components/TrendingTVShows.jsx";
import Footer from "./components/Footer.jsx";
import Pagination from "./components/Pagination.jsx";

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 1000);

  const [searchResults, setSearchResults] = useState([]); // Renamed from movieList for clarity
  const [popularMovies, setPopularMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);

  const fetchPopularMovies = useCallback(async (pageNumber) => {
    try {
      const endpoint = `${API_BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&sort_by=popularity.desc&vote_count.gte=500&page=${pageNumber}`;
      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) throw new Error("Failed to fetch popular movies");

      const data = await response.json();
      setPopularMovies(data.results || []);
      setTotalPages(data.total_pages || 1);
    } catch (error) {
      console.error("Popular Movies Error:", error);
    }
  }, []);

  // Updated to support multi-search across movies and TV shows
  const fetchUnifiedSearch = useCallback(async (query, pageNumber = 1) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const endpoint = `${API_BASE_URL}/search/multi?query=${encodeURIComponent(query)}&page=${pageNumber}&language=en-US`;
      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) throw new Error("Failed to fetch search results");

      const data = await response.json();
      
      // Filter out 'person' types so you only have movie and tv items in the dropdown
      const filteredMedia = (data.results || []).filter(
        (item) => item.media_type === "movie" || item.media_type === "tv"
      );
      
      setSearchResults(filteredMedia);

      if (filteredMedia.length === 0) {
        setErrorMessage("No results found");
      }
    } catch (error) {
      setErrorMessage("Error fetching results: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPopularMovies(page);
  }, [page, fetchPopularMovies]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      fetchUnifiedSearch(debouncedSearchTerm);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, fetchUnifiedSearch]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <main className="select-none fade-in">
        <div className="pattern" />
        <div className="footer-img" />
        <div className="wrapper">
          <header>
            <h1 className="text-gradient">EZ Movies</h1>
            <p className="text-desciption">
              Discover Your Favourite Movies & Tv Shows Online
            </p>
            <div ref={wrapperRef} className="relative sm:w-3xl mx-auto">
              <Search
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                className="search"
                onFocus={() => setIsDropdownOpen(true)}
              />
              {debouncedSearchTerm && isDropdownOpen && (
                <section className="fade-in absolute z-20 w-full sm:w-3xl mx-auto rounded-lg">
                  {isLoading ? (
                    <p className="text-gray-100 text-center">Loading...</p>
                  ) : errorMessage ? (
                    <p className="text-red-500">{errorMessage}</p>
                  ) : (
                    <div className="relative">
                      <ul className="animate-slide-up grid grid-cols-1 max-h-125 overflow-y-scroll pb-10 bg-dark-100">
                        {searchResults.map((item) => (
                          <li key={item.id}>
                            {/* Dynamically choose the correct card component */}
                            {item.media_type === "movie" ? (
                              <MovieCard movie={item} className="moviesearch-card" />
                            ) : (
                              <TvCard tvShow={item} className="tvsearch-card" />
                            )}
                          </li>
                        ))}
                      </ul>
                      <div className="bg-dark-200 flex absolute bottom-0 left-0 right-0 justify-center items-center h-10 rounded-lg">
                        <p className="text-white hover:underline">Show All Results</p>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>
          </header>

          {/* Trending Sections */}
          <TrendingMovies scrollOnClick={false} />

          <TrendingTVShows scrollOnClick={false} />

          {/* Grid Display for popular content */}
          <section className="all-movies mt-10">
            <h2 className="mb-5">Popular Movies</h2>
            <ul className="animate-slide-up">
              {popularMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} className="movie-card animate-slide-up h-[350px]" />
              ))}
            </ul>
          </section>

          <div className="flex justify-center mt-5">
            <Pagination page={page} setPage={setPage} totalPages={totalPages} />
          </div>
          <Footer />
        </div>
      </main>
    </>
  );
};

export default App;