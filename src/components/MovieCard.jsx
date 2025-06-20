import { useNavigate } from "react-router-dom";

const MovieCard = ({
  movie: {
    id,
    title,
    vote_average,
    poster_path,
    release_date,
    original_language,
  },
}) => {
  const navigate = useNavigate();

  // Convert movie title + id to a slug
  const createSlug = (title, id) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // replaces spaces and symbols with -
      .replace(/(^-|-$)/g, "");    // trims starting/ending dashes
    return `${slug}-${id}`;
  };
  
  const handleClick = () => {
    const slug = createSlug(title, id);
    navigate(`/movie/${slug}`);
  };

  return (
    <div className="movie-card" onClick={handleClick}>
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
        <p className="lang">{original_language === "en" ? "English" : "Foreign"}</p>
        <span>•</span>
        <p className="year">
          {release_date ? release_date.split("-")[0] : "N/A"}
        </p>
        <div className="watch">
          <p style={{ cursor: "pointer" }}>
            Watch Now →
          </p>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
