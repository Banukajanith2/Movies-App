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
      className="ui-pill-btn"
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