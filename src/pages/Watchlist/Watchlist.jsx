import React, { useEffect, useState } from "react";
import "./Watchlist.css";
import { db, auth } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Navbar from "../../Components/Navbar/Navbar";

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // ✅ Fix — onAuthStateChanged se user wait karo
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "watchlist"),
        where("uid", "==", user.uid),
      );

      const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const movies = snapshot.docs.map((doc) => ({
          docId: doc.id,
          ...doc.data(),
        }));
        setWatchlist(movies);
        setLoading(false);
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  const removeFromWatchlist = async (docId) => {
    try {
      await deleteDoc(doc(db, "watchlist", docId));
    } catch (error) {
      console.error("Error removing:", error);
    }
  };

  return (
    <div className="watchlist-page">
      <Navbar />
      <div className="watchlist-content">
        <h1>My Watchlist</h1>

        {loading ? (
          <div className="watchlist-loading">
            <div className="spinner"></div>
          </div>
        ) : watchlist.length === 0 ? (
          <div className="watchlist-empty">
            <p>🎬</p>
            <h2>Your watchlist is empty</h2>
            <p>Add movies from the detail page!</p>
            <button onClick={() => navigate("/")}>Browse Movies</button>
          </div>
        ) : (
          <div className="watchlist-grid">
            {watchlist.map((movie) => (
              <div key={movie.docId} className="watchlist-card">
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={movie.title}
                  onClick={() => navigate(`/movie/${movie.movieId}`)}
                />
                <div className="watchlist-card-info">
                  <p className="watchlist-title">{movie.title}</p>
                  <p className="watchlist-year">
                    {movie.release_date?.slice(0, 4)}
                  </p>
                  <p className="watchlist-rating">
                    ⭐ {movie.vote_average?.toFixed(1)}
                  </p>
                </div>
                <button
                  className="remove-btn"
                  onClick={() => removeFromWatchlist(movie.docId)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;
