import { useEffect, useState } from "react";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";

const TrailerButton = ({ id, mediaType = "movie" }) => {
  const [trailerKey, setTrailerKey] = useState("");

  useEffect(() => {
    if (!id) return;

    // 1. Clear old trailer keys immediately when the ID or media type changes
    setTrailerKey("");

    // 2. Sanitize mediaType strings defensively (e.g., handles "tv", "tvShow", "TV")
    const formattedMediaType = 
      mediaType?.toLowerCase() === "tv" || mediaType?.toLowerCase() === "tvshow" 
        ? "tv" 
        : "movie";

    const fetchTrailer = async () => {
      try {
        const endpoint = `${API_BASE_URL}/${formattedMediaType}/${id}/videos`;
        const response = await fetch(endpoint, API_OPTIONS);
        if (!response.ok) throw new Error("Failed to fetch videos");

        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          // 3. Robust fallback chain tailored for TV Show tagging conventions
          const trailer = data.results.find(
            (vid) => vid.site === "YouTube" && vid.type === "Trailer" && vid.official === true
          ) || data.results.find(
            (vid) => vid.site === "YouTube" && vid.type === "Trailer"
          ) || data.results.find(
            (vid) => vid.site === "YouTube" && vid.type === "Teaser" && vid.official === true
          ) || data.results.find(
            (vid) => vid.site === "YouTube" && vid.type === "Teaser"
          ) || data.results.find(
            (vid) => vid.site === "YouTube"
          );

          if (trailer) {
            setTrailerKey(trailer.key);
          }
        }
      } catch (error) {
        console.error("Error fetching trailer:", error);
      }
    };

    fetchTrailer();
  }, [id, mediaType]);

  if (!trailerKey) return null;

  return (
    <a 
      href={`https://www.youtube.com/watch?v=${trailerKey}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 mt-3 mb-3 bg-dark-200 hover:bg-dark-200/30 text-white font-medium text-sm px-4 py-1.5 rounded-2xl transition-all duration-200 cursor-pointer w-fit h-12 border border-white/5"
    >
      <svg className="w-4 h-4 text-red-500 fill-current" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
      Watch Trailer
    </a>
  );
};

export default TrailerButton;