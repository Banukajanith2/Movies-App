import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "../hooks/useDebounce";
import { useAuth } from "../context/AuthContext"; 
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";
import MovieCard from "./MovieCard";
import TvCard from "./TvCard";

const Navbar = ({ browseRef, tvSectionRef, movieSectionRef }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth(); 
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // New State & Ref for the Profile Dropdown Menu
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);
  
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 700);

  // --- Theme State & Logic ---
  const [darkMode, setDarkMode] = useState(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);
  // ----------------------------

  // Helper to extract ONLY the first word/name safely
  const getFirstName = () => {
    if (!currentUser) return "";
    const rawName = currentUser.displayName || currentUser.email.split("@")[0];
    return rawName.trim().split(/[\s._-]+/)[0];
  };

  const fetchSearch = useCallback(async (query) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/search/multi?query=${encodeURIComponent(query)}&language=en-US`,
        API_OPTIONS
      );
      const data = await response.json();
      const filtered = (data.results || []).filter(
        (item) => item.media_type === "movie" || item.media_type === "tv"
      );
      setSearchResults(filtered);
      if (!filtered.length) setErrorMessage("No results found");
    } catch {
      setErrorMessage("Error fetching results");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm) {
      fetchSearch(debouncedSearchTerm);
    } else {
      setSearchResults([]);
      setErrorMessage("");
    }
  }, [debouncedSearchTerm, fetchSearch]);

  // Combined Outside Click Handler for Search and Profile Dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchTerm("");
        setSearchResults([]);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchTerm("");
    setSearchResults([]);
    setErrorMessage("");
  };

  const scrollToRef = (ref) => {
    if (ref?.current) {
      const offsetTop = ref.current.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className="main-navbar">
      <div className="main-navbar-inner">

        {/* LEFT — Logo */}
        <div
          className="navbar-logo"
          onClick={() => { navigate("/"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        >
          <span className="navbar-logo-text">EZ Movies</span>
          <span className="navbar-logo-sub">Discover Your Favourite Movies &amp; Tv Shows Online</span>
        </div>

        {/* CENTER — Nav links */}
        <div className="navbar-links flex items-center gap-4">
          
          {/* THEME TOGGLE BUTTON */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full transition-all duration-300 hover:bg-white/10 dark:hover:bg-black/20 text-gray-300 hover:text-white shrink-0"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.22 4.22l1.56 1.56m12.72 12.72l1.56 1.56M3 12h2.25m13.5 0H21M4.22 19.78l1.56-1.56m12.72-12.72l1.56-1.56M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-indigo-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>

          <button className="navbar-link" onClick={() => { navigate("/"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            Home
          </button>
          <button className="navbar-link" onClick={() => scrollToRef(movieSectionRef)}>
            Movies
          </button>
          <button className="navbar-link" onClick={() => scrollToRef(tvSectionRef)}>
            TV Shows
          </button>
          <button className="navbar-link" onClick={() => { navigate("/search"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            Browse
          </button>

          {/* Conditional Auth Layout */}
          {!currentUser ? (
            <button className="navbar-link" onClick={() => navigate("/login")}>
              Login
            </button>
          ) : (
            /* Stateful Dropdown Container */
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-1.5 text-xs lg:text-sm font-semibold bg-white/25 dark:bg-white/10 border border-white/5 px-3 py-1.5 rounded-md dark:text-indigo-300 text-indigo-500 tracking-wider select-none cursor-pointer hover:bg-white/35 dark:hover:bg-white/20 transition-all duration-200"
              >
                Binge on, {getFirstName().toUpperCase()}..
                <span className="text-base inline-block animate-popcorn-shake">
                  🍿🎬
                </span>
                {/* Visual Arrow Indicator */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3 h-3 transition-transform duration-200 ${profileMenuOpen ? "rotate-180" : ""}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* Floating Under Menu */}
              {profileMenuOpen && (
                <div className="absolute right-0 top-[115%] w-full bg-gray-200 dark:bg-dark-100 border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl py-1.5 z-50 flex flex-col overflow-hidden animate-slide-up fade-in">
                  <button 
                    onClick={() => { navigate("/account"); setProfileMenuOpen(false); }}
                    className="px-4 py-2.5 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    Account
                  </button>
                  
                  <hr className="border-gray-100 dark:border-white/5 my-1" />
                  
                  <button 
                    onClick={() => { logout(); setProfileMenuOpen(false); }}
                    className="px-4 py-2.5 text-sm text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-2 font-semibold cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
          
        </div>

        {/* RIGHT — Search */}
        <div className="navbar-search-area" ref={wrapperRef}>
          {!searchOpen ? (
            <button className="navbar-search-btn fade-in" onClick={() => setSearchOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
              </svg>
              <span className="hidden sm:inline">Search</span>
            </button>
          ) : (
            <div className="navbar-search-expanded fade-in">
              <div className="navbar-search-input-row">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0 text-dark-100 dark:text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search movies & shows..."
                  className="navbar-search-input"
                />
                <button onClick={closeSearch} className="navbar-search-close">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Dropdown */}
              {debouncedSearchTerm && (
                <div className="navbar-search-dropdown animate-slide-up fade-in">
                  {isLoading ? (
                    <p className="text-center py-5 text-gray-400 text-sm">Searching...</p>
                  ) : errorMessage ? (
                    <p className="text-center py-5 text-red-400 text-sm">{errorMessage}</p>
                  ) : (
                    <div className="relative">
                      <ul className="max-h-[65vh] overflow-y-auto">
                        {searchResults.map((item) => (
                          <li key={item.id} onClick={closeSearch}>
                            {item.media_type === "movie" ? (
                              <MovieCard movie={item} className="moviesearch-card-nav" />
                            ) : (
                              <TvCard tvShow={item} className="tvsearch-card-nav" />
                            )}
                          </li>
                        ))}
                      </ul>
                      <div
                        className="bg-dark-200 flex justify-center items-center h-9 rounded-b-xl sticky bottom-0 cursor-pointer hover:bg-indigo-600 transition3s"
                        onClick={() => {
                          navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
                          closeSearch();
                        }}
                      >
                        <p className="text-white text-sm font-medium">
                          Show All Results →
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="sm:hidden text-white ml-2 cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu fade-in sm:hidden">
          {currentUser && (
            <>
              <div className="lg:px-6 px-3 py-3 border-b border-white/5 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Logged in as: {getFirstName()}
              </div>
              <button className="mobile-menu-link" onClick={() => { navigate("/account"); setMobileMenuOpen(false); }}>Account</button>
            </>
          )}
          <button className="mobile-menu-link" onClick={() => { navigate("/"); window.scrollTo({ top: 0, behavior: "smooth" }); setMobileMenuOpen(false); }}>Home</button>
          <button className="mobile-menu-link" onClick={() => scrollToRef(movieSectionRef)}>Movies</button>
          <button className="mobile-menu-link" onClick={() => scrollToRef(tvSectionRef)}>TV Shows</button>
          <button className="mobile-menu-link" onClick={() => { navigate("/search"); window.scrollTo({ top: 0, behavior: "smooth" }); setMobileMenuOpen(false); }}>Browse</button>
          
          <button 
            className={`mobile-menu-link ${currentUser ? "text-red-400 font-semibold" : ""}`} 
            onClick={() => {
              if (currentUser) {
                logout();
              } else {
                navigate("/login");
              }
              setMobileMenuOpen(false);
            }}
          >
            {currentUser ? "Logout" : "Login"}
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;