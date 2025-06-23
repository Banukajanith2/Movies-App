import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "../hooks/useDebounce"; // Make sure this is correct
import { updateSearchCount } from "../FirestoreService";
import MovieCard from "../components/MovieCard";
import Spinner from "../components/Spinner";
import Search from "../components/Search";
import TrendingMovies from "../components/TrendingMovies";
import Footer from "../components/Footer";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const MoviePage = () => {
  const { slug } = useParams();
  const [movie, setMovie] = useState(null);
  const [pageloading, setPageLoading] = useState(true);
  const errornavigate = useNavigate();
  const homenavigate = useNavigate();
  const [showPlayer, setShowPlayer] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [movieList, setMovieList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  {/* Setting up the search function on top right */}
  //only fetch data when the search term changes and after 500 ms of typing using debounce
  const debouncedSearchTerm = useDebounce(searchTerm, 1000);

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

    useEffect(() => {
    if (debouncedSearchTerm) {
      fetchSearchMovies(debouncedSearchTerm);
    } else {
      setMovieList([]);
    }
  }, [debouncedSearchTerm]);


  {/*Using ID from slug to get the movie details and video*/}
  const movieId = slug.split("-").pop(); // Extract ID from slug

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const endpoint = `${API_BASE_URL}/movie/${movieId}?`;

        const response = await fetch(endpoint, API_OPTIONS);
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
  }, [movieId]);

  //console.log(movie);

  if (pageloading)
    return (
      <div className="fixed inset-0 bg-dark-100 flex items-center justify-center z-99">
        <Spinner />
      </div>
    );
  if (!movie) return errornavigate(`/404-Error`);

  const handleClick = () => {
    homenavigate("/");
  };

  return (
    <div className="relative">
      <img
        src="footer.png"
        alt=""
        className="z-0 hidden sm:block absolute bottom-0 w-full"
      />
      <div className="movie fade-in">
        <nav className="nav">
          <div className="nav-bar relative">
            <h1 className="nav-text" onClick={handleClick}>
              EZ Movies
            </h1>
            <div className="">
              <Search
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              className="search-nav"
            />
            {debouncedSearchTerm && (
                <section className="fade-in absolute top-[72px] right-0 z-20 w-65 sm:w-70 mx-auto h-120 overflow-y-scroll rounded-lg">
                  {isLoading ? (
                    <p className="text-gray-100 text-center">Loading...</p>
                  ) : errorMessage ? (
                    <p className="text-red-500">{errorMessage}</p>
                  ) : (
                    <ul className="animate-slide-up grid grid-cols-1">
                      {movieList.map((movie) => (
                        <MovieCard key={movie.id} movie={movie} className="search-card"/>
                      ))}
                    </ul>
                  )}
                </section>
              )}
            </div>
          </div>
        </nav>
        <div
          className="backdrop animate-slide-up"
          onClick={() => setShowPlayer(true)}
        >
          {showPlayer ? (
            <div className="player">
              <iframe
                className="iframe"
                src={`https://vidsrc.me/embed/movie?tmdb=${movie.id}`}
                referrerPolicy="origin"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <>
              <img
                className="backdrop-img"
                src={
                  movie.backdrop_path
                    ? `https://image.tmdb.org/t/p/w500/${movie.backdrop_path}`
                    : "no-movie.png"
                }
                alt="no-movie.png"
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
              src={
                movie.poster_path
                  ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
                  : "no-movie.png"
              }
              alt="no-movie.png"
            />
          </div>
          <div className="movie-info">
            <h2 className="mb-3">{movie.title}</h2>
            <p className="mb-3 overflow-y-scroll">
              <strong>Overview :</strong> {movie.overview}
            </p>
            <p>
              <strong>Release Date :</strong> {movie.release_date}
            </p>
            <p>
              <strong>Rating :</strong>{" "}
              {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}/10
            </p>
            <p>
              <strong>Language :</strong>{" "}
              {movie.original_language === "en"
                ? "English"
                : movie.spoken_languages?.[0]?.english_name ||
                  movie.original_language}
            </p>
            <p>
              <strong>Genre :</strong>{" "}
              {movie.genres.map((genre, key) => (
                <span key={key}>
                  {genre.name}
                  {key < movie.genres.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          </div>
        </div>
        <TrendingMovies scrollOnClick={true} />
        <Footer />
      </div>
    </div>
  );
};

export default MoviePage;
