import { db } from "./config";
import { 
  doc, 
  setDoc, 
  arrayUnion, 
  arrayRemove, 
  collection, 
  addDoc, 
  getDocs, 
  serverTimestamp 
} from "firebase/firestore";

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

/**
 * CUSTOM PLAYLIST ACTIONS: Manage mixed-media lists as user subcollections
 */

// Fetch all custom playlists created by a specific user
export const getUserPlaylists = async (userId) => {
  try {
    const playlistsRef = collection(db, "users", userId, "playlists");
    const snapshot = await getDocs(playlistsRef);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching user playlists:", error);
    throw error;
  }
};

// Create an entirely new playlist subcollection document and append its initial media object
export const createPlaylistAndAddItem = async (userId, playlistName, item) => {
  try {
    const playlistsRef = collection(db, "users", userId, "playlists");
    await addDoc(playlistsRef, {
      name: playlistName,
      createdAt: serverTimestamp(),
      items: [item] // Expects format: { id, type, title, poster_path }
    });
  } catch (error) {
    console.error("Error creating playlist and adding item:", error);
    throw error;
  }
};

// Add a movie or TV show item to a specific playlist that already exists
export const addItemToPlaylist = async (userId, playlistId, item) => {
  try {
    const playlistDocRef = doc(db, "users", userId, "playlists", playlistId);
    
    // Using setDoc + merge keeps document writing consistent across your codebase 
    await setDoc(playlistDocRef, {
      items: arrayUnion(item)
    }, { merge: true });
  } catch (error) {
    console.error("Error pushing item to existing playlist:", error);
    throw error;
  }
};