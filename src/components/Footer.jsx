import { useNavigate } from "react-router-dom";

const EXPLORE_LINKS = [
  { label: "Home", path: "/" },
  { label: "Movies", path: "/movies" },
  { label: "TV Shows", path: "/tv-shows" },
  { label: "Browse", path: "/search" },
];

const ACCOUNT_LINKS = [
  { label: "Sign in", path: "/login" },
  { label: "My account", path: "/account" },
];

const Footer = () => {
  const navigate = useNavigate();

  const goTo = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="site-footer">
      <div className="site-footer-grid">

        {/* Brand */}
        <div className="site-footer-brand">
          <p className="site-footer-logo">EZ Movies</p>
          <p className="site-footer-tagline">
            Discover and stream trending movies and TV shows — search, build playlists,
            and pick up where you left off.
          </p>

          {/* Replace/extend with real profiles as you create them. */}
          <div className="social-icons">
            <a
              href="https://github.com/Banukajanith2"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              title="GitHub"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
              </svg>
            </a>
            <a
              href="https://banukajanith2.github.io/Portfolio/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Portfolio"
              title="Portfolio"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.9} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3 7.5 7.03 7.5 12s2.015 9 4.5 9Zm-8.716-5.25h17.432M3.284 8.25h17.432" />
              </svg>
            </a>
          </div>
        </div>

        {/* Explore */}
        <nav className="site-footer-col" aria-label="Explore">
          <p className="site-footer-heading">Explore</p>
          {EXPLORE_LINKS.map((link) => (
            <button key={link.path} onClick={() => goTo(link.path)} className="site-footer-link">
              {link.label}
            </button>
          ))}
        </nav>

        {/* Account */}
        <nav className="site-footer-col" aria-label="Account">
          <p className="site-footer-heading">Account</p>
          {ACCOUNT_LINKS.map((link) => (
            <button key={link.path} onClick={() => goTo(link.path)} className="site-footer-link">
              {link.label}
            </button>
          ))}
        </nav>

        {/* Attribution & disclaimer */}
        <div className="site-footer-col">
          <p className="site-footer-heading">Data &amp; content</p>

          <a
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer-tmdb"
            aria-label="The Movie Database"
          >
            <span className="site-footer-tmdb-badge">TMDB</span>
            <span>The Movie Database</span>
          </a>

          <p className="site-footer-note">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
          <p className="site-footer-note">
            EZ Movies hosts no video files. All playback is embedded from third-party
            providers, and their availability is outside our control.
          </p>
        </div>
      </div>

      <div className="site-footer-bar">
        <p>
          © {new Date().getFullYear()} EZ Movies · Built by{" "}
          <a
            href="https://banukajanith2.github.io/Portfolio/"
            target="_blank"
            rel="noopener noreferrer"
            className="site-footer-author"
          >
            Banuka Janith
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
