import { useState, useEffect, useRef } from "react";
import { useDebounce } from "./hooks/useDebounce.js";
import Search from "./components/Search.jsx";
import MovieCard from "./components/MovieCard.jsx";
import { updateSearchCount } from "./FirestoreService.js"; //using Firestore as Backend
import TrendingMovies from "./components/TrendingMovies.jsx";
import Footer from "./components/Footer.jsx";
import Pagination from "./components/Pagination.jsx"

//get api key to make the request
const API_BASE_URL = "https://api.themoviedb.org/3";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");

  //only fetch data when the search term changes and after 500 ms of typing using debounce
  const debouncedSearchTerm = useDebounce(searchTerm, 1000);

  const [errorMessage, setErrorMessage] = useState("");

  //setting the movies list from api fetch
  const [movieList, setMovieList] = useState([]);

  const [page, setPage] = useState(1);

  //waiting for the movies to load
  const [isLoading, setIsLoading] = useState(false);

  const [popularMovies, setPopularMovies] = useState([]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);

  //making request via async function
  const fetchSearchMovies = async (query, pageNumber = 1) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const endpoint = `${API_BASE_URL}/search/movie?query=${encodeURIComponent(
        query
      )}&page=${pageNumber}`;

      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) throw new Error("Failed to fetch search results");

      const data = await response.json();
      if (data.Response === "False") {
        setErrorMessage(data.Error || "No results found");
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      setErrorMessage("Error Fetching Search Results: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPopularMovies = async (pageNumber = 1) => {
    try {
      const endpoint = `${API_BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc&page=${pageNumber}`;
      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) throw new Error("Failed to fetch popular movies");

      const data = await response.json();
      setPopularMovies(data.results || []);
    } catch (error) {
      console.error("Popular Movies Error: ", error);
    }
  };

  //run fetch api after page loads
  //also run fetch api for search term
  //run the search through debounce
  useEffect(() => {
    fetchPopularMovies(page);
  }, [page]);

  useEffect(() => {
    if (debouncedSearchTerm) {
      fetchSearchMovies(debouncedSearchTerm);
    } else {
      setMovieList([]); // Clear search results if input is cleared
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
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
              Discover Your Favourite Movies Online
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
                      {movieList.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} className="search-card"/>
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
          {/* Trending Movies Section with scroll SwiperJs */}
          <TrendingMovies scrollOnClick={false} />
          {/* Here we call isLoading and error message from the state. if both are false we load the movies from movieList */}
          <section className="all-movies mt-10">
            <h2 className="mb-5">Popular Movies</h2>
            <ul className="animate-slide-up">
              {popularMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} className="movie-card animate-slide-up h-[350px]"/>
              ))}
            </ul>
          </section>
            <div className="flex justify-center mt-5">
              <Pagination page={page} setPage={setPage} />
            </div>
          <Footer />
        </div>
      </main>
    </>
  );
};

export default App;
