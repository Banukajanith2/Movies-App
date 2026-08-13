import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";
import { srcSet } from "../utils/tmdbImage";

const createSlug = (title, id) =>
  `${(title || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${id}`;

/**
 * Franchise navigation for films that belong to a TMDB collection.
 *
 * `belongs_to_collection` is already on the movie payload; this fetches
 * /collection/{id} for the sibling films. Renders nothing when a film isn't
 * part of a collection, which is the common case.
 */
const CollectionRow = ({ collection, currentMovieId }) => {
  const navigate = useNavigate();
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);

  const collectionId = collection?.id;

  useEffect(() => {
    if (!collectionId) return;
    setLoading(true);
    setParts([]);

    const fetchCollection = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/collection/${collectionId}?language=en-US`,
          API_OPTIONS
        );
        if (!response.ok) throw new Error("Failed to fetch collection");
        const data = await response.json();

        // Oldest first; undated entries (unreleased sequels) sort to the end
        const ordered = (data.parts || []).sort((a, b) =>
          (a.release_date || "9999").localeCompare(b.release_date || "9999")
        );
        setParts(ordered);
      } catch (error) {
        console.error("Error fetching collection:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [collectionId]);

  if (!collectionId) return null;
  if (!loading && parts.length < 2) return null;

  return (
    <section className="mt-10">
      <div className="flex items-baseline gap-3 flex-wrap">
        <h2 className="section-heading">{collection.name}</h2>
        {!loading && <span className="section-count">{parts.length}</span>}
      </div>

      <div className="season-grid">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="season-card animate-pulse">
                <div className="season-poster" />
                <div className="season-info">
                  <div className="h-3 w-4/5 rounded bg-brand-text/10" />
                  <div className="h-2.5 w-2/5 rounded bg-brand-text/10 mt-2" />
                </div>
              </div>
            ))
          : parts.map((part) => {
              const isCurrent = Number(part.id) === Number(currentMovieId);
              const year = part.release_date ? part.release_date.split("-")[0] : "TBA";

              return (
                <button
                  key={part.id}
                  onClick={() => navigate(`/movie/${createSlug(part.title, part.id)}`)}
                  className={`season-card ${isCurrent ? "is-active" : ""}`}
                  aria-current={isCurrent ? "true" : undefined}
                >
                  <span className="season-poster">
                    {part.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w342${part.poster_path}`}
                        srcSet={srcSet(part.poster_path)}
                        sizes="(min-width: 1024px) 230px, (min-width: 640px) 30vw, 45vw"
                        alt={part.title}
                        loading="lazy"
                      />
                    ) : (
                      <span className="season-poster-fallback">{year}</span>
                    )}
                    {isCurrent && <span className="season-badge">You're here</span>}
                  </span>

                  <span className="season-info">
                    <span className="season-name">{part.title}</span>
                    <span className="season-meta">
                      {[year, part.vote_average > 0 ? `★ ${part.vote_average.toFixed(1)}` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </button>
              );
            })}
      </div>
    </section>
  );
};

export default CollectionRow;
