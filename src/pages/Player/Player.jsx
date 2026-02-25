import React, { useEffect, useState } from "react";
import "./Player.css";
import back_arrow_icon from "../../assets/back_arrow_icon.png";
import { useNavigate, useParams } from "react-router-dom";

const Player = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    fetch(`https://api.themoviedb.org/3/movie/${id}/videos?language=en-US`, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_TMDB_TOKEN}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        // Trailer dhundo pehle, phir koi bhi video
        const trailer =
          res.results?.find(
            (v) => v.type === "Trailer" && v.site === "YouTube",
          ) ||
          res.results?.find((v) => v.site === "YouTube") ||
          null;

        if (trailer) {
          setApiData(trailer);
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="player">
        <img
          src={back_arrow_icon}
          alt=""
          onClick={() => navigate(-1)}
          className="back-arrow"
        />
        <div className="player-loading">
          <div className="spinner"></div>
          <p>Loading trailer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="player">
        <img
          src={back_arrow_icon}
          alt=""
          onClick={() => navigate(-1)}
          className="back-arrow"
        />
        <div className="player-error">
          <h2>😔 No Trailer Available</h2>
          <p>Sorry, no trailer found for this movie.</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="player">
      <img
        src={back_arrow_icon}
        alt=""
        onClick={() => navigate(-1)}
        className="back-arrow"
      />
      <iframe
        width="90%"
        height="90%"
        src={`https://www.youtube.com/embed/${apiData.key}?autoplay=1`}
        title="trailer"
        frameBorder="0"
        allowFullScreen
        allow="autoplay; encrypted-media"
      ></iframe>
      <div className="player-info">
        <p>{apiData.published_at?.slice(0, 10)}</p>
        <p>{apiData.name}</p>
        <p>{apiData.type}</p>
      </div>
    </div>
  );
};

export default Player;
