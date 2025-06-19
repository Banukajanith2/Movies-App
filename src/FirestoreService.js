// firestoreService.js
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  orderBy,
  limit,
} from "firebase/firestore";
import db from "./Firebase.js";

const COLLECTION_NAME = "searchTerms"; // You can rename it as you like

export const updateSearchCount = async (searchTerm, movie) => {
  try {
    const searchKey = searchTerm.trim().toLowerCase(); // 🔑 normalized key

    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, where("searchKey", "==", searchKey));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      const currentCount = querySnapshot.docs[0].data().count;

      await updateDoc(docRef, {
        count: currentCount + 1,
      });
    } else {
      await addDoc(colRef, {
        searchKey, // used for matching
        searchTerm, // original input (for display)
        count: 1,
        movie_id: movie.id,
        poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      });
    }
  } catch (error) {
    console.error("Error updating/creating search term:", error);
  }
};

export const getTrendingMovies = async () => {
  try {
    const colRef = collection(db, COLLECTION_NAME);
    const q = query(colRef, orderBy("count", "desc"), limit(5));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return [];
  }
};
