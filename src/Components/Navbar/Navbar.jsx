import React, { useEffect, useRef, useState } from "react";
import "./Navbar.css";
import search_icon from "../../assets/search_icon.svg";
import bell_icon from "../../assets/bell_icon.svg";
import profile_img from "../../assets/profile_img.png";
import caret_icon from "../../assets/caret_icon.svg";
import { logout } from "../../firebase";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [navScrolled, setNavScrolled] = useState(false);
  const searchRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(
        `https://api.themoviedb.org/3/search/movie?query=${searchQuery}&language=en-US&page=1`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_TMDB_TOKEN}`,
          },
        },
      )
        .then((res) => res.json())
        .then((res) => setSearchResults(res.results?.slice(0, 6) || []))
        .catch((err) => console.error(err));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`navbar ${navScrolled ? "navbar-scrolled" : ""}`}>
      <div className="navbar-left">
        <div className="logo-text" onClick={() => navigate("/")}>
          CINE<span>HUB</span>
        </div>
        <ul>
          <li onClick={() => navigate("/")}>Home</li>
          <li>TV Shows</li>
          <li>Movies</li>
          <li>New & Popular</li>
          <li onClick={() => navigate("/watchlist")}>My List</li>
        </ul>
      </div>
      <div className="navbar-right">
        <div className="search-container" ref={searchRef}>
          <img
            src={search_icon}
            alt="search"
            className="search-icon-btn"
            onClick={() => setShowSearch(!showSearch)}
          />
          {showSearch && (
            <input
              type="text"
              className="search-input"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          )}
          {searchResults.length > 0 && (
            <div className="search-dropdown">
              {searchResults.map((movie) => (
                <div
                  key={movie.id}
                  className="search-result-item"
                  onClick={() => {
                    navigate(`/movie/${movie.id}`);
                    setShowSearch(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  {movie.backdrop_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${movie.backdrop_path}`}
                      alt={movie.title}
                    />
                  ) : (
                    <div className="no-img">🎬</div>
                  )}
                  <div className="search-result-info">
                    <p className="result-title">{movie.title}</p>
                    <p className="result-year">
                      {movie.release_date?.slice(0, 4)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <img src={bell_icon} alt="bell" className="icons" />
        <div className="navbar-profile">
          <img src={profile_img} alt="profile" className="profile-img" />
          <img src={caret_icon} alt="caret" className="caret-icon" />
          <div className="dropdown">
            <p
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Sign Out
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
