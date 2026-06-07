import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

// Component imports
import MovieCard from "../components/MovieCard";
import TvCard from "../components/TvCard";
import PlaylistCard from "../components/PlaylistCard";
import PlaylistPage from "../components/PlaylistPage"; 
import Spinner from "../components/Spinner";

// Firebase Modules
import { db, auth } from "../firebase/config"; 
import { doc, onSnapshot } from "firebase/firestore";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";

// Import playlist retrieval service
import { getUserPlaylists } from "../firebase/useFirestore";

const Account = () => {
  const navigate = useNavigate();
  const { currentUser, logout, refreshUser } = useAuth();

  // --- Real-time Dynamic Storage Arrays ---
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [favoriteTvShows, setFavoriteTvShows] = useState([]);
  const [playlists, setPlaylists] = useState([]); 
  const [loadingMedia, setLoadingMedia] = useState(true);

  // --- Playlist Detail Panel Selection State ---
  const [selectedPlaylist, setSelectedPlaylist] = useState(null); 

  // --- Accordion / Expansion States ---
  const [moviesExpanded, setMoviesExpanded] = useState(false);
  const [tvExpanded, setTvExpanded] = useState(false);
  const [playlistsExpanded, setPlaylistsExpanded] = useState(false);

  // --- Form States for Settings ---
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // --- Status & UX Feedback States ---
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

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
      setPlaylists([]); 
      setLoadingMedia(false);
      return;
    }

    setLoadingMedia(true);
    const userRef = doc(db, "users", currentUser.uid);

    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      try {
        const playlistsPromise = getUserPlaylists(currentUser.uid);

        let resolvedMovies = [];
        let resolvedTv = [];

        if (docSnap.exists()) {
          const userData = docSnap.data();
          const movieIds = userData.favoriteMovies || [];
          const tvIds = userData.favoriteTvShows || [];

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

        const dbPlaylists = await playlistsPromise;

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

  // Sync username input state field with Auth value on mount
  useEffect(() => {
    if (currentUser?.displayName) {
      setUsername(currentUser.displayName);
    }
  }, [currentUser]);

  const scrollToSection = (elementRef) => {
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

  // ── USERNAME & PASSWORD FORM SUBMIT HANDLER ──────────────────────────────
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsUpdating(true);
    setStatusMsg({ type: "", text: "" });

    try {
      let profileUpdated = false;

      // 1. Handle Username Update if altered
      if (username.trim() && username !== currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: username.trim() });
        profileUpdated = true;
      }

      // 2. Handle Sensitive Password Security Chain Update if populated
      if (newPassword) {
        if (!currentPassword) {
          throw new Error("Current password is required to change to a new password.");
        }

        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPassword);
        
        setCurrentPassword("");
        setNewPassword("");
        profileUpdated = true;
      }

      if (profileUpdated) {
        refreshUser(); 
      }

      setStatusMsg({ type: "success", text: "Account profile changes saved successfully!" });
    } catch (error) {
      console.error("Error updating account credentials details:", error);
      let localizedError = "An error occurred while saving changes.";
      if (error.code === "auth/wrong-password") {
        localizedError = "The current password provided is invalid.";
      } else if (error.message) {
        localizedError = error.message;
      }
      setStatusMsg({ type: "error", text: localizedError });
    } finally {
      setIsUpdating(false);
    }
  };

  const displayUsername = currentUser?.displayName || currentUser?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text transition-colors duration-300 pt-28 pb-16 px-4 md:px-8 lg:px-12 max-w-[1600px] mx-auto">
      <Navbar />
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] lg:grid-cols-[300px_1fr] gap-8 lg:gap-12 items-start">
        
        {/* ==========================================================================
            LEFT SIDEBAR (User Summary + Navigation Control)
            ========================================================================== */}
        <aside className="flex flex-col items-center sticky top-28">
          <div className="w-32 h-32 rounded-full bg-brand-bg border-2 border-brand-text/10 shadow-inner flex items-center justify-center overflow-hidden mb-4">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-muted">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            )}
          </div>

          <h2 className="text-2xl font-bold tracking-wide text-center break-all px-2 text-brand-text">{displayUsername}</h2>
          
          <button 
            onClick={handleLogout}
            className="mt-1 text-sm font-semibold text-muted hover:text-red-400 transition-colors cursor-pointer"
          >
            Logout
          </button>

          <div className="mt-8 w-full bg-surface border border-brand-text/10 rounded-2xl p-4 flex flex-col gap-1 shadow-xl">
            <button onClick={() => scrollToSection(moviesRef)} className="w-full text-left px-4 py-3 text-sm font-medium text-brand-text rounded-xl hover:bg-brand-text/5 transition-all cursor-pointer">
              Favourite Movies
            </button>
            <button onClick={() => scrollToSection(tvRef)} className="w-full text-left px-4 py-3 text-sm font-medium text-brand-text rounded-xl hover:bg-brand-text/5 transition-all cursor-pointer">
              Favourite TV
            </button>
            <button onClick={() => scrollToSection(playlistsRef)} className="w-full text-left px-4 py-3 text-sm font-medium text-brand-text rounded-xl hover:bg-brand-text/5 transition-all cursor-pointer">
              Playlists
            </button>
            <button onClick={() => scrollToSection(settingsRef)} className="w-full text-left px-4 py-3 text-sm font-medium text-brand-text rounded-xl hover:bg-brand-text/5 transition-all cursor-pointer">
              Settings
            </button>
          </div>
        </aside>

        {/* ==========================================================================
            RIGHT CONTENT AREA (Main Panels)
            ========================================================================== */}
        <main className="md:border-l border-brand-text/10 md:pl-8 lg:pl-12 flex flex-col gap-12">
          
          {selectedPlaylist ? (
            <PlaylistPage 
              playlist={selectedPlaylist} 
              userId={currentUser?.uid} 
              onBack={() => setSelectedPlaylist(null)}
              onPlaylistDeleted={(deletedId) => {
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
                    favoriteMovies.length > 5 ? "hover:text-accent cursor-pointer" : "cursor-default"
                  }`}
                >
                  <span className="text-brand-text">Favourite Movies</span>
                  {favoriteMovies.length > 5 && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-5 h-5 text-muted group-hover:text-accent transition-transform duration-300 ${moviesExpanded ? "rotate-90" : ""}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  )}
                </button>

                {favoriteMovies.length === 0 ? (
                  <div className="w-full border border-dashed border-brand-text/10 rounded-2xl py-12 flex flex-col items-center justify-center text-muted gap-2">
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
                    favoriteTvShows.length > 5 ? "hover:text-accent cursor-pointer" : "cursor-default"
                  }`}
                >
                  <span className="text-brand-text">Favourite TV Shows</span>
                  {favoriteTvShows.length > 5 && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-5 h-5 text-muted group-hover:text-accent transition-transform duration-300 ${tvExpanded ? "rotate-90" : ""}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  )}
                </button>

                {favoriteTvShows.length === 0 ? (
                  <div className="w-full border border-dashed border-brand-text/10 rounded-2xl py-12 flex flex-col items-center justify-center text-muted gap-2">
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
                    playlists.length > 5 ? "hover:text-accent cursor-pointer" : "cursor-default"
                  }`}
                >
                  <span className="text-brand-text">Playlists</span>
                  {playlists.length > 5 && (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-5 h-5 text-muted group-hover:text-accent transition-transform duration-300 ${playlistsExpanded ? "rotate-90" : ""}`}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  )}
                </button>

                {playlists.length === 0 ? (
                  <div className="w-full border border-dashed border-brand-text/10 rounded-2xl py-12 flex flex-col items-center justify-center text-muted gap-2">
                    <span className="text-sm font-medium tracking-wide">No Playlists Found</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {(playlistsExpanded ? playlists : playlists.slice(0, 5)).map((playlist, idx) => (
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
                <h3 className="text-xl lg:text-2xl font-semibold mb-6 text-brand-text">Settings</h3>
                
                <div className="bg-surface border border-brand-text/10 rounded-2xl p-6 lg:p-8 shadow-2xl w-full">
                    
                  {/* Profile Pictures Action Row */}
                  <div className="flex flex-wrap items-center justify-center gap-12 pb-8 border-b border-brand-text/10">
                    <div className="flex flex-col items-center gap-2 group cursor-pointer">
                      <div className="w-14 h-14 rounded-full bg-brand-bg border border-brand-text/10 flex items-center justify-center text-muted group-hover:text-brand-text group-hover:bg-brand-text/5 transition-all shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-muted group-hover:text-brand-text transition-colors">Upload Profile Picture</span>
                    </div>

                    <div className="flex flex-col items-center gap-2 group cursor-pointer">
                      <div className="w-14 h-14 rounded-full bg-brand-bg border border-brand-text/10 flex items-center justify-center text-muted/60 group-hover:text-red-400 group-hover:bg-red-500/5 transition-all shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.128 5.79c.342.052.682.107 1.022.166M19.128 5.79l-1.16 13.883A2.25 2.25 0 0 1 15.724 21.75H8.276a2.25 2.25 0 0 1-2.244-2.077L4.872 5.79m14.256 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </div>
                      <span className="text-xs font-medium text-muted/60 group-hover:text-red-400 transition-colors">Remove Profile Picture</span>
                    </div>
                  </div>

                  {/* Form Entry Area Container */}
                  <form onSubmit={handleSaveChanges} className="pt-8 flex flex-col gap-6">
                    
                    {/* Change Username */}
                    <div className="w-full max-w-2xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                      <label className="text-sm font-medium text-brand-text sm:w-44 shrink-0">Change Username:</label>
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={displayUsername}
                        disabled={isUpdating}
                        className="flex-1 bg-brand-bg border border-brand-text/10 rounded-xl px-4 py-2 text-sm text-brand-text placeholder:text-muted focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
                      />
                    </div>

                    <hr className="border-brand-text/10 my-2 max-w-2xl w-full mx-auto" />

                    {/* Password Management */}
                    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
                      <h4 className="text-sm font-medium text-muted tracking-wide uppercase">Change account password</h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-medium text-muted">Current Password:</label>
                          <input 
                            type="password" 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            disabled={isUpdating}
                            className="bg-brand-bg border border-brand-text/10 rounded-xl px-4 py-2 text-sm text-brand-text focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-medium text-muted">New Password:</label>
                          <input 
                            type="password" 
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isUpdating}
                            className="bg-brand-bg border border-brand-text/10 rounded-xl px-4 py-2 text-sm text-brand-text focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Feedback Message Block Banner */}
                    {statusMsg.text && (
                      <div className={`w-full max-w-2xl mx-auto text-center text-sm p-3 rounded-xl border ${
                        statusMsg.type === "success" 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                          : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      }`}>
                        {statusMsg.text}
                      </div>
                    )}

                    {/* Save Button Row */}
                    <div className="mt-2 flex justify-center">
                      <button 
                        type="submit"
                        disabled={isUpdating}
                        className="bg-accent hover:bg-accent-hover text-white font-medium text-sm px-10 py-3 rounded-xl transition-all duration-200 shadow-md shadow-accent/20 active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isUpdating ? "Saving Changes..." : "Save Changes"}
                      </button>
                    </div>

                  </form>
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