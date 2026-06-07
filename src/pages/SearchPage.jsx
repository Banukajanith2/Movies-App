import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";
import Navbar from "../components/Navbar";
import MovieCard from "../components/MovieCard";
import TvCard from "../components/TvCard";
import Spinner from "../components/Spinner";
import Footer from "../components/Footer";

/* ── Pagination (Updated with Semantic Utilities) ───────── */
const Pagination = ({ page, setPage, totalPages }) => {
  const capped = Math.min(totalPages, 500); // TMDB caps at page 500

  const getPageNumbers = () => {
    let start = Math.max(1, page - 2);
    let end   = Math.min(capped, page + 2);
    if (end - start < 4) {
      if (start === 1) end   = Math.min(start + 4, capped);
      else             start = Math.max(end - 4, 1);
    }
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 flex-wrap">
      <button
        onClick={() => setPage(p => Math.max(1, p - 1))}
        disabled={page === 1}
        className="transition3s px-3 py-1 rounded bg-brand-text/5 text-brand-text hover:bg-accent hover:text-white disabled:opacity-40 text-sm cursor-pointer"
      >
        Prev
      </button>

      {getPageNumbers().map(num => (
        <button
          key={num}
          onClick={() => setPage(num)}
          className={`transition3s px-3 py-1 rounded text-sm shadow-inner transition-colors duration-200 cursor-pointer ${
            page === num
              ? "bg-accent text-white"
              : "bg-brand-text/5 text-brand-text hover:bg-accent hover:text-white"
          }`}
        >
          {num}
        </button>
      ))}

      <button
        onClick={() => setPage(p => Math.min(capped, p + 1))}
        disabled={page === capped}
        className="transition3s px-3 py-1 rounded bg-brand-text/5 text-brand-text hover:bg-accent hover:text-white disabled:opacity-40 text-sm cursor-pointer"
      >
        Next
      </button>

      <span className="text-muted text-xs ml-2">
        Page {page} of {capped.toLocaleString()}
      </span>
    </div>
  );
};

/* ── Static filter data ────────────────────────────────────── */
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "zh", label: "Chinese" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
  { code: "ru", label: "Russian" },
  { code: "tr", label: "Turkish" },
  { code: "pl", label: "Polish" },
  { code: "nl", label: "Dutch" },
  { code: "sv", label: "Swedish" },
  { code: "th", label: "Thai" },
  { code: "id", label: "Indonesian" },
  { code: "vi", label: "Vietnamese" },
  { code: "fa", label: "Persian" },
];

const RATINGS = [
  { value: "", label: "All" },
  { value: "1", label: "1+" },
  { value: "2", label: "2+" },
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
  { value: "6", label: "6+" },
  { value: "7", label: "7+" },
  { value: "8", label: "8+" },
  { value: "9", label: "9+" },
];

const YEAR_RANGES = [
  { label: "All Years",   gte: "",     lte: ""     },
  { label: "2024–2025",   gte: "2024", lte: "2025" },
  { label: "2020–2023",   gte: "2020", lte: "2023" },
  { label: "2010–2019",   gte: "2010", lte: "2019" },
  { label: "2000–2009",   gte: "2000", lte: "2009" },
  { label: "1990–1999",   gte: "1990", lte: "1999" },
  { label: "Before 1990", gte: "1900", lte: "1989" },
];

const SORT_OPTIONS = [
  { value: "popularity.desc",          label: "Featured"      },
  { value: "primary_release_date.desc", label: "Latest"        },
  { value: "primary_release_date.asc",  label: "Oldest"        },
  { value: "vote_average.desc",         label: "IMDb Rating"   },
  { value: "original_title.asc",        label: "Alphabetical"  },
];

const tvSortMap = {
  "primary_release_date.desc": "first_air_date.desc",
  "primary_release_date.asc":  "first_air_date.asc",
  "original_title.asc":        "name.asc",
};

/* ── Select helper (Updated for Dark/Light Adaptive UI) ────── */
const FilterSelect = ({ label, value, onChange, children }) => (
  <div className="flex flex-col gap-1 min-w-[110px]">
    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted">
      {label}
    </label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-brand-bg text-brand-text text-sm rounded-lg px-2 py-1.5 border border-brand-text/10
                 focus:outline-none focus:border-accent cursor-pointer transition3s"
    >
      {children}
    </select>
  </div>
);

