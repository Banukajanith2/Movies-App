import { useRef } from "react";
import Navbar from "./components/Navbar.jsx";
import HeroCarousel from "./components/HeroCarousel.jsx";
import ContinueWatchingRow from "./components/ContinueWatchingRow.jsx";
import BecauseYouLikedRow from "./components/BecauseYouLikedRow.jsx";
import MediaSlider, { ENDPOINTS } from "./components/MediaSlider.jsx";
import Footer from "./components/Footer.jsx";
import BackToTop from "./components/BackToTop.jsx";
import { usePageMeta } from "./hooks/usePageMeta.js";

const App = () => {
  usePageMeta({
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "EZ Movies",
      url: `${window.location.origin}${import.meta.env.BASE_URL}`,
      potentialAction: {
        "@type": "SearchAction",
        target: `${window.location.origin}${import.meta.env.BASE_URL}search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  });

  const tvSectionRef = useRef(null);
  const movieSectionRef = useRef(null);
  const upcomingRef = useRef(null);

  return (
    <main className="select-none fade-in home-page">
      {/* Background pattern */}
      <div className="pattern" />
      <div className="footer-img" />

      {/* Sticky Navbar */}
      <Navbar />

      {/* Hero Carousel — full width, below nav */}
      <HeroCarousel />

      {/* Content sections */}
      <div className="home-content-wrapper">

        {/* Continue Watching (logged-in users only) */}
        <ContinueWatchingRow />

        {/* Popular TV Shows */}
        <MediaSlider
          title="Latest Popular TV Shows"
          endpoint={ENDPOINTS.popularTV}
          accentColor="amber"
          sectionRef={tvSectionRef}
        />

        {/* Most Popular Movies */}
        <MediaSlider
          title="Trending Popular Movies"
          endpoint={ENDPOINTS.popularMovies}
          accentColor="indigo"
          sectionRef={movieSectionRef}
        />

        {/* Upcoming Movies */}
        <MediaSlider
          title="Latest Movies"
          endpoint={ENDPOINTS.upcoming}
          accentColor="cyan"
          sectionRef={upcomingRef}
        />

        {/* Personalized recommendations (logged-in users only) */}
        <BecauseYouLikedRow mediaType="movie" />
        <BecauseYouLikedRow mediaType="tv" />

        {/* Footer */}
        <Footer />
      </div>

      <BackToTop />
    </main>
  );
};

export default App;
