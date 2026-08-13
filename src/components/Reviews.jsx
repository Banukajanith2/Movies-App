import { useEffect, useState } from "react";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";

const AVATAR_BASE = "https://image.tmdb.org/t/p/w185";

/** TMDB avatar paths are sometimes a full Gravatar URL prefixed with a slash. */
const avatarUrl = (path) => {
  if (!path) return null;
  return path.startsWith("/http") ? path.slice(1) : `${AVATAR_BASE}${path}`;
};

const formatDate = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
};

const ReviewCard = ({ review }) => {
  const [expanded, setExpanded] = useState(false);

  const author = review.author_details || {};
  const name = author.name?.trim() || review.author || "Anonymous";
  const avatar = avatarUrl(author.avatar_path);
  const rating = author.rating;
  const content = review.content || "";
  const isLong = content.length > 420;

  return (
    <article className="review-card">
      <header className="review-head">
        <span className="review-avatar">
          {avatar ? (
            <img src={avatar} alt="" loading="lazy" />
          ) : (
            <span className="review-avatar-initial">{name.charAt(0).toUpperCase()}</span>
          )}
        </span>

        <div className="min-w-0">
          <p className="review-author">{name}</p>
          {formatDate(review.created_at) && (
            <p className="review-date">{formatDate(review.created_at)}</p>
          )}
        </div>

        {rating != null && (
          <span className="review-rating">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
            </svg>
            {rating}
          </span>
        )}
      </header>

      <p className={`review-body ${expanded || !isLong ? "" : "is-clamped"}`}>{content}</p>

      {isLong && (
        <button className="review-toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Show less" : "Read full review"}
        </button>
      )}
    </article>
  );
};

/** Self-fetching TMDB user reviews. Renders nothing when a title has none. */
const Reviews = ({ id, mediaType = "movie" }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setReviews([]);
    setShowAll(false);

    const type = mediaType?.toLowerCase() === "tv" ? "tv" : "movie";

    const fetchReviews = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/${type}/${id}/reviews?language=en-US&page=1`,
          API_OPTIONS
        );
        if (!response.ok) throw new Error("Failed to fetch reviews");
        const data = await response.json();
        setReviews(data.results || []);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [id, mediaType]);

  if (loading) {
    return (
      <section className="mt-10">
        <h2 className="section-heading">Reviews</h2>
        <div className="review-grid">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="review-card animate-pulse">
              <div className="h-9 w-9 rounded-full bg-brand-text/10" />
              <div className="h-3 w-1/3 rounded bg-brand-text/10 mt-3" />
              <div className="h-2.5 w-full rounded bg-brand-text/10 mt-3" />
              <div className="h-2.5 w-5/6 rounded bg-brand-text/10 mt-2" />
              <div className="h-2.5 w-2/3 rounded bg-brand-text/10 mt-2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (reviews.length === 0) return null;

  const visible = showAll ? reviews : reviews.slice(0, 2);

  return (
    <section className="mt-10">
      <div className="flex items-baseline gap-3 flex-wrap">
        <h2 className="section-heading">Reviews</h2>
        <span className="section-count">{reviews.length}</span>
      </div>

      <div className="review-grid">
        {visible.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {reviews.length > 2 && (
        <button className="wp-ghost-btn mt-4" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Show fewer reviews" : `Show all ${reviews.length} reviews`}
        </button>
      )}
    </section>
  );
};

export default Reviews;
