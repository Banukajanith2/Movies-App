import { useState, useEffect } from "react";
import { useRef } from "react";
import { useDebounce } from "./hooks/useDebounce.js";
import Spinner from "./components/Spinner.jsx";
import Search from "./components/Search.jsx";
import MovieCard from "./components/MovieCard.jsx";
import { updateSearchCount } from "./FirestoreService.js"; //using Firestore as Backend
import TrendingMovies from "./components/TrendingMovies.jsx";
import Footer from "./components/Footer.jsx";

//get api key to make the request
const API_BASE_URL = "https://api.themoviedb.org/3";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");

  //only fetch data when the search term changes and after 500 ms of typing using debounce
  const debouncedSearchTerm = useDebounce(searchTerm, 1000);

  const [errorMessage, setErrorMessage] = useState("");

  //setting the movies list from api fetch
  const [movieList, setMovieList] = useState([]);

  const [page, setPage] = useState(1);

  //waiting for the movies to load
  const [isLoading, setIsLoading] = useState(false);

  //making request via async function
  const fetchMovies = async (query = "", pageNumber = 1) => {
    //show loading animation before loading movies from api
    setIsLoading(true);
    setErrorMessage("");

    try {
      const endpoint = query
        ? //passing the search query to api to get the searched movie
          `${API_BASE_URL}/search/movie?query=${encodeURIComponent(
            query
          )}&page=${pageNumber}`
        : //else use the default api to get the movies
          `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&page=${pageNumber}`;

      const response = await fetch(endpoint, API_OPTIONS);

      //error handling of the API
      if (!response.ok) {
        throw new Error("Failed to fetch movies");
      }
      const data = await response.json();
      //console.log(data);

      if (data.Response === "False") {
        setErrorMessage(data.Error || "Failed to Fetch Movies");
        setMovieList([]);
        return;
      }
      //if API is good, set the movie list
      setMovieList(data.results || []);

      // Update search count in Firestore
      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }

      //If API doesnt work
    } catch (error) {
      setErrorMessage("Error Fetching Movies from API : " + error);
    } finally {
      //stop the loading animation
      setIsLoading(false);
    }
  };

  //run fetch api after page loads
  //also run fetch api for search term
  //run the search through debounce
  useEffect(() => {
    fetchMovies(debouncedSearchTerm, page);
  }, [debouncedSearchTerm, page]);

  return (
    <>
      <main className="select-none fade-in">
        <div className="pattern" />
        <div className="footer-img" />
        <div className="wrapper">
          <header>
            <img src="./popcorn.png" alt="Hero Banner" />
            <h1 className="text-gradient">EZ Movies</h1>
            <p className="text-desciption">
              Discover Your Favourite Movies Online
            </p>
            <Search
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              className="search"
            />
          </header>
          {/* Trending Movies Section with scroll SwiperJs */}
          <TrendingMovies scrollOnClick={false}/>
          {/* Here we call isLoading and error message from the state. if both are false we load the movies from movieList */}
          <section className="all-movies">
            <h2 className="mb-5">Popular Movies</h2>
            {isLoading ? (
              <Spinner />
            ) : errorMessage ? (
              <p className="text-red-500">{errorMessage}</p>
            ) : (
              <ul className="animate-slide-up">
                {/* Mapping over the movieList array and giving each movie an id using key */}
                {movieList.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </ul>
            )}
          </section>

          <div className="flex overflow-x-scroll overflow-y-hidden pb-4 gap-2 mt-10">
            {[
              1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
              20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
            ].map((num) => (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`px-3 py-1 rounded shadow-inner shadow-light-100/10 ${
                  page === num
                    ? "bg-indigo-500 text-white"
                    : "bg-dark-100/5 text-white hover:bg-indigo-500"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          <Footer/>
        </div>
      </main>
    </>
  );
};

export default App;