/* ── Main SearchPage ────────────────────────────────────────── */
const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const [inputValue,    setInputValue]    = useState(initialQuery);

  const [mediaType,     setMediaType]     = useState("movie");
  const [genres,        setGenres]        = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [rating,        setRating]        = useState("");
  const [yearRange,     setYearRange]     = useState(0); 
  const [language,      setLanguage]      = useState("");
  const [sortBy,        setSortBy]        = useState("popularity.desc");

  const [results,       setResults]       = useState([]);
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalResults,  setTotalResults]  = useState(0);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");

  const committedRef = useRef(null);
  const [searchTrigger, setSearchTrigger] = useState(0);

  /* Fetch genres when mediaType changes */
  useEffect(() => {
    setSelectedGenre("");
    const fetchGenres = async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/genre/${mediaType}/list?language=en-US`, API_OPTIONS);
        const data = await res.json();
        setGenres(data.genres || []);
      } catch { /* silent */ }
    };
    fetchGenres();
  }, [mediaType]);

  /* Single fetch effect */
  useEffect(() => {
    if (searchTrigger === 0 || !committedRef.current) return;

    const { query: q, mediaType: mt, selectedGenre: sg, rating: rt,
            yearRange: yr, language: lg, sortBy: sb, page: pg } = committedRef.current;

    const run = async () => {
      setLoading(true);
      setError("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      try {
        const resolvedSort = mt === "tv" ? (tvSortMap[sb] || sb) : sb;
        const yearObj = YEAR_RANGES[yr];
        let url;

        if (q.trim()) {
          url = new URL(`${API_BASE_URL}/search/${mt}`);
          url.searchParams.set("query",    q.trim());
          url.searchParams.set("page",     pg);
          url.searchParams.set("language", "en-US");
          if (lg) url.searchParams.set("with_original_language", lg);
        } else {
          url = new URL(`${API_BASE_URL}/discover/${mt}`);
          url.searchParams.set("page",          pg);
          url.searchParams.set("language",      "en-US");
          url.searchParams.set("sort_by",        resolvedSort);
          url.searchParams.set("include_adult",  "false");
          url.searchParams.set("vote_count.gte", sb === "vote_average.desc" ? "100" : "10");
          if (sg) url.searchParams.set("with_genres",            sg);
          if (rt) url.searchParams.set("vote_average.gte",       rt);
          if (lg) url.searchParams.set("with_original_language", lg);
          if (yearObj.gte) {
            const dateField = mt === "tv" ? "first_air_date" : "primary_release_date";
            url.searchParams.set(`${dateField}.gte`, `${yearObj.gte}-01-01`);
            url.searchParams.set(`${dateField}.lte`, `${yearObj.lte}-12-31`);
          }
        }

        const res  = await fetch(url.toString(), API_OPTIONS);
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();

        const tagged = (data.results || []).map(item => ({ ...item, media_type: mt }));
        setResults(tagged);
        setTotalPages(data.total_pages   || 1);
        setTotalResults(data.total_results || 0);
        if (!tagged.length) setError("No results found. Try adjusting your filters.");
      } catch (err) {
        setError("Something went wrong. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [searchTrigger]);

  const handleSearch = () => {
    committedRef.current = {
      query: inputValue, mediaType, selectedGenre,
      rating, yearRange, language, sortBy, page: 1,
    };
    setPage(1);
    setSearchTrigger(t => t + 1);
  };

  const handlePageChange = (newPage) => {
    if (!committedRef.current) return;
    committedRef.current = { ...committedRef.current, page: newPage };
    setPage(newPage);
    setSearchTrigger(t => t + 1);
  };

  useEffect(() => {
    if (!initialQuery) return;
    committedRef.current = {
      query: initialQuery, mediaType, selectedGenre,
      rating, yearRange, language, sortBy, page: 1,
    };
    setSearchTrigger(1);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleReset = () => {
    committedRef.current = null;
    setInputValue(""); setMediaType("movie"); setSelectedGenre("");
    setRating(""); setYearRange(0); setLanguage(""); setSortBy("popularity.desc");
    setPage(1); setResults([]); setTotalResults(0); setError("");
  };

  return (
    <div className="relative min-h-screen bg-brand-bg text-brand-text transition-colors duration-300">
      <div className="pattern" />
      <div className="footer-img" />

      <Navbar />

      <div className="search-page-wrapper">

        {/* ── Search & Filter card (Updated with bg-surface) ── */}
        <section className="search-filter-card fade-in bg-surface border border-brand-text/10 rounded-2xl p-6 shadow-xs">
          <h2 className="search-filter-title text-brand-text">Search</h2>

          {/* Text input row */}
          <div className="search-filter-input-row">
            <div className="search-filter-input-wrap bg-brand-bg border border-brand-text/10 rounded-xl focus-within:border-accent transition-colors duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-muted shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
              </svg>
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter a movie or TV show title…"
                className="search-filter-input text-brand-text placeholder:text-muted"
              />
              {inputValue && (
                <button onClick={() => setInputValue("")}
                  className="text-muted hover:text-brand-text transition-colors shrink-0 cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                    strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button onClick={handleSearch} className="search-filter-btn bg-accent hover:bg-accent-hover text-white transition-colors cursor-pointer">
              Search
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-brand-text/10 my-4" />

          {/* Filter row */}
          <div className="search-filter-row">

            <FilterSelect label="Type" value={mediaType} onChange={setMediaType}>
              <option value="movie">Movies</option>
              <option value="tv">TV Shows</option>
            </FilterSelect>

            <FilterSelect label="Genre" value={selectedGenre} onChange={setSelectedGenre}>
              <option value="">All</option>
              {genres.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </FilterSelect>

            <FilterSelect label="Rating" value={rating} onChange={setRating}>
              {RATINGS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </FilterSelect>

            <FilterSelect label="Year" value={yearRange} onChange={v => setYearRange(Number(v))}>
              {YEAR_RANGES.map((yr, i) => (
                <option key={i} value={i}>{yr.label}</option>
              ))}
            </FilterSelect>

            <FilterSelect label="Language" value={language} onChange={setLanguage}>
              <option value="">All</option>
              {LANGUAGES.map(l => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </FilterSelect>

            <FilterSelect label="Order By" value={sortBy} onChange={setSortBy}>
              {SORT_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </FilterSelect>

            <button
              onClick={handleReset}
              className="self-end mb-0.5 text-xs text-brand-text border border-brand-text/10 hover:bg-brand-text/5
                         px-3 py-1.5 rounded-lg transition3s cursor-pointer whitespace-nowrap"
            >
              Reset
            </button>
          </div>

          {!loading && totalResults > 0 && (
            <p className="text-muted text-xs mt-3">
              {totalResults.toLocaleString()} results
              {committedRef.current?.query && (
                <span> for <span className="text-brand-text font-medium">"{committedRef.current.query}"</span></span>
              )}
            </p>
          )}
        </section>

        {/* ── Pagination top ───────────────────────────────── */}
        {!loading && results.length > 0 && (
          <div className="flex justify-center mt-4">
            <Pagination page={page} setPage={handlePageChange} totalPages={totalPages} />
          </div>
        )}

        {/* ── Results grid ─────────────────────────────────── */}
        <section className="search-results-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-10">
          {loading ? (
            <div className="col-span-full flex justify-center py-20">
              <Spinner />
            </div>
          ) : error ? (
            <div className="col-span-full flex flex-col items-center py-20 gap-3">
              <p className="text-muted text-sm">{error}</p>
              <button onClick={handleReset} className="text-accent hover:underline text-sm cursor-pointer">
                Clear filters
              </button>
            </div>
          ) : (
            results.map(item =>
              item.media_type === "tv" ? (
                <TvCard key={item.id} tvShow={item} className="tv-card" />
              ) : (
                <MovieCard key={item.id} movie={item} className="movie-card" />
              )
            )
          )}
        </section>

        {/* ── Pagination bottom ────────────────────────────── */}
        {!loading && results.length > 0 && (
          <div className="flex justify-center mt-4 mb-10">
            <Pagination page={page} setPage={handlePageChange} totalPages={totalPages} />
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
};

export default SearchPage;