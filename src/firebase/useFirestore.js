import { db } from "./config";
import {
  doc,
  setDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  limit,
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

/**
 * CONTINUE WATCHING: One doc per title (keyed by type+id) in a user subcollection,
 * upserted every time the user presses play so `updatedAt` always reflects the latest watch.
 */
const MAX_CONTINUE_WATCHING_ENTRIES = 25;

// Upsert a "started watching" entry, then trim anything past the most recent N titles
// so the collection can't grow forever as a user watches more distinct movies/shows over time.
// Never throws — this is a background side-effect of pressing play.
export const recordContinueWatching = async (userId, item) => {
  try {
    const entriesRef = collection(db, "users", userId, "continueWatching");
    const entryRef = doc(entriesRef, `${item.type}-${item.id}`);
    await setDoc(entryRef, { ...item, updatedAt: serverTimestamp() }, { merge: true });

    const snapshot = await getDocs(query(entriesRef, orderBy("updatedAt", "desc")));
    const staleDocs = snapshot.docs.slice(MAX_CONTINUE_WATCHING_ENTRIES);
    if (staleDocs.length) {
      await Promise.all(staleDocs.map((docSnap) => deleteDoc(docSnap.ref)));
    }
  } catch (error) {
    console.error("Error recording continue-watching entry:", error);
  }
};

// Fetch the most recently watched titles, newest first.
export const getContinueWatching = async (userId, max = 12) => {
  try {
    const entriesRef = collection(db, "users", userId, "continueWatching");
    const snapshot = await getDocs(query(entriesRef, orderBy("updatedAt", "desc"), limit(max)));
    return snapshot.docs.map((docSnap) => docSnap.data());
  } catch (error) {
    console.error("Error fetching continue-watching list:", error);
    return [];
  }
};