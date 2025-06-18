import { useState, useEffect } from "react";
import { useDebounce } from './hooks/useDebounce.js';
import Spinner from "./components/Spinner.jsx";
import Search from "./components/Search.jsx";
import MovieCard from "./components/MovieCard.jsx";

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
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [errorMessage, setErrorMessage] = useState("");

  //setting the movies list from api fetch
  const [movieList, setMovieList] = useState([]);

  //waiting for the movies to load
  const [isLoading, setIsLoading] = useState(false);


  //making request via async function
  const fetchMovies = async (query = "") => {
    //show loading animation before loading movies from api
    setIsLoading(true);
    setErrorMessage("");

    try {
      const endpoint = query
      //passing the search query to api to get the searched movie
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
       //else use the default api to get the movies
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

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
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  return (
    <main>
      <div className="pattern" />

      <div className="wrapper">
        <header>
          <img src="./popcorn.png" alt="Hero Banner" />
          <h1 className="text-gradient">EZ Movies.</h1>
          <p className="text-desciption">Discover movies and shows you'll love with just a few clicks!</p>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>
        {/* Here we call isLoading and error message from the state. if both are false we load the movies from movieList */}
        <section className="all-movies">
          <h2 className="mt-[40px]">• All Movies</h2>
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
      </div>
    </main>
  );
};

export default App;
