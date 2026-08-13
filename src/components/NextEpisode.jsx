/**
 * "Next episode" card for returning series.
 *
 * Uses `next_episode_to_air`, which TMDB already includes in the /tv/{id}
 * response the page fetches — no extra request.
 */

/** Whole-day difference, so "tomorrow" doesn't flip based on the clock. */
const daysUntil = (isoDate) => {
  const air = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(air.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((air - today) / 86400000);
};

const countdownLabel = (isoDate) => {
  const days = daysUntil(isoDate);
  if (days === null) return null;
  if (days === 0) return "Airs today";
  if (days === 1) return "Airs tomorrow";
  if (days <= 21) return `In ${days} days`;
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const formatAirDate = (isoDate) => {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const NextEpisode = ({ episode, onSelect }) => {
  if (!episode?.air_date) return null;

  // TMDB's next_episode_to_air lags for a day or two after an episode drops.
  // Showing a "Next episode" card for something already out reads as broken.
  const days = daysUntil(episode.air_date);
  if (days === null || days < 0) return null;

  const label = countdownLabel(episode.air_date);
  const isSoon = ["Airs today", "Airs tomorrow"].includes(label);

  return (
    <div className="wp-card next-ep-card">
      <div className="wp-card-head">
        <span className="wp-card-title">Next episode</span>
        <span className={`wp-card-count ${isSoon ? "is-soon" : ""}`}>{label}</span>
      </div>

      <button
        className="next-ep-body"
        onClick={() => onSelect?.(episode.season_number, episode.episode_number)}
        title="Jump to this episode"
      >
        <span className="next-ep-code">
          S{episode.season_number} · E{episode.episode_number}
        </span>
        <span className="next-ep-name">{episode.name || "Title to be announced"}</span>
        <span className="next-ep-date">{formatAirDate(episode.air_date)}</span>
      </button>
    </div>
  );
};

export default NextEpisode;
