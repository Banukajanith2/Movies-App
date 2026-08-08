const MovieCardSkeleton = () => (
  <div className="animate-pulse">
    <div className="mcn-img-wrap bg-brand-text/10" />
    <div className="mcn-info">
      <div className="h-3.5 w-4/5 rounded bg-brand-text/10 mb-2" />
      <div className="h-3 w-2/5 rounded bg-brand-text/10" />
    </div>
  </div>
);

/** Renders `count` skeleton cards, matching the shape of a MovieCard/TvCard grid while data loads. */
export const MovieCardSkeletonGrid = ({ count = 20 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <MovieCardSkeleton key={i} />
    ))}
  </>
);

export default MovieCardSkeleton;
