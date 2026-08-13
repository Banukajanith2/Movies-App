import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";
import { useNavigate } from "react-router-dom";
import { profileSrcSet } from "../utils/tmdbImage";
import "swiper/css";
import "swiper/css/navigation";

const PersonAvatar = ({ profilePath, name }) =>
  profilePath ? (
    <img
      src={`https://image.tmdb.org/t/p/w185${profilePath}`}
      srcSet={profileSrcSet(profilePath)}
      sizes="96px"
      alt={name}
      loading="lazy"
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-brand-bg text-muted">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    </div>
  );

const CastCrewSkeleton = () => (
  <div className="flex gap-4 overflow-hidden py-1">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="shrink-0 w-24 animate-pulse">
        <div className="aspect-[2/3] rounded-xl bg-brand-text/10" />
        <div className="h-2.5 w-4/5 rounded bg-brand-text/10 mt-2" />
        <div className="h-2 w-3/5 rounded bg-brand-text/10 mt-1.5" />
      </div>
    ))}
  </div>
);

/**
 * Self-fetching cast (and, for movies, director) section.
 * `creators` lets TV pages pass along `created_by` names already present on the show's own payload
 * instead of parsing crew job titles, which TMDB doesn't tag consistently for TV.
 */
const createSlug = (name, id) =>
  `${(name || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${id}`;

const CastCrew = ({ id, mediaType = "movie", creators = [] }) => {
  const navigate = useNavigate();
  const [cast, setCast] = useState([]);
  const [director, setDirector] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setCast([]);
    setDirector("");

    const formattedMediaType = mediaType?.toLowerCase() === "tv" ? "tv" : "movie";

    const fetchCredits = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/${formattedMediaType}/${id}/credits?language=en-US`, API_OPTIONS);
        if (!response.ok) throw new Error("Failed to fetch credits");
        const data = await response.json();
        setCast((data.cast || []).slice(0, 15));

        if (formattedMediaType === "movie") {
          const directorEntry = (data.crew || []).find((member) => member.job === "Director");
          if (directorEntry) setDirector(directorEntry.name);
        }
      } catch (error) {
        console.error("Error fetching cast & crew:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
  }, [id, mediaType]);

  const directedOrCreatedBy = director || creators.join(", ");

  if (!loading && cast.length === 0 && !directedOrCreatedBy) return null;

  return (
    <section className="mt-8">
      <div className="flex items-baseline gap-3 mb-4 flex-wrap">
        <h2 className="text-lg sm:text-xl font-bold text-brand-text">Cast &amp; Crew</h2>
        {directedOrCreatedBy && (
          <p className="text-sm text-muted">
            <span className="text-brand-text font-medium">
              {director ? "Director:" : "Created by:"}
            </span>{" "}
            {directedOrCreatedBy}
          </p>
        )}
      </div>

      {loading ? (
        <CastCrewSkeleton />
      ) : (
        <div className="relative">
          <Swiper
            modules={[Navigation]}
            slidesPerView="auto"
            spaceBetween={16}
            navigation={{ nextEl: `.cast-nav-next-${id}`, prevEl: `.cast-nav-prev-${id}` }}
            className="!pb-2"
          >
            {cast.map((person) => (
              <SwiperSlide key={person.id} className="!w-24 shrink-0">
                <button
                  className="cast-link"
                  onClick={() => navigate(`/person/${createSlug(person.name, person.id)}`)}
                  title={`See more from ${person.name}`}
                >
                  <span className="cast-avatar">
                    <PersonAvatar profilePath={person.profile_path} name={person.name} />
                  </span>
                  <span className="cast-name">{person.name}</span>
                  {person.character && <span className="cast-character">{person.character}</span>}
                </button>
              </SwiperSlide>
            ))}
          </Swiper>

          <button className={`slider-nav-btn slider-nav-prev cast-nav-prev-${id} hover:bg-accent hover:text-white`} aria-label="Scroll cast left">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button className={`slider-nav-btn slider-nav-next cast-nav-next-${id} hover:bg-accent hover:text-white`} aria-label="Scroll cast right">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
};

export default CastCrew;
