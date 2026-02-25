import React, { useEffect, useState } from "react";
import "./MovieDetail.css";
import { useNavigate, useParams } from "react-router-dom";
import back_arrow_icon from "../../assets/back_arrow_icon.png";
import { db, auth } from "../../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { toast } from "react-toastify";

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistDocId, setWatchlistDocId] = useState(null);

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_TMDB_TOKEN}`,
    },
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [movieRes, creditsRes] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/movie/${id}?language=en-US`,
            options,
          ),
          fetch(
            `https://api.themoviedb.org/3/movie/${id}/credits?language=en-US`,
            options,
          ),
        ]);

        const movieData = await movieRes.json();
        const creditsData = await creditsRes.json();

        setMovie(movieData);
        setCast(creditsData.cast?.slice(0, 8) || []);

        const user = auth.currentUser;
        if (user) {
          const q = query(
            collection(db, "watchlist"),
            where("uid", "==", user.uid),
            where("movieId", "==", parseInt(id)),
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            setInWatchlist(true);
            setWatchlistDocId(snapshot.docs[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const toggleWatchlist = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("Please login first!");
      return;
    }
    try {
      if (inWatchlist) {
        await deleteDoc(doc(db, "watchlist", watchlistDocId));
        setInWatchlist(false);
        setWatchlistDocId(null);
        toast.info("Removed from Watchlist");
      } else {
        const docRef = await addDoc(collection(db, "watchlist"), {
          uid: user.uid,
          movieId: parseInt(id),
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
          addedAt: new Date(),
        });
        setInWatchlist(true);
        setWatchlistDocId(docRef.id);
        toast.success("Added to Watchlist! 🎬");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    }
  };

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!movie) return null;

  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null;

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  const hours = Math.floor(movie.runtime / 60);
  const mins = movie.runtime % 60;

  return (
    <div className="movie-detail">
      {backdropUrl && (
        <div
          className="detail-backdrop"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        >
          <div className="backdrop-overlay"></div>
        </div>
      )}

      <img
        src={back_arrow_icon}
        alt="back"
        className="detail-back"
        onClick={() => navigate(-1)}
      />

      <div className="detail-content">
        <div className="detail-left">
          {posterUrl && (
            <img src={posterUrl} alt={movie.title} className="detail-poster" />
          )}
        </div>

        <div className="detail-right">
          <h1 className="detail-title">{movie.title}</h1>
          {movie.tagline && <p className="detail-tagline">"{movie.tagline}"</p>}

          <div className="detail-meta">
            <span className="meta-rating">
              ⭐ {movie.vote_average?.toFixed(1)}/10
            </span>
            <span className="meta-votes">
              ({movie.vote_count?.toLocaleString()} votes)
            </span>
            <span className="meta-year">{movie.release_date?.slice(0, 4)}</span>
            {movie.runtime > 0 && (
              <span className="meta-runtime">
                {hours}h {mins}m
              </span>
            )}
          </div>

          <div className="detail-genres">
            {movie.genres?.map((g) => (
              <span key={g.id} className="genre-tag">
                {g.name}
              </span>
            ))}
          </div>

          <p className="detail-overview">{movie.overview}</p>

          <div className="detail-btns">
            <button
              className="play-btn"
              onClick={() => navigate(`/player/${id}`)}
            >
              ▶ Play Trailer
            </button>
            <button
              className={`watchlist-btn ${inWatchlist ? "in-watchlist" : ""}`}
              onClick={toggleWatchlist}
            >
              {inWatchlist ? "✓ In Watchlist" : "+ Watchlist"}
            </button>
            <button className="back-btn" onClick={() => navigate("/")}>
              ← Back to Home
            </button>
          </div>

          {cast.length > 0 && (
            <div className="detail-cast">
              <h3>Top Cast</h3>
              <div className="cast-list">
                {cast.map((actor) => (
                  <div key={actor.id} className="cast-card">
                    {actor.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                        alt={actor.name}
                      />
                    ) : (
                      <div className="cast-no-img">🎭</div>
                    )}
                    <p className="cast-name">{actor.name}</p>
                    <p className="cast-char">{actor.character}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
