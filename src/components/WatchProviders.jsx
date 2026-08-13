import { useEffect, useState } from "react";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";

/** TMDB groups providers by ISO country code; these are the buckets we surface. */
const GROUPS = [
  { key: "flatrate", label: "Stream" },
  { key: "rent", label: "Rent" },
  { key: "buy", label: "Buy" },
];

/**
 * Legal "where to watch" providers for a title, from TMDB's /watch/providers.
 * TMDB sources this from JustWatch and requires the attribution link back to
 * their page, which is why the header always links out.
 */
const WatchProviders = ({ id, mediaType = "movie", region }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Best-effort region guess from the browser locale (e.g. "en-GB" → "GB")
  const country =
    region ||
    (typeof navigator !== "undefined" && navigator.language?.split("-")[1]?.toUpperCase()) ||
    "US";

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setData(null);

    const type = mediaType?.toLowerCase() === "tv" ? "tv" : "movie";

    const fetchProviders = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/${type}/${id}/watch/providers`, API_OPTIONS);
        if (!response.ok) throw new Error("Failed to fetch watch providers");
        const json = await response.json();
        setData(json.results?.[country] || json.results?.US || null);
      } catch (error) {
        console.error("Error fetching watch providers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [id, mediaType, country]);

  if (loading) {
    return (
      <div className="wp-card">
        <div className="wp-card-head"><span className="wp-card-title">Where to watch</span></div>
        <div className="wp-card-body flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-10 h-10 rounded-xl bg-brand-text/10 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const groups = GROUPS.map((g) => ({ ...g, items: data?.[g.key] || [] })).filter(
    (g) => g.items.length > 0
  );

  if (groups.length === 0) return null;

  return (
    <div className="wp-card">
      <div className="wp-card-head">
        <span className="wp-card-title">Where to watch</span>
        {data.link && (
          <a
            href={data.link}
            target="_blank"
            rel="noopener noreferrer"
            className="wp-card-count hover:brightness-110"
            title="Full availability on TMDB"
          >
            {country}
          </a>
        )}
      </div>

      <div className="wp-card-body flex flex-col gap-3">
        {groups.map((group) => (
          <div key={group.key}>
            <p className="provider-group-label">{group.label}</p>
            <div className="provider-row">
              {group.items.map((provider) => (
                <a
                  key={provider.provider_id}
                  href={data.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="provider-chip"
                  title={provider.provider_name}
                  aria-label={`${group.label} on ${provider.provider_name}`}
                >
                  <img
                    src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                    alt={provider.provider_name}
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          </div>
        ))}

        <p className="wp-hint">Availability data by JustWatch via TMDB.</p>
      </div>
    </div>
  );
};

export default WatchProviders;
