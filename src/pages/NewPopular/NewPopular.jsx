import React, { useEffect, useState } from "react";
import "./NewPopular.css";
import Navbar from "../../Components/Navbar/Navbar";
import { useNavigate } from "react-router-dom";

const NewPopular = () => {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("movie");
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
    fetch(
      `https://api.themoviedb.org/3/trending/${tab}/week?language=en-US`,
      options,
    )
      .then((r) => r.json())
      .then((r) => {
        setTrending(r.results?.filter((i) => i.poster_path) || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tab]);

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
                  {/* ✅ Dono tabs mein Play button */}
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
      </div>
    </div>
  );
};

export default NewPopular;
