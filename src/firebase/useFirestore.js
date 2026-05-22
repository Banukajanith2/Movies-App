import { db } from "./config";
import { doc, setDoc, arrayUnion, arrayRemove } from "firebase/firestore";

/**
 * MOVIE ACTIONS: Add or Remove TMDB IDs safely (Handles new accounts automatically)
 */
export const addMovieToFavorites = async (userId, movieId) => {
  const userRef = doc(db, "users", userId);
  
  // Changing updateDoc to setDoc + { merge: true } is what fixes your error
  await setDoc(userRef, {
    favoriteMovies: arrayUnion(Number(movieId))
  }, { merge: true });
};

export const removeMovieFromFavorites = async (userId, movieId) => {
  const userRef = doc(db, "users", userId);
  
  await setDoc(userRef, {
    favoriteMovies: arrayRemove(Number(movieId))
  }, { merge: true });
};

/**
 * TV SHOW ACTIONS: Add or Remove TMDB IDs safely (Handles new accounts automatically)
 */
export const addTvToFavorites = async (userId, tvId) => {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, {
    favoriteTvShows: arrayUnion(Number(tvId))
  }, { merge: true });
};

export const removeTvFromFavorites = async (userId, tvId) => {
  const userRef = doc(db, "users", userId);
  await setDoc(userRef, {
    favoriteTvShows: arrayRemove(Number(tvId))
  }, { merge: true });
};