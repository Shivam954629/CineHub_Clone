import React, { useEffect, useRef, useState } from "react";
import "./Navbar.css";
import search_icon from "../../assets/search_icon.svg";
import bell_icon from "../../assets/bell_icon.svg";
import profile_img from "../../assets/profile_img.png";
import caret_icon from "../../assets/caret_icon.svg";
import { logout } from "../../firebase";
import { useNavigate, useLocation } from "react-router-dom";
import { db, auth } from "../../firebase";

import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showBell, setShowBell] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const bellRef = useRef();
  const searchRef = useRef();
  const profileRef = useRef();
  const prevWatchlistIds = useRef(null); // null = not loaded yet

  const getActiveNav = () => {
    const path = location.pathname;
    if (path === "/") return "Home";
    if (path === "/tvshows") return "TV Shows";
    if (path === "/movies") return "Movies";
    if (path === "/new-popular") return "New & Popular";
    if (path === "/watchlist") return "My List";
    return "";
  };
  const activeNav = getActiveNav();
  const searchType = location.pathname === "/tvshows" ? "tv" : "movie";

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Search debounce
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      fetch(
        `https://api.themoviedb.org/3/search/${searchType}?query=${searchQuery}&language=en-US&page=1`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_TMDB_TOKEN}`,
          },
        },
      )
        .then((res) => res.json())
        .then((res) => {
          setSearchResults(res.results?.slice(0, 6) || []);
          setSearching(false);
        })
        .catch((err) => {
          console.error(err);
          setSearching(false);
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, searchType]);

  // Click outside search
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

  // Click outside bell
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowBell(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Click outside profile dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Load saved notifications from Firestore
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "notifications"),
      where("uid", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map((d) => ({
        firestoreId: d.id,
        ...d.data(),
      }));
      setNotifications(notifs);
    });

    return () => unsub();
  }, [currentUser]);

  // Watch watchlist changes — create notification on new add
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "watchlist"),
      where("uid", "==", currentUser.uid),
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const currentIds = new Set(snapshot.docs.map((d) => d.id));

      // First load — just save IDs, don't notify
      if (prevWatchlistIds.current === null) {
        prevWatchlistIds.current = currentIds;
        return;
      }

      // Find newly added docs
      const newDocs = snapshot.docs.filter(
        (d) => !prevWatchlistIds.current.has(d.id),
      );

      // Save notification to Firestore for each new movie
      for (const d of newDocs) {
        const movie = d.data();
        if (movie?.title) {
          try {
            await addDoc(collection(db, "notifications"), {
              uid: currentUser.uid,
              text: `"${movie.title}" added to watchlist! 🎬`,
              time: "Just now",
              createdAt: new Date(),
              read: false,
            });
          } catch (err) {
            console.error("Notification save error:", err);
          }
        }
      }

      prevWatchlistIds.current = currentIds;
    });

    return () => unsub();
  }, [currentUser]);

  // Delete single notification
  const deleteNotification = async (e, firestoreId) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, "notifications", firestoreId));
    } catch (err) {
      console.error(err);
    }
  };

  // Clear all notifications
  const clearAll = async (e) => {
    e.stopPropagation();
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, "notifications"),
        where("uid", "==", currentUser.uid),
      );
      const snapshot = await getDocs(q);
      const deletes = snapshot.docs.map((d) =>
        deleteDoc(doc(db, "notifications", d.id)),
      );
      await Promise.all(deletes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResultClick = (item) => {
    const isTV = searchType === "tv";
    navigate(isTV ? `/tv/${item.id}` : `/movie/${item.id}`);
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className={`navbar ${navScrolled ? "navbar-scrolled" : ""}`}>
      {/* LEFT */}
      <div className="navbar-left">
        <div className="logo-text" onClick={() => navigate("/")}>
          CINE<span>HUB</span>
        </div>

        <div
          className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        <ul className="nav-links">
          <li
            className={activeNav === "Home" ? "active" : ""}
            onClick={() => navigate("/")}
          >
            Home
          </li>
          <li
            className={activeNav === "TV Shows" ? "active" : ""}
            onClick={() => navigate("/tvshows")}
          >
            TV Shows
          </li>
          <li
            className={activeNav === "Movies" ? "active" : ""}
            onClick={() => navigate("/movies")}
          >
            Movies
          </li>
          <li
            className={activeNav === "New & Popular" ? "active" : ""}
            onClick={() => navigate("/new-popular")}
          >
            New & Popular
          </li>
          <li
            className={activeNav === "My List" ? "active" : ""}
            onClick={() => navigate("/watchlist")}
          >
            My List
          </li>
        </ul>
      </div>

      {/* RIGHT */}
      <div className="navbar-right">
        {/* Search */}
        <div className="search-container" ref={searchRef}>
          <div className={`search-box ${showSearch ? "expanded" : ""}`}>
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
                placeholder={
                  searchType === "tv"
                    ? "Search TV shows..."
                    : "Search movies..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            )}
          </div>
          {showSearch && (searchResults.length > 0 || searching) && (
            <div className="search-dropdown">
              {searching ? (
                <div className="search-loading">Searching...</div>
              ) : (
                searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="search-result-item"
                    onClick={() => handleResultClick(item)}
                  >
                    {item.backdrop_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${item.backdrop_path}`}
                        alt={item.title || item.name}
                      />
                    ) : (
                      <div className="no-img">🎬</div>
                    )}
                    <div className="search-result-info">
                      <p className="result-title">{item.title || item.name}</p>
                      <p className="result-year">
                        {(item.release_date || item.first_air_date)?.slice(
                          0,
                          4,
                        )}
                        &nbsp;·&nbsp; ⭐{" "}
                        {item.vote_average > 0
                          ? item.vote_average.toFixed(1)
                          : "New"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Bell */}
