import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { API_BASE_URL, API_OPTIONS } from "../constants/tmdbapicall";
import Spinner from "../components/Spinner";
import Navbar from "../components/Navbar"; // 1. Imported the clean Navbar component
import TrailerButton from "../components/TrailerButton";
import ImdbButton from "../components/ImdbButton";
import Footer from "../components/Footer";

const TVPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [tvShow, setTvShow] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodesList, setEpisodesList] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  const tvId = slug?.split("-").pop();

  // Fetch Core TV Show details
  useEffect(() => {
    if (!tvId) return;

    const fetchTVDetails = async () => {
      try {
        const endpoint = `${API_BASE_URL}/tv/${tvId}`;
        const response = await fetch(endpoint, API_OPTIONS);
        if (!response.ok) throw new Error("TV show fetch failed");

        const data = await response.json();
        setTvShow(data);
        setSelectedSeason(1);
        setSelectedEpisode(1);
      } catch (error) {
        console.error("Error fetching TV details:", error);
        navigate(`/404-Error`);
      } finally {
        setPageLoading(false);
      }
    };
    fetchTVDetails();
  }, [tvId, navigate]);

  // Fetch Episode lists when Season changes
  useEffect(() => {
    if (!tvId || !tvShow) return;

    const fetchSeasonDetails = async () => {
      setEpisodesLoading(true);
      try {
        const endpoint = `${API_BASE_URL}/tv/${tvId}/season/${selectedSeason}`;
        const response = await fetch(endpoint, API_OPTIONS);
        if (!response.ok) throw new Error("Season details fetch failed");

        const data = await response.json();
        setEpisodesList(data.episodes || []);
      } catch (error) {
        console.error("Error fetching season episodes:", error);
      } finally {
        setEpisodesLoading(false);
      }
    };

    fetchSeasonDetails();
  }, [selectedSeason, tvId, tvShow]);

  if (pageLoading) {
    return (
      <div className="fixed inset-0 bg-dark-100 flex items-center justify-center z-[9999]">
        <Spinner />
      </div>
    );
  }

  if (!tvShow) {
    navigate(`/404-Error`);
    return null;
  }

  const standardSeasons = tvShow.seasons?.filter((s) => s.season_number > 0) || [];

  return (
    <div className="relative">
      <img src="footer.png" alt="" className="z-0 hidden sm:block absolute bottom-0 w-full" />
      
      {/* 2. Swapped old nav structure with your clean Navbar */}
      <Navbar />

      {/* 3. Changed padding-top from pt-18 to pt-20 to perfectly match MoviePage sizing */}
      <div className="tv fade-in pt-20">
        
        {/* Backdrop / Main Player Window */}
        <div className="backdrop animate-slide-up" onClick={() => !showPlayer && setShowPlayer(true)}>
          {showPlayer ? (
            <div className="player">
              <iframe
                className="iframe"
                src={`https://vidsrcme.ru/embed/tv?tmdb=${tvShow.id}&season=${selectedSeason}&episode=${selectedEpisode}`}
                referrerPolicy="origin"
                allowFullScreen
              />
            </div>
          ) : (
            <>
              <img
                className="backdrop-img"
                src={tvShow.backdrop_path ? `https://image.tmdb.org/t/p/w500/${tvShow.backdrop_path}` : "no-movie.png"}
                alt={tvShow.name}
              />
              <svg
                className="play-icon"
                onClick={() => setShowPlayer(true)}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z"
                  clipRule="evenodd"
                />
              </svg>
            </>
          )}
        </div>

        {/* Season & Episode Selector Bar */}
        <div className="animate-slide-up w-full my-6 flex flex-col items-center justify-center sm:flex-row sm:flex-wrap sm:items-center gap-4 bg-dark-100/60 p-4 rounded-xl border border-light-100/10 backdrop-blur-md">
          <div className="flex flex-col w-full sm:w-auto sm:min-w-[140px]">
            <label className="text-xs lg:text-sm font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Season</label>
            <select
              value={selectedSeason}
              onChange={(e) => {
                setSelectedSeason(Number(e.target.value));
                setSelectedEpisode(1);
              }}
              className="bg-dark-200 text-white rounded-lg px-3 py-2 border border-light-100/20 focus:outline-none focus:border-indigo-500 cursor-pointer text-sm font-medium transition w-full"
            >
              {standardSeasons.length > 0 ? (
                standardSeasons.map((s) => (
                  <option key={s.id} value={s.season_number}>
                    Season {s.season_number}
                  </option>
                ))
              ) : (
                <option value={1}>Season 1</option>
              )}
            </select>
          </div>

          <div className="flex flex-col w-full sm:w-auto sm:min-w-[140px]">
            <label className="text-xs lg:text-sm font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Episode</label>
            <select
              value={selectedEpisode}
              disabled={episodesLoading}
              onChange={(e) => setSelectedEpisode(Number(e.target.value))}
              className="bg-dark-200 text-white rounded-lg px-3 py-2 border border-light-100/20 focus:outline-none focus:border-indigo-500 cursor-pointer text-sm font-medium transition disabled:opacity-50 w-full"
            >
              {episodesLoading ? (
                <option>Loading...</option>
              ) : episodesList.length > 0 ? (
                episodesList.map((ep) => (
                  <option key={ep.id} value={ep.episode_number}>
                    Ep {ep.episode_number} : {ep.name || `Episode ${ep.episode_number}`}
                  </option>
                ))
              ) : (
                Array.from({ length: tvShow.seasons?.find(s => s.season_number === selectedSeason)?.episode_count || 1 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    Episode {num}
                  </option>
                ))
              )}
            </select>
          </div>

          {showPlayer && (
            <div className="w-full items-center justify-center text-center text-xs sm:text-sm text-gray-400 italic pt-2 self-center">
              Playing Season {selectedSeason}, Episode {selectedEpisode}
            </div>
          )}
        </div>

        {/* Poster + Info Section */}
        <div className="poster-and-info animate-slide-up">
          <div className="poster">
            <img
              className="poster-img"
              src={tvShow.poster_path ? `https://image.tmdb.org/t/p/w500/${tvShow.poster_path}` : "no-movie.png"}
              alt={tvShow.name}
            />
          </div>
          <div className="movie-info">
            <h2 className="mb-3">{tvShow.name}</h2>
            <p className="mb-4 overflow-y-scroll max-h-40">{tvShow.overview || "No overview available."}</p>
            <p><strong>First Air Date :</strong> {tvShow.first_air_date || "N/A"}</p>
            <p><strong>IMDb :</strong> {tvShow.vote_average?.toFixed(1) || "N/A"}/10</p>
            <p><strong>Language :</strong> {tvShow.original_language === "en" ? "English" : tvShow.spoken_languages?.[0]?.english_name || tvShow.original_language}</p>
            <p><strong>Genre :</strong> {tvShow.genres?.map((genre, key) => (<span key={key}>{genre.name}{key < tvShow.genres.length - 1 ? ", " : ""}</span>))}</p>
            
            {/* Perfectly aligned action row */}
            <div className="flex items-center gap-3">
              <TrailerButton id={tvShow.id} mediaType="tv" />
              <ImdbButton id={tvShow.id} mediaType="tv" />
            </div>
          </div>
        </div>

        
        <Footer />
      </div>
    </div>
  );
};

export default TVPage;