import { useNavigate } from "react-router-dom";

const TvCard = ({
  tvShow: {
    id,
    name, // TMDB native property for TV titles
    vote_average,
    poster_path,
    first_air_date, // TMDB native property for TV premiere dates
    original_language,
  },
  className = "",
}) => {
  const navigate = useNavigate();

  // Convert TV title + id to a slug
  const createSlug = (name, id) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-") // replaces spaces and symbols with -
      .replace(/(^-|-$)/g, ""); // trims starting/ending dashes
    return `${slug}-${id}`;
  };

  const handleClick = () => {
    const slug = createSlug(name, id);
    navigate(`/tv/${slug}`); // Correctly pointing to your /tv route
  };

  return (
    <div className={className} onClick={handleClick}>
      <div className="type-badge">TV Show</div>
      <img
        src={
          poster_path
            ? `https://image.tmdb.org/t/p/w500/${poster_path}`
            : "no-movie.png" // keeping your fallback asset path intact
        }
        alt={name}
      />
      <div className="mt-4">
        <h3 className="h3title1">{name}</h3>
      </div>
      <div className="content">
        <h3 className="h3title2">{name}</h3>
        <div className="content2">
          <div className="rating">
            <img src="star.svg" alt="Star Icon" />
            <p>{vote_average ? vote_average.toFixed(1) : "N/A"}</p>
          </div>
          <span>•</span>
          <p className="lang">
            {original_language === "en" ? "English" : "Foreign"}
          </p>
          <p className="year">
            {first_air_date ? first_air_date.split("-")[0] : "N/A"}
          </p>
          <div className="watch">
            <p style={{ cursor: "pointer" }}>Watch Now →</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TvCard;