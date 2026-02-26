import React from "react";
import "./NotFound.css";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="notfound-page">
      <div className="notfound-content">
        <h1 className="notfound-code">404</h1>
        <div className="notfound-divider" />
        <h2 className="notfound-title">Lost in the Dark</h2>
        <p className="notfound-text">
          Looks like this page went missing. Maybe it's hiding behind the
          popcorn. 🍿
        </p>
        <div className="notfound-btns">
          <button className="notfound-home-btn" onClick={() => navigate("/")}>
            🏠 Go Home
          </button>
          <button className="notfound-back-btn" onClick={() => navigate(-1)}>
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
