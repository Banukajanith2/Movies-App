import { useState, useEffect } from "react";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";

const PILL_COLORS = [
  "genre-pill-indigo",
  "genre-pill-amber",
  "genre-pill-slate",
  "genre-pill-violet",
  "genre-pill-amber",
  "genre-pill-indigo",
];

const GenreBrowser = ({ sectionRef }) => {
  const [movieGenres, setMovieGenres] = useState([]);
  const [tvGenres, setTvGenres] = useState([]);
  const [activeTab, setActiveTab] = useState("movie");

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const [movRes, tvRes] = await Promise.all([
          fetch(`${API_BASE_URL}/genre/movie/list?language=en-US`, API_OPTIONS),
          fetch(`${API_BASE_URL}/genre/tv/list?language=en-US`, API_OPTIONS),
        ]);
        const movData = await movRes.json();
        const tvData = await tvRes.json();
        setMovieGenres(movData.genres || []);
        setTvGenres(tvData.genres || []);
      } catch (error) {
        console.error("Genre fetch error:", error);
      }
    };
    fetchGenres();
  }, []);

  const currentGenres = activeTab === "movie" ? movieGenres : tvGenres;

  return (
    <section className="genre-section" ref={sectionRef}>
      <div className="genre-header">
        <div className="media-slider-title-row">
          <span className="media-slider-dot bg-purple-500" />
          <h2 className="media-slider-title text-purple-400">Browse by Genre</h2>
        </div>

        <div className="genre-tab-toggle">
          <button
            className={`genre-tab-btn ${activeTab === "movie" ? "genre-tab-active" : ""}`}
            onClick={() => setActiveTab("movie")}
          >
            Movies
          </button>
          <button
            className={`genre-tab-btn ${activeTab === "tv" ? "genre-tab-active-tv" : ""}`}
            onClick={() => setActiveTab("tv")}
          >
            TV Shows
          </button>
        </div>
      </div>

      <div className="genre-grid">
        {currentGenres.map((genre, i) => (
          <button
            key={genre.id}
            className={`genre-pill ${PILL_COLORS[i % PILL_COLORS.length]}`}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            {genre.name}
          </button>
        ))}
      </div>
    </section>
  );
};

export default GenreBrowser;
