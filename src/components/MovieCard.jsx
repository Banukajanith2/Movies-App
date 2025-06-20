import React from "react";
import { useNavigate } from "react-router-dom";
useNavigate

const MovieCard = ({movie: { title, vote_average, poster_path, release_date, original_language },}) => {

  const navigate = useNavigate(); // Hook to navigate programmatically

  const handleClick = () => {
    navigate("/movies"); // 👈 navigate to any route you want
  };

  return (
    <div className="movie-card">
      <img
        src={
          poster_path
            ? `https://image.tmdb.org/t/p/w500/${poster_path}`
            : "no-movie.png"
        }
        alt={title}
      />
      <div className="mt-4">
        <h3>{title}</h3>
      </div>
      <div className="content">
        <div className="rating">
          <img src="star.svg" alt="Star Icon" />
          <p>{vote_average ? vote_average.toFixed(1) : "N/A"}</p>
        </div>
        <span>•</span>
        <p className="lang">{original_language ? 'English' : 'Foreign'}</p>
        <span>•</span>
        <p className="year">
          {release_date ? release_date.split("-")[0] : "N/A"}
        </p>
        <div className="watch">
          <p onClick={handleClick}>
            Watch Now →
          </p>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
