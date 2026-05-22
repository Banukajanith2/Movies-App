import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";
import Spinner from "../components/Spinner";
import Navbar from "../components/Navbar";
import TrailerButton from "../components/TrailerButton";
import ImdbButton from "../components/ImdbButton";
import Footer from "../components/Footer";

const MoviePage = () => {
  const { slug } = useParams();
  const [movie, setMovie] = useState(null);
  const [pageloading, setPageLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const navigate = useNavigate();

  const movieId = slug?.split("-").pop();

  useEffect(() => {
    if (!movieId) return;
    const fetchMovieDetails = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/movie/${movieId}`, API_OPTIONS);
        if (!response.ok) throw new Error("Movie fetch failed");
        const data = await response.json();
        setMovie(data);
      } catch (error) {
        console.error("Error fetching movie details:", error);
        navigate("/404-Error");
      } finally {
        setPageLoading(false);
      }
    };
    fetchMovieDetails();
  }, [movieId, navigate]);

  if (pageloading)
    return (
      <div className="fixed inset-0 bg-dark-100 flex items-center justify-center z-[9999]">
        <Spinner />
      </div>
    );

  if (!movie) {
    navigate("/404-Error");
    return null;
  }

  return (
    <div className="relative">
      {/* Shared Navbar — no section refs needed on detail pages */}
      <Navbar />

      <div className="movie fade-in pt-20">
        {/* Backdrop / Player */}
        <div className="backdrop animate-slide-up" onClick={() => setShowPlayer(true)}>
          {showPlayer ? (
            <div className="player">
              <iframe
                className="iframe"
                src={`https://vidsrcme.ru/embed/movie?tmdb=${movie.id}`}
                referrerPolicy="origin"
                allowFullScreen
              />
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

        {/* Poster + Info */}
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
            <p><strong>Genre :</strong> {movie.genres?.map((genre, key) => (
              <span key={key}>{genre.name}{key < movie.genres.length - 1 ? ", " : ""}</span>
            ))}</p>
            <div className="flex items-center gap-3">
              <TrailerButton id={movie.id} mediaType="movie" />
              <ImdbButton id={movie.id} mediaType="movie" />
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default MoviePage;
