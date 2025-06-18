import { useState, useEffect } from "react";
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
  const [errorMessage, setErrorMessage] = useState("");

  //setting the movies list from api fetch
  const [movieList, setMovieList] = useState([]);

  //waiting for the movies to load
  const [isLoading, setIsLoading] = useState(false);

  //making request via async function
  const fetchMovies = async () => {
    //show loading animation before loading movies from api
    setIsLoading(true);
    setErrorMessage("");

    try {
      const endpoint = `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
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
  useEffect((effect) => {
    fetchMovies();
  }, []);

  return (
    <main>
      <div className="pattern" />

      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy!
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>
        {/* Here we call isLoading and error message from the state. if both are false we load the movies from movieList */}
        <section className="all-movies">
          <h2 className="mt-[20px]">All Movies</h2>
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
