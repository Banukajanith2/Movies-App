import { useState, useEffect } from "react";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";
import { YEAR_RANGES, WATCH_REGION } from "../constants/filters";
import Navbar from "../components/Navbar";
import MovieCard from "../components/MovieCard";
import { MovieCardSkeletonGrid } from "../components/MovieCardSkeleton";
import Footer from "../components/Footer";
import Pagination from "../components/Pagination";
import FilterSidebar from "../components/FilterSidebar";
import { usePageMeta } from "../hooks/usePageMeta";

const CATEGORIES = [
  { value: "popular",     label: "Popular",     icon: "🔥" },
  { value: "top_rated",   label: "Top Rated",   icon: "⭐" },
  { value: "now_playing", label: "Now Playing", icon: "🎬" },
  { value: "upcoming",    label: "Upcoming",    icon: "📅" },
];

const isoDate = (d) => d.toISOString().split("T")[0];

const buildDiscoverUrl = ({ category, page, selectedGenres, selectedProviders, language, rating, yearRange }) => {
  const url = new URL(`${API_BASE_URL}/discover/movie`);
  url.searchParams.set("page", page);
  url.searchParams.set("language", "en-US");
  url.searchParams.set("include_adult", "false");

  if (category === "top_rated") {
    url.searchParams.set("sort_by", "vote_average.desc");
    url.searchParams.set("vote_count.gte", "200");
  } else {
    url.searchParams.set("sort_by", "popularity.desc");
    url.searchParams.set("vote_count.gte", "10");
  }

  const today = new Date();
  if (category === "now_playing") {
    const past = new Date(today);
    past.setDate(past.getDate() - 45);
    url.searchParams.set("primary_release_date.gte", isoDate(past));
    url.searchParams.set("primary_release_date.lte", isoDate(today));
  } else if (category === "upcoming") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    url.searchParams.set("primary_release_date.gte", isoDate(tomorrow));
  }

  if (selectedGenres.length) url.searchParams.set("with_genres", selectedGenres.join(","));
  if (selectedProviders.length) {
    url.searchParams.set("with_watch_providers", selectedProviders.join("|"));
    url.searchParams.set("watch_region", WATCH_REGION);
  }
  if (language) url.searchParams.set("with_original_language", language);
  if (rating) url.searchParams.set("vote_average.gte", rating);

  // A manual year range overrides the category's implicit date window.
  const yearObj = YEAR_RANGES[yearRange];
  if (yearObj.gte) {
    url.searchParams.set("primary_release_date.gte", `${yearObj.gte}-01-01`);
    url.searchParams.set("primary_release_date.lte", `${yearObj.lte}-12-31`);
  }

  return url;
};

const MoviesPage = () => {
  usePageMeta({
    title: "Movies",
    description:
      "Browse movies by genre, year, rating and language. Filter thousands of titles and stream them in HD on EZ Movies.",
  });
  const [category, setCategory] = useState("popular");
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [language, setLanguage] = useState("");
  const [rating, setRating] = useState("");
  const [yearRange, setYearRange] = useState(0);

  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/genre/movie/list?language=en-US`, API_OPTIONS);
        const data = await res.json();
        setGenres(data.genres || []);
      } catch { /* silent */ }
    };
    fetchGenres();
  }, []);

  // Any filter change resets to page 1.
  useEffect(() => {
    setPage(1);
  }, [category, selectedGenres, selectedProviders, language, rating, yearRange]);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      setError("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      try {
        const url = buildDiscoverUrl({ category, page, selectedGenres, selectedProviders, language, rating, yearRange });
        const response = await fetch(url.toString(), API_OPTIONS);
        if (!response.ok) throw new Error("Failed to fetch movies");
        const data = await response.json();
        setMovies(data.results || []);
        setTotalPages(data.total_pages || 1);
        if (!(data.results || []).length) setError("No movies match these filters.");
      } catch (err) {
        setError("Something went wrong. Please try again.");
        console.error("Error fetching movies:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [category, page, selectedGenres, selectedProviders, language, rating, yearRange]);

  const toggleGenre = (id) => {
    setSelectedGenres((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  };

  const toggleProvider = (id) => {
    setSelectedProviders((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const handleReset = () => {
    setCategory("popular");
    setSelectedGenres([]);
    setSelectedProviders([]);
    setLanguage("");
    setRating("");
    setYearRange(0);
  };

  const activeFilterCount =
    selectedGenres.length + selectedProviders.length +
    (language ? 1 : 0) + (rating ? 1 : 0) + (yearRange !== 0 ? 1 : 0);

  return (
    <div className="relative min-h-screen bg-brand-bg text-brand-text transition-colors duration-300">
      <div className="pattern" />
      <div className="footer-img" />

      <Navbar />

      <div className="browse-page-wrapper">
        <div className="flex justify-end mb-4 lg:hidden">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-2 text-sm font-medium bg-surface border border-brand-text/10 text-brand-text px-3 py-2 rounded-lg cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m9 12h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0H10.5M3.75 12H15m0 0a1.5 1.5 0 1 0 3 0m-3 0a1.5 1.5 0 1 1 3 0m3.75 0h-3.75" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex gap-6 items-start">
          <FilterSidebar
            categories={CATEGORIES}
            category={category}
            onCategoryChange={setCategory}
            genres={genres}
            selectedGenres={selectedGenres}
            onToggleGenre={toggleGenre}
            selectedProviders={selectedProviders}
            onToggleProvider={toggleProvider}
            language={language}
            onLanguageChange={setLanguage}
            rating={rating}
            onRatingChange={setRating}
            yearRange={yearRange}
            onYearRangeChange={setYearRange}
            onReset={handleReset}
            isOpen={mobileFiltersOpen}
            onClose={() => setMobileFiltersOpen(false)}
          />

          <div className="flex-1 min-w-0">
            {!loading && movies.length > 0 && (
              <div className="flex justify-center">
                <Pagination page={page} setPage={setPage} totalPages={totalPages} />
              </div>
            )}

            <section className="search-results-grid">
              {loading ? (
                <MovieCardSkeletonGrid />
              ) : error ? (
                <div className="col-span-full flex flex-col items-center py-20 gap-3">
                  <p className="text-muted text-sm">{error}</p>
                  <button onClick={handleReset} className="text-accent hover:underline text-sm cursor-pointer">
                    Clear filters
                  </button>
                </div>
              ) : (
                movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} className="movie-card" />
                ))
              )}
            </section>

            {!loading && movies.length > 0 && (
              <div className="flex justify-center mt-4 mb-10">
                <Pagination page={page} setPage={setPage} totalPages={totalPages} />
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default MoviesPage;
