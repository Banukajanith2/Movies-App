import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";
import { profileSrcSet, srcSet } from "../utils/tmdbImage";
import { usePageMeta } from "../hooks/usePageMeta";

import Spinner from "../components/Spinner";
import Navbar from "../components/Navbar";
import ShareButton from "../components/ShareButton";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";

const createSlug = (title, id) =>
  `${(title || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-${id}`;

const formatDate = (iso) => {
  if (!iso) return null;
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
};

/** Whole years between two dates, or between a birth date and today. */
const yearsBetween = (fromIso, toIso) => {
  if (!fromIso) return null;
  const from = new Date(`${fromIso}T00:00:00`);
  const to = toIso ? new Date(`${toIso}T00:00:00`) : new Date();
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  let age = to.getFullYear() - from.getFullYear();
  const m = to.getMonth() - from.getMonth();
  if (m < 0 || (m === 0 && to.getDate() < from.getDate())) age -= 1;
  return age;
};

const PersonPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);

  const personId = slug?.split("-").pop();

  usePageMeta({
    title: person?.name,
    description: person?.biography?.slice(0, 200) || undefined,
    image: person?.profile_path
      ? `https://image.tmdb.org/t/p/h632${person.profile_path}`
      : undefined,
    type: "profile",
    jsonLd: person && {
      "@context": "https://schema.org",
      "@type": "Person",
      name: person.name,
      description: person.biography || undefined,
      image: person.profile_path
        ? `https://image.tmdb.org/t/p/h632${person.profile_path}`
        : undefined,
      birthDate: person.birthday || undefined,
      deathDate: person.deathday || undefined,
      birthPlace: person.place_of_birth || undefined,
      jobTitle: person.known_for_department || undefined,
    },
  });

  useEffect(() => {
    if (!personId) return;
    setLoading(true);
    setBioExpanded(false);
    window.scrollTo({ top: 0 });

    const fetchPerson = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/person/${personId}?append_to_response=combined_credits&language=en-US`,
          API_OPTIONS
        );
        if (!response.ok) throw new Error("Person fetch failed");
        setPerson(await response.json());
      } catch (error) {
        console.error("Error fetching person:", error);
        navigate("/404-Error");
      } finally {
        setLoading(false);
      }
    };

    fetchPerson();
  }, [personId, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-brand-bg flex items-center justify-center z-[9999]">
        <Spinner />
      </div>
    );
  }

  if (!person) {
    navigate("/404-Error");
    return null;
  }

  const age = yearsBetween(person.birthday, person.deathday);

  // Talk shows, news and reality dominate an actor's credit list with one-off
  // guest spots, which is not what "known for" should mean.
  const CHAT_GENRES = new Set([10767, 10763, 10764]);

  // Cast credits only — crew rows duplicate heavily and aren't what people browse for.
  // Sorted by vote_count (how well known the title is) rather than `popularity`,
  // which reflects what's trending this week and floats talk shows to the top.
  const credits = (person.combined_credits?.cast || [])
    .filter((c) => c.poster_path && !(c.genre_ids || []).some((g) => CHAT_GENRES.has(g)))
    .sort(
      (a, b) => (b.vote_count || 0) - (a.vote_count || 0) || (b.popularity || 0) - (a.popularity || 0)
    );

  // De-duplicate: TV guest spots repeat the same show once per episode
  const seen = new Set();
  const uniqueCredits = credits.filter((c) => {
    const key = `${c.media_type}:${c.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const facts = [
    { key: "Known for", value: person.known_for_department },
    { key: "Born", value: formatDate(person.birthday) },
    { key: "Died", value: formatDate(person.deathday) },
    { key: age != null && !person.deathday ? "Age" : null, value: age != null ? `${age}` : null },
    { key: "From", value: person.place_of_birth },
    { key: "Credits", value: uniqueCredits.length || null },
  ].filter((f) => f.key && f.value);

  const bio = person.biography?.trim();
  const bioIsLong = bio && bio.length > 600;

  return (
    <main className="watch-page is-movie fade-in">
      <Navbar />

      <div className="wp-shell">
        <div className="wp-topbar wp-rise" style={{ "--d": "0s" }}>
          <button className="wp-back" onClick={() => navigate(-1)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Back
          </button>
          <div className="wp-crumbs">
            <span>People</span>
            <span>/</span>
            <span className="wp-crumbs-current">{person.name}</span>
          </div>
        </div>

        <section className="person-header wp-rise" style={{ "--d": "0.06s" }}>
          <div className="person-portrait">
            {person.profile_path ? (
              <img
                src={`https://image.tmdb.org/t/p/h632${person.profile_path}`}
                srcSet={profileSrcSet(person.profile_path)}
                sizes="(min-width: 1024px) 260px, (min-width: 640px) 200px, 45vw"
                alt={person.name}
              />
            ) : (
              <span className="person-portrait-fallback">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </span>
            )}
          </div>

          <div className="wp-info">
            <h1 className="wp-title">{person.name}</h1>

            {facts.length > 0 && (
              <div className="wp-facts">
                {facts.map((fact) => (
                  <div className="wp-fact" key={fact.key}>
                    <p className="wp-fact-k">{fact.key}</p>
                    <p className="wp-fact-v">{fact.value}</p>
                  </div>
                ))}
              </div>
            )}

            {bio ? (
              <>
                <p className={`wp-overview whitespace-pre-line ${bioIsLong && !bioExpanded ? "line-clamp-6" : ""}`}>
                  {bio}
                </p>
                {bioIsLong && (
                  <button className="review-toggle" onClick={() => setBioExpanded((v) => !v)}>
                    {bioExpanded ? "Show less" : "Read full biography"}
                  </button>
                )}
              </>
            ) : (
              <p className="wp-overview">No biography available.</p>
            )}

            <div className="wp-actions">
              <ShareButton className="ui-icon-btn" />
            </div>
          </div>
        </section>

        <section className="mt-10 wp-rise" style={{ "--d": "0.14s" }}>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="section-heading">Known for</h2>
            <span className="section-count">{uniqueCredits.length}</span>
          </div>

          {uniqueCredits.length === 0 ? (
            <p className="wp-overview">No credits with artwork available.</p>
          ) : (
            <div className="season-grid">
              {uniqueCredits.slice(0, 30).map((credit) => {
                const title = credit.title || credit.name;
                const isMovie = credit.media_type === "movie";
                const year = (credit.release_date || credit.first_air_date || "").split("-")[0];

                return (
                  <button
                    key={`${credit.media_type}-${credit.id}`}
                    onClick={() =>
                      navigate(`/${isMovie ? "movie" : "tv"}/${createSlug(title, credit.id)}`)
                    }
                    className="season-card"
                  >
                    <span className="season-poster">
                      <img
                        src={`https://image.tmdb.org/t/p/w342${credit.poster_path}`}
                        srcSet={srcSet(credit.poster_path)}
                        sizes="(min-width: 1024px) 230px, (min-width: 640px) 30vw, 45vw"
                        alt={title}
                        loading="lazy"
                      />
                      <span className={`media-type-tag ${isMovie ? "media-type-tag-movie" : "media-type-tag-tv"}`}>
                        {isMovie ? "Movie" : "TV"}
                      </span>
                    </span>

                    <span className="season-info">
                      <span className="season-name">{title}</span>
                      <span className="season-meta">
                        {[year, credit.character].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <Footer />
      </div>

      <BackToTop />
    </main>
  );
};

export default PersonPage;
