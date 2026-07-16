import React, { useEffect, useMemo, useRef, useState } from "react";
import "./TitleCards.css";
import { Link } from "react-router-dom";

const TitleCards = ({ title, category }) => {
  const [apiData, setApiData] = useState([]);
  const [loading, setLoading] = useState(true);
  const cardsRef = useRef();

  const options = useMemo(
    () => ({
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_TMDB_TOKEN}`,
      },
    }),
    [],
  );

  const handleWheel = (event) => {
    event.preventDefault();
    cardsRef.current.scrollLeft += event.deltaY;
  };

  useEffect(() => {
    const url =
      category === "hindi"
        ? `https://api.themoviedb.org/3/discover/movie?with_original_language=hi&sort_by=popularity.desc&page=1`
        : `https://api.themoviedb.org/3/movie/${category ? category : "now_playing"}?language=en-US&page=1`;

    setLoading(true);
    fetch(url, options)
      .then((res) => res.json())
      .then((res) => {
        setApiData(res.results);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    const cardElement = cardsRef.current;
    cardElement.addEventListener("wheel", handleWheel);

    // ✅ Memory leak fix — cleanup
    return () => {
      cardElement.removeEventListener("wheel", handleWheel);
    };
  }, [category, options]);

  return (
    <div className="title-cards">
      <h2>{title ? title : "Popular on CineHub"}</h2>
      <div className="card-list" ref={cardsRef}>
        {loading ? (
          <div className="cards-loading">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card-skeleton"></div>
            ))}
          </div>
        ) : (
          apiData
            .filter((card) => card.backdrop_path) 
            .map((card) => (
              <Link to={`/movie/${card.id}`} className="card" key={card.id}>
                <img
                  src={`https://image.tmdb.org/t/p/w500` + card.backdrop_path}
                  alt={card.original_title}
                />
                <p>{card.original_title}</p>
              </Link>
            ))
        )}
      </div>
    </div>
  );
};

export default TitleCards;
