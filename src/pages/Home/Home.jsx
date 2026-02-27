import React, { useEffect, useState, useCallback } from "react";
import "./Home.css";
import Navbar from "../../Components/Navbar/Navbar";
import TitleCards from "../../Components/TitleCards/TitleCards";
import Footer from "../../Components/Footer/Footer";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/trending/movie/week?language=en-US`, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_TMDB_TOKEN}`,
      },
    })
      .then((r) => r.json())
      .then((r) => {
        const filtered = r.results
          ?.filter((m) => m.backdrop_path && m.overview)
          .slice(0, 8);
        setMovies(filtered || []);
      })
      .catch(console.error);
  }, []);

  // Smooth transition helper
  const changeTo = useCallback((index) => {
    setFade(false);
    setTimeout(() => {
      setCurrentIndex(index);
      setFade(true);
    }, 400);
  }, []);

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (movies.length === 0) return;
    const timer = setInterval(() => {
      changeTo((prev) => (prev + 1) % movies.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [movies, changeTo]);

  const handlePrev = () => {
    changeTo((currentIndex - 1 + movies.length) % movies.length);
  };

  const handleNext = () => {
    changeTo((currentIndex + 1) % movies.length);
  };

  const heroMovie = movies[currentIndex];

  return (
    <div className="home">
      <Navbar />

      {/* ===== HERO BANNER ===== */}
      <div className="hero">
        {/* Background Image */}
        <div
          className={`banner-bg ${fade ? "fade-in" : "fade-out"}`}
          style={{
            backgroundImage: heroMovie?.backdrop_path
              ? `url(https://image.tmdb.org/t/p/original${heroMovie.backdrop_path})`
              : "none",
          }}
        />

        {/* Overlays */}
        <div className="hero-overlay" />
        <div className="hero-bottom-fade" />

        {/* Left Arrow */}
        <button className="hero-arrow hero-arrow-left" onClick={handlePrev}>
          ‹
        </button>

        {/* Right Arrow */}
        <button className="hero-arrow hero-arrow-right" onClick={handleNext}>
          ›
        </button>

        {/* Caption */}
        {heroMovie && (
          <div className={`hero-caption ${fade ? "fade-in" : "fade-out"}`}>
            <div className="hero-meta">
              <span className="hero-rating">
                ⭐{" "}
                {heroMovie.vote_average > 0
                  ? heroMovie.vote_average.toFixed(1)
                  : "New"}
              </span>
              <span className="hero-year">
                {heroMovie.release_date?.slice(0, 4)}
              </span>
              <span className="hero-badge">HD</span>
            </div>
            <h1 className="hero-title">{heroMovie.title}</h1>
            <p className="hero-overview">
              {heroMovie.overview?.length > 160
                ? heroMovie.overview.slice(0, 160) + "..."
                : heroMovie.overview}
            </p>
            <div className="hero-btns">
              <button
                className="btn play-btn"
                onClick={() => navigate(`/player/${heroMovie.id}`)}
              >
                ▶ Play
              </button>
              <button
                className="btn dark-btn"
                onClick={() => navigate(`/movie/${heroMovie.id}`)}
              >
                ℹ More Info
              </button>
            </div>
          </div>
        )}

        {/* Dot Indicators */}
        {movies.length > 0 && (
          <div className="hero-dots">
            {movies.map((_, i) => (
              <button
                key={i}
                className={`hero-dot ${i === currentIndex ? "active" : ""}`}
                onClick={() => changeTo(i)}
              />
            ))}
          </div>
        )}

        {/* Progress Bar */}
        <div className="hero-progress">
          <div className={`hero-progress-bar ${fade ? "running" : ""}`} />
        </div>
      </div>

      {/* ===== MOVIE ROWS ===== */}
      <div className="more-cards">
        <TitleCards title={"Popular on CineHub"} category={"now_playing"} />
        <TitleCards title={"Blockbuster Movies"} category={"top_rated"} />
        <TitleCards title={"Hindi Movies"} category={"hindi"} />
        <TitleCards title={"Only on CineHub"} category={"popular"} />
        <TitleCards title={"Upcoming"} category={"upcoming"} />
        <TitleCards title={"Top Picks for You"} category={"now_playing"} />
      </div>

      <Footer />
    </div>
  );
};

export default Home;
