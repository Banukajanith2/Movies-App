import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getContinueWatching, getUserFavoriteIds } from "../firebase/useFirestore";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";
import MediaSlider from "./MediaSlider.jsx";

const SkeletonRow = ({ accentColor }) => (
  <section className="media-slider-section">
    <div className="media-slider-header">
      <div className="media-slider-title-row">
        <span className={`media-slider-dot ${accentColor === "amber" ? "bg-amber-500" : "bg-indigo-500"}`} />
        <div className="h-5 w-56 rounded bg-brand-text/10 animate-pulse" />
      </div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 py-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[2/3] rounded-xl bg-brand-text/10" />
          <div className="h-3 w-4/5 rounded bg-brand-text/10 mt-2" />
        </div>
      ))}
    </div>
  </section>
);

/**
 * "Because you liked X" — seeded from the user's most recently *played* title of this media
 * type (so it updates itself the next time the homepage loads after pressing play elsewhere),
 * falling back to their most recently favorited title if they haven't watched anything yet.
 */
const BecauseYouLikedRow = ({ mediaType }) => {
  const { currentUser } = useAuth();
  const [seed, setSeed] = useState(null);
  const [status, setStatus] = useState("resolving"); // resolving | ready | unavailable
  const accentColor = mediaType === "tv" ? "amber" : "indigo";

  useEffect(() => {
    if (!currentUser) {
      setStatus("unavailable");
      return;
    }

    let cancelled = false;
    setStatus("resolving");

    const resolveSeed = async () => {
      try {
        const history = await getContinueWatching(currentUser.uid, 25);
        const recent = history.find((entry) => entry.type === mediaType);

        let id = recent?.id;
        let title = recent?.title;

        if (!id) {
          const { favoriteMovies, favoriteTvShows } = await getUserFavoriteIds(currentUser.uid);
          const favIds = mediaType === "tv" ? favoriteTvShows : favoriteMovies;
          if (favIds.length) {
            id = favIds[favIds.length - 1];
            const response = await fetch(`${API_BASE_URL}/${mediaType}/${id}?language=en-US`, API_OPTIONS);
            if (response.ok) {
              const data = await response.json();
              title = data.title || data.name;
            }
          }
        }

        if (cancelled) return;
        if (id && title) {
          setSeed({ id, title });
          setStatus("ready");
        } else {
          setStatus("unavailable");
        }
      } catch (error) {
        console.error(`Error resolving "Because you liked" seed for ${mediaType}:`, error);
        if (!cancelled) setStatus("unavailable");
      }
    };

    resolveSeed();
    return () => { cancelled = true; };
  }, [currentUser, mediaType]);

  if (status === "unavailable") return null;
  if (status === "resolving") return <SkeletonRow accentColor={accentColor} />;

  return (
    <MediaSlider
      title={`Because You Liked "${seed.title}"`}
      endpoint={`${API_BASE_URL}/${mediaType}/${seed.id}/recommendations?language=en-US`}
      accentColor={accentColor}
    />
  );
};

export default BecauseYouLikedRow;
