import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Spinner from "../components/Spinner";

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
  const navigate = useNavigate();

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
        <Spinner />
      </div>
    );
  if (!movie) return navigate(`/404-Error`);

  return (
    <div className="movie-detail-page">
      <h1>{movie.title}</h1>
      <img
        src={
          movie.backdrop_path
            ? `https://image.tmdb.org/t/p/w500/${movie.backdrop_path}`
            : "no-movie.png"
        }
        alt="no-movie.png"
      />
      <img
        src={
          movie.poster_path
            ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
            : "no-movie.png"
        }
        alt="no-movie.png"
      />
      <h2>
        <strong>Overview:</strong> {movie.overview}
      </h2>
      <h2>
        <strong>Release Date:</strong> {movie.release_date}
      </h2>
      <h2>
        <strong>Rating:</strong>{" "}
        {movie.vote_average ? movie.vote_average.toFixed(1) : "N/A"}/10
      </h2>
      <h2>
        <strong>Language:</strong>{" "}
        {movie.original_language === "en" ? "English" : movie.original_language}
      </h2>
      <h2>
        Genres:{" "}
        {movie.genres.map((genre, key) => (
          <span key={key}>
            {genre.name}
            {key < movie.genres.length - 1 ? ", " : ""}
          </span>
        ))}
      </h2>
      <div>
        <iframe
          src={`https://vidsrc.me/embed/movie?tmdb=${movie.id}`}
          width="100%"
          height="500"
          referrerPolicy="origin"
          allowFullScreen
        ></iframe>
      </div>
      
    </div>
  );
};

export default MoviePage;
