import { useState, useEffect } from "react";
import MovieCard from "./MovieCard";
import TvCard from "./TvCard";
import { db } from "../firebase/config";
import { doc, deleteDoc, updateDoc, arrayRemove } from "firebase/firestore";

const PlaylistPage = ({ playlist, userId, onBack, onPlaylistDeleted }) => {
  const [items, setItems] = useState([]);

  // Load and sort items: latest added items on top
  useEffect(() => {
    if (playlist?.items) {
      setItems([...playlist.items].reverse());
    }
  }, [playlist]);

  // Handle deleting the entire playlist document
  const handleDeletePlaylist = async () => {
    if (!userId) return alert("User reference missing.");

    const confirmDelete = window.confirm(
      `Are you sure you want to delete the entire "${playlist.name}" playlist?`
    );
    
    if (!confirmDelete) return;

    try {
      const playlistRef = doc(db, "users", userId, "playlists", playlist.id);
      await deleteDoc(playlistRef);
      
      if (onPlaylistDeleted) {
        onPlaylistDeleted(playlist.id);
      } else {
        onBack();
      }
    } catch (error) {
      console.error("Error deleting playlist document:", error);
      alert("Failed to delete the playlist. Please try again.");
    }
  };

  // Handle removing a single item from the items array
  const handleRemoveItem = async (itemToRemove) => {
    if (!userId) return alert("User reference missing.");

    // Snappy UI: Optimistically filter out item from local runtime state right away
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemToRemove.id));

    try {
      const playlistRef = doc(db, "users", userId, "playlists", playlist.id);
      await updateDoc(playlistRef, {
        items: arrayRemove(itemToRemove),
      });
    } catch (error) {
      console.error("Error removing item from playlist array:", error);
      // Revert local state to keep UI accurate if backend write fails
      setItems([...playlist.items].reverse());
    }
  };

  // Safe Date Formatting parser for Firestore timestamps or fallback strings
  const displayDate = playlist?.createdAt?.seconds
    ? new Date(playlist.createdAt.seconds * 1000).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : playlist?.createdAt || "N/A";

  return (
    <div className="w-full animate-fadeIn pb-12">
      
      {/* ─── HEADER ROW (Title, Info & Main Actions) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-start gap-3">
          <button 
            onClick={onBack}
            className="mt-1 p-1.5 hover:bg-indigo-500 rounded-2xl text-gray-400 hover:text-white transition-all cursor-pointer shadow-md"
            title="Back to Dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          
          <div>
            <p className="text-2xl lg:text-3xl font-bold tracking-wide text-white">{playlist.name}</p>
            <p className="text-xs text-zinc-500 mt-1.5 font-medium tracking-normal">
              Created: {displayDate} <span className="mx-2 text-zinc-700">•</span> {items.length} Items
            </p>
          </div>
        </div>

        <button
          onClick={handleDeletePlaylist}
          className="bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs lg:text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-500/10 active:scale-[0.98] cursor-pointer shrink-0 sm:self-center"
        >
          Delete Playlist
        </button>
      </div>

      {/* ─── DISPLAY GRID (5 Items Per Row Configuration) ─── */}
      {items.length === 0 ? (
        <div className="w-full border border-dashed border-white/10 rounded-2xl py-16 flex flex-col items-center justify-center text-zinc-500 gap-2">
          <span className="text-sm font-medium tracking-wide">This playlist contains no items</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6">
          {items.map((item) => {
            // Determine structural type safely
            const isMovie = item.type 
              ? item.type === "movie" 
              : (item.title !== undefined || item.release_date !== undefined);

            // 🔥 DATA ADAPTER: Fixes cross-property naming mismatches between TMDB Movies (.title) and TV Shows (.name)
            const adaptedItem = {
              ...item,
              title: item.title || item.name, // Guarantees MovieCard gets a valid string fallback
              name: item.name || item.title,   // Guarantees TvCard gets a valid string fallback
            };

            return (
              <div key={item.id} className="flex flex-col gap-3 group h-full justify-between">
                <div>
                  {isMovie ? (
                    <MovieCard movie={adaptedItem} />
                  ) : (
                    <TvCard tvShow={adaptedItem} />
                  )}
                </div>
                
                <button
                  onClick={() => handleRemoveItem(item)}
                  className="w-full bg-[#ff5a5a] hover:bg-[#e04444] text-white text-xs font-semibold py-2 rounded-xl transition-colors duration-200 shadow-md shadow-red-500/5 cursor-pointer mt-1"
                >
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PlaylistPage;