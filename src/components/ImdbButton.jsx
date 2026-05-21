import { useEffect, useState } from "react";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";

const ImdbButton = ({ id, mediaType = "movie" }) => {
  const [imdbId, setImdbId] = useState("");

  useEffect(() => {
    if (!id) return;

    // Clear old state instantly on ID/route changes
    setImdbId("");

    const formattedMediaType = 
      mediaType?.toLowerCase() === "tv" || mediaType?.toLowerCase() === "tvshow" 
        ? "tv" 
        : "movie";

    const fetchExternalIds = async () => {
      try {
        const endpoint = `${API_BASE_URL}/${formattedMediaType}/${id}/external_ids`;
        const response = await fetch(endpoint, API_OPTIONS);
        if (!response.ok) throw new Error("Failed to fetch external IDs");

        const data = await response.json();
        if (data.imdb_id) {
          setImdbId(data.imdb_id);
        }
      } catch (error) {
        console.error("Error fetching IMDb ID:", error);
      }
    };

    fetchExternalIds();
  }, [id, mediaType]);

  if (!imdbId) return null;

  return (
    <a 
      href={`https://www.imdb.com/title/${imdbId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 mt-3 mb-3 bg-dark-200 hover:bg-dark-200/30 text-white font-medium text-sm px-4 py-1.5 rounded-2xl transition-all duration-200 cursor-pointer w-fit h-12 border border-white/5"
    >
      {/* Pure CSS IMDb Yellow Badge */}
      <span className="bg-[#f5c518] text-black font-black text-[11px] px-1.5 py-0.5 rounded-md tracking-tighter select-none">
        IMDb
      </span>
      <span>Ratings</span>
    </a>
  );
};

export default ImdbButton;