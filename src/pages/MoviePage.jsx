import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";
import MovieCard from "../components/MovieCard";
import TvCard from "../components/TvCard";
import Spinner from "../components/Spinner";
import Search from "../components/Search";
import TrailerButton from "../components/TrailerButton";
import ImdbButton from "../components/ImdbButton";
import TrendingMovies from "../components/TrendingMovies";
import Footer from "../components/Footer";

const MoviePage = () => {
  const { slug } = useParams();
  const [movie, setMovie] = useState(null);
  const [pageloading, setPageLoading] = useState(true);
  const navigate = useNavigate();

  const [showPlayer, setShowPlayer] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 1000);

  const fetchUnifiedSearch = async (query, pageNumber = 1) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const endpoint = `${API_BASE_URL}/search/multi?query=${encodeURIComponent(query)}&page=${pageNumber}&language=en-US`;
      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) throw new Error("Failed to fetch search results");

      const data = await response.json();
      const filteredMedia = (data.results || []).filter(
        (item) => item.media_type === "movie" || item.media_type === "tv"
      );

      setSearchResults(filteredMedia);

      if (filteredMedia.length === 0) setErrorMessage("No results found");
    } catch (error) {
      setErrorMessage("Error fetching results: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (debouncedSearchTerm) {
      fetchUnifiedSearch(debouncedSearchTerm);
    } else {
      setSearchResults([]);
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

  const movieId = slug?.split("-").pop();

  useEffect(() => {
    if (!movieId) return;

    const fetchMovieDetails = async () => {
      try {
        const endpoint = `${API_BASE_URL}/movie/${movieId}`;
        const response = await fetch(endpoint, API_OPTIONS);
        if (!response.ok) throw new Error("Movie fetch failed");

        const data = await response.json();
        setMovie(data);
      } catch (error) {
        console.error("Error fetching movie details:", error);
        navigate(`/404-Error`);
      } finally {
        setPageLoading(false);
      }
    };
    fetchMovieDetails();
  }, [movieId, navigate]);

  if (pageloading)
    return (
      <div className="fixed inset-0 bg-dark-100 flex items-center justify-center z-99">
        <Spinner />
      </div>
    );

  if (!movie) {
    navigate(`/404-Error`);
    return null;
  }

  const homeClick = () => navigate("/");

  return (
    <div className="relative">
      <img src="footer.png" alt="" className="z-0 hidden sm:block absolute bottom-0 w-full" />
      
      {/* Added pt-18 to prevent content from slipping under the fixed nav bar */}
      <div className="movie fade-in pt-18">
        
        {/* Updated nav with fixed positioning, glassmorphism blur, background, and high z-index */}
        <nav className="nav fixed top-0 left-0 right-0 z-50 bg-[#06040d]/80 backdrop-blur-md">
          <div className="nav-bar">
            <h1 className="nav-text" onClick={homeClick}>EZ Movies</h1>
            <div className="relative" ref={wrapperRef}>
              <Search
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                className="search-nav"
                onFocus={() => setIsDropdownOpen(true)}
              />
              {debouncedSearchTerm && isDropdownOpen && (
                <section onClick={() => setIsDropdownOpen(false)} className="fade-in absolute top-12 right-0 z-20 w-[100vw] sm:w-md transition3s mx-auto rounded-lg bg-dark-100">
                  {isLoading ? (
                    <p className="text-gray-100 text-center">Loading...</p>
                  ) : errorMessage ? (
                    <p className="text-red-500">{errorMessage}</p>
                  ) : (
                    <div className="relative">
                      <ul className="animate-slide-up grid grid-cols-1 max-h-120 overflow-y-scroll pb-10">
                        {searchResults.map((item) => (
                          <li key={item.id}>
                            {item.media_type === "movie" ? (
                              <MovieCard movie={item} className="moviesearch-card-nav" />
                            ) : (
                              <TvCard tvShow={item} className="tvsearch-card-nav" />
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
          </div>
        </nav>

        <div className="backdrop animate-slide-up" onClick={() => setShowPlayer(true)}>
          {showPlayer ? (
            <div className="player">
              <iframe
                className="iframe"
                src={`https://vidsrcme.ru/embed/movie?tmdb=${movie.id}`}
                referrerPolicy="origin"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <>
              <img
                className="backdrop-img"
                src={movie.backdrop_path ? `https://image.tmdb.org/t/p/w500/${movie.backdrop_path}` : "no-movie.png"}
                alt={movie.title}
              />
              <svg
                className="play-icon"
                onClick={() => setShowPlayer(true)}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z"
                  clipRule="evenodd"
                />
              </svg>
            </>
          )}
        </div>

        <div className="poster-and-info animate-slide-up">
          <div className="poster">
            <img
              className="poster-img"
              src={movie.poster_path ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}` : "no-movie.png"}
              alt={movie.title}
            />
          </div>
          <div className="movie-info">
            <h2 className="mb-3">{movie.title}</h2>
            <p className="mb-4 overflow-y-scroll">{movie.overview}</p>
            <p><strong>Release Date :</strong> {movie.release_date}</p>
            <p><strong>IMDb :</strong> {movie.vote_average?.toFixed(1) || "N/A"}/10</p>
            <p><strong>Language :</strong> {movie.original_language === "en" ? "English" : movie.spoken_languages?.[0]?.english_name || movie.original_language}</p>
            <p><strong>Genre :</strong> {movie.genres?.map((genre, key) => (<span key={key}>{genre.name}{key < movie.genres.length - 1 ? ", " : ""}</span>))}</p>
            <div className="flex items-center gap-3">
              <TrailerButton id={movie.id} mediaType="movie" />
              <ImdbButton id={movie.id} mediaType="movie" />
            </div>
          </div>
        </div>

        <TrendingMovies scrollOnClick={true} />
        <Footer />
      </div>
    </div>
  );
};

export default MoviePage;