import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "../components/Spinner";
import Search from "../components/Search";
import TrendingMovies from "../components/TrendingMovies";

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

  console.log(movie);

  if (pageloading)
    return (
      <div className="fixed inset-0 bg-dark-100 flex items-center justify-center z-99">
        <Spinner/>
      </div>
    );
  if (!movie) return errornavigate(`/404-Error`);

  const handleClick = () => {
    homenavigate("/");
  };

  return (
    <div className="relative">
    <img src="footer.png" alt=""className="z-0 hidden sm:block absolute bottom-0 w-full"/>
    <div className="movie fade-in">
      <nav className="nav">
        <div className="nav-bar">
          <h1 className="nav-text" onClick={handleClick}>
            EZ Movies
          </h1>
          <Search
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            className="search-nav"
          />
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
      <TrendingMovies />
      <footer className="bg-transparent p-5 mt-5 rounded-2xl z-10">
        <div className="flex flex-col items-center gap-4">
          <div className="social-icons">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                className="w-6 h-6"
                viewBox="0 0 24 24"
              >
                <path d="M22 12a10 10 0 10-11.5 9.9v-7H8v-2.9h2.5v-2.2c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.5v1.9h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z" />
              </svg>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                className="w-6 h-6"
                viewBox="0 0 24 24"
              >
                <path d="M22.46 6c-.77.35-1.6.59-2.46.7a4.27 4.27 0 001.88-2.37 8.53 8.53 0 01-2.7 1.03 4.25 4.25 0 00-7.24 3.87 12.06 12.06 0 01-8.77-4.45 4.23 4.23 0 001.32 5.68 4.22 4.22 0 01-1.93-.54v.05a4.25 4.25 0 003.41 4.17 4.27 4.27 0 01-1.92.07 4.25 4.25 0 003.96 2.94 8.52 8.52 0 01-6.29 1.75 12.03 12.03 0 006.49 1.9c7.78 0 12.03-6.45 12.03-12.03 0-.18-.01-.35-.02-.53A8.55 8.55 0 0024 4.56a8.39 8.39 0 01-2.54.7z" />
              </svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                className="w-6 h-6"
                viewBox="0 0 24 24"
              >
                <path d="M7.75 2A5.75 5.75 0 002 7.75v8.5A5.75 5.75 0 007.75 22h8.5A5.75 5.75 0 0022 16.25v-8.5A5.75 5.75 0 0016.25 2h-8.5zm0 1.5h8.5c2.35 0 4.25 1.9 4.25 4.25v8.5c0 2.35-1.9 4.25-4.25 4.25h-8.5A4.25 4.25 0 013.5 16.25v-8.5C3.5 5.9 5.4 4 7.75 4zM12 7a5 5 0 100 10 5 5 0 000-10zm0 1.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zm5.5-.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" />
              </svg>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                className="w-6 h-6"
                viewBox="0 0 24 24"
              >
                <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8.5h5v15H0v-15zM7.5 8.5h4.7v2.1h.1c.66-1.2 2.3-2.4 4.7-2.4 5 0 5.9 3.3 5.9 7.6v8.2h-5v-7.3c0-1.8-.03-4.1-2.5-4.1-2.5 0-2.9 2-2.9 4v7.4h-5v-15z" />
              </svg>
            </a>
          </div>
          <p className="text-gray-100 font-light text-xs">
            © 2025 EZ Movies - By{" "}
            <a
              href="https://github.com/Banukajanith2"
              target="_blank"
              className="underline hover:no-underline"
            >
              Banuka Janith
            </a>
          </p>
        </div>
      </footer>
    </div>
    </div>
  );
};

export default MoviePage;
