import { useState, useEffect } from "react";
import { useDebounce } from "./hooks/useDebounce.js";
import Spinner from "./components/Spinner.jsx";
import Search from "./components/Search.jsx";
import MovieCard from "./components/MovieCard.jsx";
import { getTrendingMovies, updateSearchCount } from "./FirestoreService.js"; 
//using Firebase, Firestore as Backend

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
  const debouncedSearchTerm = useDebounce(searchTerm, 700);

  const [errorMessage, setErrorMessage] = useState("");

  //setting the trending movies from appwrite database
  const [trendingMovies, setTrendingMovies] = useState([]);

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
          `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${pageNumber}`
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

  // Fetch trending movies from Firestore
  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (error) {
      console.error(
        `Error Fetching Trending Movies From Firebase : ${error.message}`
      );
    }
  };

  //run fetch api after page loads
  //also run fetch api for search term
  //run the search through debounce
  useEffect(() => {
    fetchMovies(debouncedSearchTerm, page);
}, [debouncedSearchTerm, page]);


  //run fetch api for trending movies
  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern" />
      <div className="footer-img" />

      <div className="wrapper">
        <header>
          <img src="./popcorn.png" alt="Hero Banner" />
          <h1 className="text-gradient">EZ Movies.</h1>
          <p className="text-desciption">
            Discover movies and shows you'll love with just a few clicks!
          </p>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>
        {/* Trending Movies Section */}
        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}
        {/* Here we call isLoading and error message from the state. if both are false we load the movies from movieList */}
        <section className="all-movies">
          <h2 className="mt-[10px]">All Movies</h2>
          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {/* Mapping over the movieList array and giving each movie an id using key */}
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
        
        <div className="flex overflow-x-scroll overflow-y-hidden pb-4 gap-2 mt-10">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30].map((num) => (
            <button
              key={num}
              onClick={() => setPage(num)}
              className={`px-3 py-1 rounded ${
                page === num
                  ? "bg-purple-100 text-white"
                  : "bg-light-200/5 text-white hover:bg-purple-100"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
        
        <footer className="bg-light-200/5 p-5 mt-10 rounded-2xl shadow-inner shadow-light-100/10">
          <div className="flex flex-col items-center gap-4">
            
            <div className="social-icons">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                >
                  <path d="M22 12a10 10 0 10-11.5 9.9v-7H8v-2.9h2.5v-2.2c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.5v1.9h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                >
                  <path d="M22.46 6c-.77.35-1.6.59-2.46.7a4.27 4.27 0 001.88-2.37 8.53 8.53 0 01-2.7 1.03 4.25 4.25 0 00-7.24 3.87 12.06 12.06 0 01-8.77-4.45 4.23 4.23 0 001.32 5.68 4.22 4.22 0 01-1.93-.54v.05a4.25 4.25 0 003.41 4.17 4.27 4.27 0 01-1.92.07 4.25 4.25 0 003.96 2.94 8.52 8.52 0 01-6.29 1.75 12.03 12.03 0 006.49 1.9c7.78 0 12.03-6.45 12.03-12.03 0-.18-.01-.35-.02-.53A8.55 8.55 0 0024 4.56a8.39 8.39 0 01-2.54.7z" />
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                >
                  <path d="M7.75 2A5.75 5.75 0 002 7.75v8.5A5.75 5.75 0 007.75 22h8.5A5.75 5.75 0 0022 16.25v-8.5A5.75 5.75 0 0016.25 2h-8.5zm0 1.5h8.5c2.35 0 4.25 1.9 4.25 4.25v8.5c0 2.35-1.9 4.25-4.25 4.25h-8.5A4.25 4.25 0 013.5 16.25v-8.5C3.5 5.9 5.4 4 7.75 4zM12 7a5 5 0 100 10 5 5 0 000-10zm0 1.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zm5.5-.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                >
                  <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8.5h5v15H0v-15zM7.5 8.5h4.7v2.1h.1c.66-1.2 2.3-2.4 4.7-2.4 5 0 5.9 3.3 5.9 7.6v8.2h-5v-7.3c0-1.8-.03-4.1-2.5-4.1-2.5 0-2.9 2-2.9 4v7.4h-5v-15z" />
                </svg>
              </a>
            </div>

            <p className="text-gray-100 font-bold">
              © 2025 EZ Movies - By{" "}
              <a
                href="https://github.com/Banukajanith2"
                target="_blank"
                className="underline hover:no-underline"
              >
                Banuka Janith
              </a>
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
};

export default App;
