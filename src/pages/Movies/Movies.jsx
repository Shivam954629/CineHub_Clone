import React, { useEffect, useState } from "react";
import "./Movies.css";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/Footer";
import { useNavigate } from "react-router-dom";

const GENRES = [
  { id: 28, name: "Action" },
  { id: 35, name: "Comedy" },
  { id: 27, name: "Horror" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 18, name: "Drama" },
  { id: 16, name: "Animation" },
  { id: 53, name: "Thriller" },
];

const Movies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGenre, setActiveGenre] = useState(null);
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [bollywood, setBollywood] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigate = useNavigate();

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_TMDB_TOKEN}`,
    },
  };

  useEffect(() => {
    setLoading(true);
    setMovies([]);
    setPage(1);
    setHasMore(true);
    const genreParam = activeGenre ? `&with_genres=${activeGenre}` : "";
    const url = bollywood
      ? `https://api.themoviedb.org/3/discover/movie?with_original_language=hi&sort_by=popularity.desc&page=1`
      : `https://api.themoviedb.org/3/discover/movie?sort_by=${sortBy}&page=1${genreParam}&language=en-US`;
    fetch(url, options)
      .then((r) => r.json())
      .then((r) => {
        setMovies(r.results?.filter((m) => m.poster_path) || []);
        setHasMore(r.page < r.total_pages);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeGenre, sortBy, bollywood]);

  const loadMore = () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    const genreParam = activeGenre ? `&with_genres=${activeGenre}` : "";
    const url = bollywood
      ? `https://api.themoviedb.org/3/discover/movie?with_original_language=hi&sort_by=popularity.desc&page=${nextPage}`
      : `https://api.themoviedb.org/3/discover/movie?sort_by=${sortBy}&page=${nextPage}${genreParam}&language=en-US`;
    fetch(url, options)
      .then((r) => r.json())
      .then((r) => {
        setMovies((prev) => [
          ...prev,
          ...(r.results?.filter((m) => m.poster_path) || []),
        ]);
        setPage(nextPage);
        setHasMore(r.page < r.total_pages);
        setLoadingMore(false);
      })
      .catch(() => setLoadingMore(false));
  };

  return (
    <div className="movies-page">
      <Navbar />
      <div className="movies-content">
        <div className="movies-header">
          <h1>🎬 Movies</h1>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="popularity.desc">Most Popular</option>
            <option value="vote_average.desc">Top Rated</option>
            <option value="release_date.desc">Latest</option>
            <option value="revenue.desc">Box Office</option>
          </select>
        </div>

        {/* Genre Filter */}
        <div className="genre-filters">
          <button
            className={`genre-btn ${bollywood ? "active" : ""}`}
            onClick={() => {
              setBollywood(true);
              setActiveGenre(null);
            }}
          >
            Bollywood
          </button>
          <button
            className={`genre-btn ${!activeGenre && !bollywood ? "active" : ""}`}
            onClick={() => {
              setBollywood(false);
              setActiveGenre(null);
              setSortBy("popularity.desc");
            }}
          >
            All
          </button>
          {GENRES.map((g) => (
            <button
              key={g.id}
              className={`genre-btn ${activeGenre === g.id ? "active" : ""}`}
              onClick={() => {
                setBollywood(false);
                setActiveGenre(g.id);
              }}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="movies-grid">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="movie-card-skeleton" />
            ))}
          </div>
        ) : (
          <div className="movies-grid">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="movie-card"
                onClick={() => navigate(`/movie/${movie.id}`)}
              >
                <div className="movie-card-img-wrap">
                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title}
                  />
                  <div className="movie-card-overlay">
                    <button className="card-play-btn">▶ Play</button>
                  </div>
                  <span className="movie-rating">
                    ⭐{" "}
                    {movie.vote_average > 0
                      ? movie.vote_average.toFixed(1)
                      : "New"}
                  </span>
                </div>
                <p className="movie-card-title">{movie.title}</p>
                <p className="movie-card-year">
                  {movie.release_date?.slice(0, 4)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && !loading && (
          <div className="load-more-wrap">
            <button
              className="load-more-btn"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Movies;
