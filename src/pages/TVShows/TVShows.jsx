import React, { useEffect, useMemo, useState } from "react";
import "./TVShows.css";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/Footer";
import { useNavigate } from "react-router-dom";

const TV_CATEGORIES = [
  { label: "Trending", endpoint: "trending/tv/week" },
  { label: "Top Rated", endpoint: "tv/top_rated" },
  { label: "Popular", endpoint: "tv/popular" },
  { label: "Airing Today", endpoint: "tv/airing_today" },
  { label: "On The Air", endpoint: "tv/on_the_air" },
  
];

const TVShows = () => {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(TV_CATEGORIES[0]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigate = useNavigate();

  const options = useMemo(
    () => ({
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_TMDB_TOKEN}`,
      },
    }),
    [],
  );

  useEffect(() => {
    setLoading(true);
    setShows([]);
    setPage(1);
    setHasMore(true);
    fetch(
      `https://api.themoviedb.org/3/${activeCategory.endpoint}?language=en-US&page=1`,
      options,
    )
      .then((r) => r.json())
      .then((r) => {
        setShows(r.results?.filter((s) => s.poster_path) || []);
        setHasMore(r.page < r.total_pages);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeCategory, options]);

  const loadMore = () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    fetch(
      `https://api.themoviedb.org/3/${activeCategory.endpoint}?language=en-US&page=${nextPage}`,
      options,
    )
      .then((r) => r.json())
      .then((r) => {
        setShows((prev) => [
          ...prev,
          ...(r.results?.filter((s) => s.poster_path) || []),
        ]);
        setPage(nextPage);
        setHasMore(r.page < r.total_pages);
        setLoadingMore(false);
      })
      .catch(() => setLoadingMore(false));
  };

  return (
    <div className="tvshows-page">
      <Navbar />
      <div className="tvshows-content">
        <h1>📺 TV Shows</h1>

        {/* Category Tabs */}
        <div className="tv-tabs">
          {TV_CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              className={`tv-tab ${activeCategory.label === cat.label ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="tv-grid">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="tv-card-skeleton" />
            ))}
          </div>
        ) : (
          <div className="tv-grid">
            {shows.map((show) => (
              <div
                key={show.id}
                className="tv-card"
                onClick={() => navigate(`/tv/${show.id}`)}
              >
                <div className="tv-card-img-wrap">
                  <img
                    src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
                    alt={show.name}
                  />
                  <div className="tv-card-overlay">
                    <button className="tv-play-btn">▶ Play</button>
                  </div>
                  <span className="tv-rating">
                    ⭐{" "}
                    {show.vote_average > 0
                      ? show.vote_average.toFixed(1)
                      : "New"}
                  </span>
                </div>
                <p className="tv-card-title">{show.name}</p>
                <p className="tv-card-year">
                  {show.first_air_date?.slice(0, 4)}
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

export default TVShows;