<div className="bell-container" ref={bellRef} onClick={() => setShowBell(!showBell)}>
          <img src={bell_icon} alt="bell" className="icons" />
          {notifications.length > 0 && (
            <span className="bell-badge">{notifications.length}</span>
          )}
          {showBell && (
            <div className="bell-dropdown">
              <div className="bell-header">
                <p className="bell-title">Notifications</p>
                {notifications.length > 0 && (
                  <span className="bell-clear" onClick={clearAll}>
                    Clear all
                  </span>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="bell-empty">
                  <p>🔔 No notifications yet</p>
                  <p>Add a movie to watchlist!</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.firestoreId} className="bell-item">
                    <span className="bell-dot" />
                    <div className="bell-item-content">
                      <p className="bell-text">{n.text}</p>
                      <p className="bell-time">{n.time}</p>
                    </div>
                    <button
                      className="bell-delete"
                      onClick={(e) => deleteNotification(e, n.firestoreId)}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <div
          className="navbar-profile"
          ref={profileRef}
          onClick={() => setShowProfileMenu((v) => !v)}
        >
          <img
            src={localStorage.getItem("cinehub_avatar") || profile_img}
            alt="profile"
            className="profile-img"
          />
          <img
            src={caret_icon}
            alt="caret"
            className={`caret-icon ${showProfileMenu ? "caret-open" : ""}`}
          />
          {showProfileMenu && (
            <div className="dropdown">
              <div className="dropdown-header">
                <img
                  src={localStorage.getItem("cinehub_avatar") || profile_img}
                  alt="profile"
                />
                <div>
                  <p className="dropdown-name">
                    {localStorage.getItem("cinehub_display_name") ||
                      auth.currentUser?.displayName ||
                      "My Profile"}
                  </p>
                  <p className="dropdown-email">
                    {auth.currentUser?.email || "CineHub User"}
                  </p>
                </div>
              </div>
              <hr className="dropdown-divider" />
              <p
                className="dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/watchlist");
                }}
              >
                ❤️ My Watchlist
              </p>
              <p
                className="dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/settings");
                }}
              >
                ⚙️ Settings
              </p>
              <p
                className="dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/plans");
                }}
              >
                💳 Plans & Billing
              </p>
              <p
                className="dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false);
                  navigate("/advertise");
                }}
              >
                📢 Advertise with Us
              </p>
              <hr className="dropdown-divider" />
              <p
                className="dropdown-item signout"
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                  navigate("/login");
                }}
              >
                🚪 Sign Out
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <>
          <div className="menu-overlay" onClick={() => setMenuOpen(false)} />
          <ul className="mobile-menu open">
            <li
              onClick={() => {
                navigate("/");
                setMenuOpen(false);
              }}
            >
              🏠 Home
            </li>
            <li
              onClick={() => {
                navigate("/tvshows");
                setMenuOpen(false);
              }}
            >
              📺 TV Shows
            </li>
            <li
              onClick={() => {
                navigate("/movies");
                setMenuOpen(false);
              }}
            >
              🎬 Movies
            </li>
            <li
              onClick={() => {
                navigate("/new-popular");
                setMenuOpen(false);
              }}
            >
              🔥 New & Popular
            </li>
            <li
              onClick={() => {
                navigate("/watchlist");
                setMenuOpen(false);
              }}
            >
              ❤️ My List
            </li>
            <li
              onClick={() => {
                navigate("/plans");
                setMenuOpen(false);
              }}
            >
              💳 Plans & Billing
            </li>
            <li
              onClick={() => {
                navigate("/advertise");
                setMenuOpen(false);
              }}
            >
              📢 Advertise with Us
            </li>
            <li
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              🚪 Sign Out
            </li>
          </ul>
        </>
      )}
    </div>
  );
};

export default Navbar;
