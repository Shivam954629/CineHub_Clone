import React, { useEffect, useState } from "react";
import "./MovieDetail.css";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
import Footer from "../../Components/Footer/Footer";

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isTV = location.pathname.startsWith("/tv");
  const mediaType = isTV ? "tv" : "movie";

  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [trailer, setTrailer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistDocId, setWatchlistDocId] = useState(null);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [similarMovies, setSimilarMovies] = useState([]);

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
        const [movieRes, creditsRes, videosRes] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/${mediaType}/${id}?language=en-US`,
            options,
          ),
          fetch(
            `https://api.themoviedb.org/3/${mediaType}/${id}/credits?language=en-US`,
            options,
          ),
          fetch(
            `https://api.themoviedb.org/3/${mediaType}/${id}/videos?language=en-US`,
            options,
          ),
        ]);

        const movieData = await movieRes.json();
        const creditsData = await creditsRes.json();
        const videosData = await videosRes.json();

        setMovie(movieData);
        setCast(creditsData.cast?.slice(0, 8) || []);

        const trailerVideo =
          videosData.results?.find(
            (v) => v.type === "Trailer" && v.site === "YouTube",
          ) ||
          videosData.results?.find((v) => v.site === "YouTube") ||
          null;
        setTrailer(trailerVideo);

        const similarRes = await fetch(
          `https://api.themoviedb.org/3/${mediaType}/${id}/similar?language=en-US&page=1`,
          options,
        );
        const similarData = await similarRes.json();
        setSimilarMovies(
          similarData.results?.filter((m) => m.poster_path).slice(0, 12) || [],
        );

        // Watchlist check
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
  }, [id, mediaType]);

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
        const title = movie.title || movie.name;
        const docRef = await addDoc(collection(db, "watchlist"), {
          uid: user.uid,
          movieId: parseInt(id),
          title,
          poster_path: movie.poster_path,
          release_date: movie.release_date || movie.first_air_date,
          vote_average: movie.vote_average,
          addedAt: new Date(),
        });
        setInWatchlist(true);
        setWatchlistDocId(docRef.id);
        toast.success("Added to Watchlist! 🎬");
        try {
          const movieTitle = movie.title || movie.name;
          await addDoc(collection(db, "notifications"), {
            uid: user.uid,
            text: `"${movieTitle}" added to watchlist! 🎬`,
            time: "Just now",
            createdAt: new Date(),
            read: false,
          });
        } catch (err) {
          console.error("Notif error:", err);
        }
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

  const title = movie.title || movie.name;
  const releaseDate = movie.release_date || movie.first_air_date;
  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null;
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;
  const hours = Math.floor((movie.runtime || 0) / 60);
  const mins = (movie.runtime || 0) % 60;

  return (
    <div className="movie-detail">
      {/* Backdrop */}
      {backdropUrl && (
        <div
          className="detail-backdrop"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        >
          <div className="backdrop-overlay"></div>
        </div>
      )}

      {/* Back Button */}
      <img
        src={back_arrow_icon}
        alt="back"
        className="detail-back"
        onClick={() => navigate(-1)}
      />

      <div className="detail-content">
        {/* Left — Poster */}
        <div className="detail-left">
          {posterUrl && (
            <div className="poster-wrap">
              <img src={posterUrl} alt={title} className="detail-poster" />

              <div
                className="poster-play-overlay"
                onClick={() =>
                  trailer
                    ? setShowTrailerModal(true)
                    : toast.info("No trailer available")
                }
              >
                <div className="poster-play-btn">▶</div>
              </div>
            </div>
          )}
          {/* TV Badge */}
          {isTV && <div className="media-badge tv-badge">📺 TV Series</div>}
          {!isTV && <div className="media-badge movie-badge">🎬 Movie</div>}
        </div>

        {/* Right — Info */}
        <div className="detail-right">
          <h1 className="detail-title">{title}</h1>
          {movie.tagline && <p className="detail-tagline">"{movie.tagline}"</p>}

          <div className="detail-meta">
            <span className="meta-rating">
              ⭐{" "}
              {movie.vote_average > 0 ? movie.vote_average.toFixed(1) : "N/A"}
              /10
            </span>
            <span className="meta-votes">
              ({movie.vote_count?.toLocaleString()} votes)
            </span>
            <span className="meta-year">{releaseDate?.slice(0, 4)}</span>
            {movie.runtime > 0 && (
              <span className="meta-runtime">
                {hours}h {mins}m
              </span>
            )}
            {/* TV Show seasons */}
            {isTV && movie.number_of_seasons && (
              <span className="meta-runtime">
                {movie.number_of_seasons} Seasons
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

          {/* Buttons */}
          <div className="detail-btns">
            <button
              className="play-btn"
              onClick={() =>
                trailer
                  ? setShowTrailerModal(true)
                  : toast.info("No trailer available 😔")
              }
            >
              ▶ Play Trailer
            </button>
            <button
              className={`watchlist-btn ${inWatchlist ? "in-watchlist" : ""}`}
              onClick={toggleWatchlist}
            >
              {inWatchlist ? "✓ In Watchlist" : "+ Watchlist"}
            </button>
            <button className="back-btn" onClick={() => navigate(-1)}>
              ← Go Back
            </button>
          </div>

          {/* Cast */}
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

      {/* Similar Movies */}
      {similarMovies.length > 0 && (
        <div className="similar-movies">
          <h2>You May Also Like</h2>
          <div className="similar-grid">
            {similarMovies.map((m) => (
              <div
                key={m.id}
                className="similar-card"
                onClick={() => navigate(`/${isTV ? "tv" : "movie"}/${m.id}`)}
              >
                <div className="similar-img-wrap">
                  <img
                    src={`https://image.tmdb.org/t/p/w500${m.poster_path}`}
                    alt={m.title || m.name}
                  />
                  <div className="similar-overlay">▶ Play</div>
                  <span className="similar-rating">
                    ⭐ {m.vote_average > 0 ? m.vote_average.toFixed(1) : "New"}
                  </span>
                </div>
                <p className="similar-title">{m.title || m.name}</p>
                <p className="similar-year">
                  {(m.release_date || m.first_air_date)?.slice(0, 4)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ Trailer Modal */}
      {showTrailerModal && trailer && (
        <div
          className="trailer-modal"
          onClick={() => setShowTrailerModal(false)}
        >
          <div
            className="trailer-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="trailer-close"
              onClick={() => setShowTrailerModal(false)}
            >
              ✕
            </button>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              title="trailer"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; encrypted-media"
            />
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default MovieDetail;
