/**
 * TMDB exposes only an average and a vote count — there is no per-star
 * distribution in the API — so this renders the average as a ring plus the
 * sample size, rather than a fake histogram.
 */
const RatingGauge = ({ value, count, label = "TMDB rating" }) => {
  if (!value) return null;

  const score = Math.max(0, Math.min(10, Number(value)));
  const pct = score / 10;

  // r=26 circle: circumference used to drive stroke-dashoffset
  const CIRCUMFERENCE = 2 * Math.PI * 26;
  const offset = CIRCUMFERENCE * (1 - pct);

  const tone = score >= 7 ? "is-good" : score >= 5 ? "is-mixed" : "is-poor";

  const formattedCount =
    count > 0
      ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(count)
      : null;

  return (
    <div className={`rating-gauge ${tone}`}>
      <div className="rating-gauge-ring">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle className="rating-gauge-track" cx="32" cy="32" r="26" />
          <circle
            className="rating-gauge-value"
            cx="32"
            cy="32"
            r="26"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="rating-gauge-score">{score.toFixed(1)}</span>
      </div>

      <div className="rating-gauge-meta">
        <p className="rating-gauge-label">{label}</p>
        <p className="rating-gauge-count">
          {formattedCount ? `${formattedCount} votes` : "Not enough votes"}
        </p>
      </div>
    </div>
  );
};

export default RatingGauge;
