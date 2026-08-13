/**
 * Season-by-season overview for a series. Selecting a card drives the player's
 * season, so this doubles as navigation rather than being a dead info panel.
 */
const SeasonsOverview = ({ seasons = [], selectedSeason, onSelectSeason }) => {
  const real = seasons.filter((s) => s.season_number > 0);
  if (real.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex items-baseline gap-3 flex-wrap">
        <h2 className="section-heading">Seasons</h2>
        <span className="section-count">{real.length}</span>
      </div>

      <div className="season-grid">
        {real.map((season) => {
          const year = season.air_date ? season.air_date.split("-")[0] : null;
          const isActive = season.season_number === selectedSeason;

          return (
            <button
              key={season.id}
              onClick={() => onSelectSeason?.(season.season_number)}
              className={`season-card ${isActive ? "is-active" : ""}`}
              aria-pressed={isActive}
            >
              <span className="season-poster">
                {season.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w342${season.poster_path}`}
                    alt={season.name}
                    loading="lazy"
                  />
                ) : (
                  <span className="season-poster-fallback">S{season.season_number}</span>
                )}
                {isActive && <span className="season-badge">Watching</span>}
              </span>

              <span className="season-info">
                <span className="season-name">{season.name}</span>
                <span className="season-meta">
                  {[year, season.episode_count ? `${season.episode_count} eps` : null]
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

export default SeasonsOverview;
