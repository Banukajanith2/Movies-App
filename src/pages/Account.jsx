import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

// Component imports
import MovieCard from "../components/MovieCard";
import TvCard from "../components/TvCard";
import PlaylistCard from "../components/PlaylistCard";
import PlaylistPage from "../components/PlaylistPage"; // 1. Imported the new component
import Spinner from "../components/Spinner";

// Firebase Firestore Modules
import { db } from "../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";

// Import playlist retrieval service
import { getUserPlaylists } from "../firebase/useFirestore";

const Account = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // --- Real-time Dynamic Storage Arrays ---
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [favoriteTvShows, setFavoriteTvShows] = useState([]);
  const [playlists, setPlaylists] = useState([]); // Initialized to a true empty array state
  const [loadingMedia, setLoadingMedia] = useState(true);

  // --- Playlist Detail Panel Selection State ---
  const [selectedPlaylist, setSelectedPlaylist] = useState(null); // 2. Track currently open playlist

  // --- Accordion / Expansion States ---
  const [moviesExpanded, setMoviesExpanded] = useState(false);
  const [tvExpanded, setTvExpanded] = useState(false);
  const [playlistsExpanded, setPlaylistsExpanded] = useState(false);

  // --- Form States for Settings ---
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // --- Refs for Sidebar Section Scrolling ---
  const moviesRef = useRef(null);
  const tvRef = useRef(null);
  const playlistsRef = useRef(null);
  const settingsRef = useRef(null);

  // ── CORE BACKEND FETCH HOOK ──────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) {
      setFavoriteMovies([]);
      setFavoriteTvShows([]);
      setPlaylists([]); // Safely clear out state
      setLoadingMedia(false);
      return;
    }

    setLoadingMedia(true);
    const userRef = doc(db, "users", currentUser.uid);

    // Subscribe to real-time updates for favorites while querying playlists concurrently
    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      try {
        // Start pulling playlists from its independent collection right away
        const playlistsPromise = getUserPlaylists(currentUser.uid);

        let resolvedMovies = [];
        let resolvedTv = [];

        if (docSnap.exists()) {
          const userData = docSnap.data();
          const movieIds = userData.favoriteMovies || [];
          const tvIds = userData.favoriteTvShows || [];

          // Resolve full TMDB detail sets concurrently from array IDs
          const moviePromises = movieIds.map(async (id) => {
            const res = await fetch(`${API_BASE_URL}/movie/${id}?language=en-US`, API_OPTIONS);
            return res.ok ? res.json() : null;
          });

          const tvPromises = tvIds.map(async (id) => {
            const res = await fetch(`${API_BASE_URL}/tv/${id}?language=en-US`, API_OPTIONS);
            return res.ok ? res.json() : null;
          });

          resolvedMovies = await Promise.all(moviePromises);
          resolvedTv = await Promise.all(tvPromises);
        }

        // Await the independent playlists promise response
        const dbPlaylists = await playlistsPromise;

        // Clean broken or missing items out of runtime arrays
        setFavoriteMovies(resolvedMovies.filter(item => item !== null));
        setFavoriteTvShows(resolvedTv.filter(item => item !== null));
        setPlaylists(dbPlaylists || []);
      } catch (error) {
        console.error("Error fetching TMDB detailed payloads or playlists for account dashboard:", error);
      } finally {
        setLoadingMedia(false);
      }
    }, (error) => {
      console.error("Firestore user profile document read error:", error);
      setLoadingMedia(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const scrollToSection = (elementRef) => {
    // 3. Clear open playlist view if sidebar navigating to a main section
    if (selectedPlaylist) {
      setSelectedPlaylist(null);
    }
    
    if (elementRef?.current) {
      const offsetTop = elementRef.current.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const displayUsername = currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-[#030014] text-white pt-28 pb-16 px-4 md:px-8 lg:px-12 max-w-[1600px] mx-auto">
      <Navbar />
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] lg:grid-cols-[300px_1fr] gap-8 lg:gap-12 items-start">
        
        {/* ==========================================================================
            LEFT SIDEBAR (User Summary + Navigation Control)
            ========================================================================== */}
        <aside className="flex flex-col items-center sticky top-28">
          <div className="w-32 h-32 rounded-full bg-zinc-800 border-2 border-white/10 shadow-inner flex items-center justify-center overflow-hidden mb-4">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-zinc-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            )}
          </div>

          <h2 className="text-2xl font-bold tracking-wide text-center break-all px-2">{displayUsername}</h2>
          
          <button 
            onClick={handleLogout}
            className="mt-1 text-sm font-semibold text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
          >
            Logout
          </button>

          <div className="mt-8 w-full bg-[#151518] border border-white/5 rounded-2xl p-4 flex flex-col gap-1 shadow-xl">
            <button onClick={() => scrollToSection(moviesRef)} className="w-full text-left px-4 py-3 text-sm font-medium text-gray-300 hover:text-white rounded-xl hover:bg-white/5 transition-all cursor-pointer">
              Favourite Movies
            </button>
            <button onClick={() => scrollToSection(tvRef)} className="w-full text-left px-4 py-3 text-sm font-medium text-gray-300 hover:text-white rounded-xl hover:bg-white/5 transition-all cursor-pointer">
              Favourite TV
            </button>
            <button onClick={() => scrollToSection(playlistsRef)} className="w-full text-left px-4 py-3 text-sm font-medium text-gray-300 hover:text-white rounded-xl hover:bg-white/5 transition-all cursor-pointer">
              Playlists
            </button>
            <button onClick={() => scrollToSection(settingsRef)} className="w-full text-left px-4 py-3 text-sm font-medium text-gray-300 hover:text-white rounded-xl hover:bg-white/5 transition-all cursor-pointer">
              Settings
            </button>
          </div>
        </aside>

        {/* ==========================================================================
            RIGHT CONTENT AREA (Main Panels)
            ========================================================================== */}
        <main className="md:border-l border-white/10 md:pl-8 lg:pl-12 flex flex-col gap-12">
          
          {selectedPlaylist ? (
            /* 4. CONDITIONAL VIEW: Renders Playlist Detail Workspace Panel directly on top */
            <PlaylistPage 
              playlist={selectedPlaylist} 
              userId={currentUser?.uid} // 🔥 PASS THE USER ID HERE
              onBack={() => setSelectedPlaylist(null)}
              onPlaylistDeleted={(deletedId) => {
                // Instantly filter out deleted playlist document from runtime list array
                setPlaylists(prev => prev.filter(p => p.id !== deletedId));
                setSelectedPlaylist(null);
              }}
            />
          ) : loadingMedia ? (
            <div className="flex items-center justify-center py-20">
              <Spinner />
            </div>
          ) : (
            <>
              {/* 1. Favourite Movies Section */}
              <section ref={moviesRef} className="scroll-mt-32 transition-all">
                <button 
                  onClick={() => setMoviesExpanded(!moviesExpanded)}
                  disabled={favoriteMovies.length <= 5}
                  className={`flex items-center gap-2 group text-xl lg:text-2xl font-semibold mb-6 text-left transition-colors ${
                    favoriteMovies.length > 5 ? "hover:text-indigo-400 cursor-pointer" : "cursor-default"
                  }`}
                >
                  <span>Favourite Movies</span>
                  
                  {favoriteMovies.length > 5 && (
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      strokeWidth={2.5} 
                      stroke="currentColor" 
                      className={`w-5 h-5 text-gray-400 group-hover:text-indigo-400 transition-transform duration-300 ${
                        moviesExpanded ? "rotate-90" : ""
                      }`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  )}
                </button>

                {favoriteMovies.length === 0 ? (
                  <div className="w-full border border-dashed border-white/10 rounded-2xl py-12 flex flex-col items-center justify-center text-zinc-500 gap-2">
                    <span className="text-sm font-medium tracking-wide">No Movies in Favorites</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {(moviesExpanded ? favoriteMovies : favoriteMovies.slice(0, 5)).map((movie) => (
                      <MovieCard key={`${currentUser?.uid}-${movie.id}`} movie={movie} />
                    ))}
                  </div>
                )}
              </section>

              {/* 2. Favourite TV Shows Section */}
              <section ref={tvRef} className="scroll-mt-32 transition-all">
                <button 
                  onClick={() => setTvExpanded(!tvExpanded)}
                  disabled={favoriteTvShows.length <= 5}
                  className={`flex items-center gap-2 group text-xl lg:text-2xl font-semibold mb-6 text-left transition-colors ${
                    favoriteTvShows.length > 5 ? "hover:text-indigo-400 cursor-pointer" : "cursor-default"
                  }`}
                >
                  <span>Favourite TV Shows</span>
                  
                  {favoriteTvShows.length > 5 && (
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      strokeWidth={2.5} 
                      stroke="currentColor" 
                      className={`w-5 h-5 text-gray-400 group-hover:text-indigo-400 transition-transform duration-300 ${
                        tvExpanded ? "rotate-90" : ""
                      }`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  )}
                </button>

                {favoriteTvShows.length === 0 ? (
                  <div className="w-full border border-dashed border-white/10 rounded-2xl py-12 flex flex-col items-center justify-center text-zinc-500 gap-2">
                    <span className="text-sm font-medium tracking-wide">No TV Shows in Favorites</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {(tvExpanded ? favoriteTvShows : favoriteTvShows.slice(0, 5)).map((tvShow) => (
                      <TvCard key={`${currentUser?.uid}-${tvShow.id}`} tvShow={tvShow} />
                    ))}
                  </div>
                )}
              </section>

              {/* 3. Playlists Section */}
              <section ref={playlistsRef} className="scroll-mt-32 transition-all">
                <button 
                  onClick={() => setPlaylistsExpanded(!playlistsExpanded)}
                  disabled={playlists.length <= 5}
                  className={`flex items-center gap-2 group text-xl lg:text-2xl font-semibold mb-6 text-left transition-colors ${
                    playlists.length > 5 ? "hover:text-indigo-400 cursor-pointer" : "cursor-default"
                  }`}
                >
                  <span>Playlists</span>
                  
                  {playlists.length > 5 && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-5 h-5 text-gray-400 group-hover:text-indigo-400 transition-transform duration-300 ${playlistsExpanded ? "rotate-90" : ""}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  )}
                </button>

                {playlists.length === 0 ? (
                  <div className="w-full border border-dashed border-white/10 rounded-2xl py-12 flex flex-col items-center justify-center text-zinc-500 gap-2">
                    <span className="text-sm font-medium tracking-wide">No Playlists Found</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {(playlistsExpanded ? playlists : playlists.slice(0, 5)).map((playlist, idx) => (
                      
                      /* Pass the onClick logic straight into the PlaylistCard component */
                      <PlaylistCard 
                        key={playlist.id || idx} 
                        playlist={playlist} 
                        onClick={() => {
                          setSelectedPlaylist(playlist);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                      />

                    ))}
                  </div>
                )}
              </section>

              {/* 4. Settings Section */}
              <section ref={settingsRef} className="scroll-mt-32 pt-4">
                <h3 className="text-xl lg:text-2xl font-semibold mb-6">Settings</h3>
                
                <div className="bg-[#151518] border border-white/5 rounded-2xl p-6 lg:p-8 shadow-2xl w-full">
                    
                  {/* Profile Pictures Action Row */}
                  <div className="flex flex-wrap items-center justify-center gap-12 pb-8 border-b border-white/5">
                    <div className="flex flex-col items-center gap-2 group cursor-pointer">
                      <div className="w-14 h-14 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:bg-zinc-800 transition-all shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-gray-400 group-hover:text-white transition-colors">Upload Profile Picture</span>
                    </div>

                    <div className="flex flex-col items-center gap-2 group cursor-pointer">
                      <div className="w-14 h-14 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-500 group-hover:text-red-400 group-hover:bg-red-500/5 transition-all shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.128 5.79c.342.052.682.107 1.022.166M19.128 5.79l-1.16 13.883A2.25 2.25 0 0 1 15.724 21.75H8.276a2.25 2.25 0 0 1-2.244-2.077L4.872 5.79m14.256 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-zinc-500 group-hover:text-red-400 transition-colors">Remove Profile Picture</span>
                    </div>
                  </div>

                  {/* Form Entry Area Container */}
                  <div className="pt-8 flex flex-col gap-6">
                    
                    {/* Change Username Input Section */}
                    <div className="w-full max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                      <label className="text-sm font-medium text-gray-300 sm:w-44 shrink-0">Change Username:</label>
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={displayUsername}
                        className="flex-1 bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    <hr className="border-white/5 my-2 max-w-2xl w-full mx-auto" />

                    {/* Password Management Block */}
                    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
                      <h4 className="text-sm font-medium text-gray-400 tracking-wide uppercase">Change account password</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-medium text-gray-400">Current Password:</label>
                          <input 
                            type="password" 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-medium text-gray-400">New Password:</label>
                          <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Save Button Row */}
                    <div className="mt-6 flex justify-center">
                      <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm px-10 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/20 active:scale-[0.98] cursor-pointer">
                        Save Changes
                      </button>
                    </div>

                  </div>
                </div>
              </section>
            </>
          )}

        </main>
      </div>
    </div>
  );
};

export default Account;