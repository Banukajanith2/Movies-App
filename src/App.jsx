import { useRef } from "react";
import Navbar from "./components/Navbar.jsx";
import HeroCarousel from "./components/HeroCarousel.jsx";
import MediaSlider, { ENDPOINTS } from "./components/MediaSlider.jsx";
import GenreBrowser from "./components/GenreBrowser.jsx";
import Footer from "./components/Footer.jsx";

const App = () => {
  const tvSectionRef = useRef(null);
  const movieSectionRef = useRef(null);
  const upcomingRef = useRef(null);
  const browseRef = useRef(null);

  return (
    <main className="select-none fade-in home-page">
      {/* Background pattern */}
      <div className="pattern" />
      <div className="footer-img" />

      {/* Sticky Navbar */}
      <Navbar
        tvSectionRef={tvSectionRef}
        movieSectionRef={movieSectionRef}
        browseRef={browseRef}
        
      />

      {/* Hero Carousel — full width, below nav */}
      <HeroCarousel />

      {/* Content sections */}
      <div className="home-content-wrapper">

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

        {/* Browse by Genre */}
        <GenreBrowser sectionRef={browseRef} />

        {/* Footer */}
        <Footer />
      </div>
    </main>
  );
};

export default App;
