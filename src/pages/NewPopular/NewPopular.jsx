import React, { useEffect, useState } from "react";
import "./NewPopular.css";
import Navbar from "../../Components/Navbar/Navbar";
import Footer from "../../Components/Footer/Footer";
import { useNavigate } from "react-router-dom";

const NewPopular = () => {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("movie");
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
    setTrending([]);
    setPage(1);
    setHasMore(true);
    fetch(
      `https://api.themoviedb.org/3/trending/${tab}/week?language=en-US&page=1`,
      options,
    )
      .then((r) => r.json())
      .then((r) => {
        setTrending(r.results?.filter((i) => i.poster_path) || []);
        setHasMore(r.page < r.total_pages);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tab]);

  const loadMore = () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    fetch(
      `https://api.themoviedb.org/3/trending/${tab}/week?language=en-US&page=${nextPage}`,
      options,
    )
      .then((r) => r.json())
      .then((r) => {
        setTrending((prev) => [
          ...prev,
          ...(r.results?.filter((i) => i.poster_path) || []),
        ]);
        setPage(nextPage);
        setHasMore(r.page < r.total_pages);
        setLoadingMore(false);
      })
      .catch(() => setLoadingMore(false));
  };

  return (
    <div className="np-page">
      <Navbar />

      <div className="np-hero">
        <h1>🔥 New & Popular</h1>
        <p>What everyone's watching right now</p>
        <div className="np-tabs">
          <button
            className={`np-tab ${tab === "movie" ? "active" : ""}`}
            onClick={() => setTab("movie")}
          >
            🎬 Movies
          </button>
          <button
            className={`np-tab ${tab === "tv" ? "active" : ""}`}
            onClick={() => setTab("tv")}
          >
            📺 TV Shows
          </button>
        </div>
      </div>

      <div className="np-content">
        {loading ? (
          <div className="np-grid">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="np-skeleton" />
            ))}
          </div>
        ) : (
          <div className="np-grid">
            {trending.map((item, index) => (
              <div
                key={item.id}
                className="np-card"
                onClick={() =>
                  tab === "movie"
                    ? navigate(`/movie/${item.id}`)
                    : navigate(`/tv/${item.id}`)
                }
              >
                <div className="np-rank">#{index + 1}</div>
                <div className="np-card-img-wrap">
                  <img
                    src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                    alt={item.title || item.name}
                  />
                  <div className="np-card-overlay">
                    <button className="np-play-btn">▶ Play</button>
                  </div>
                  <span className="np-rating">
                    ⭐ {item.vote_average?.toFixed(1)}
                  </span>
                </div>
                <p className="np-title">{item.title || item.name}</p>
                <p className="np-year">
                  {(item.release_date || item.first_air_date)?.slice(0, 4)}
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

export default NewPopular;
