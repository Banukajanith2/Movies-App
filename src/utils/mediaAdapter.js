/** True for a stored Firestore media item (playlist/continue-watching entry) representing a movie. */
export const isMovieItem = (item) =>
  item.type ? item.type === "movie" : (item.title !== undefined || item.release_date !== undefined);

/**
 * Maps our compact Firestore item shape ({ title, year, rating, language })
 * back into the TMDB-shaped fields MovieCard/TvCard expect (vote_average, release_date, etc.).
 */
export const adaptStoredMediaItem = (item) => ({
  ...item,
  title: item.title || item.name,
  name: item.name || item.title,
  vote_average: item.rating !== undefined ? item.rating : item.vote_average,
  release_date: item.year ? String(item.year) : item.release_date,
  first_air_date: item.year ? String(item.year) : item.first_air_date,
  original_language: item.language || item.original_language,
});
