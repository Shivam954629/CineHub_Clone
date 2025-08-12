import React, { useEffect, useRef, useState } from "react";
import './TitleCards.css'
import cards_data from '../../assets/cards/Cards_data'
import {Link} from 'react-router-dom'



const TitleCards = ({title, category}) => {

  const [apiData, setApiData] = useState([]);

  const cardsRef =  useRef();

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMjc2YmY5OTE4NjUzNTljYzY2ZjMxNTcxZGZhMTFiMCIsIm5iZiI6MTc1NDc1ODI1OC41OCwic3ViIjoiNjg5NzdjNzI3ZmViYTFjNjU5NmQ2NDk3Iiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9.9dA_j_SoopkfQB0qOBeFEhPn9YZysmRouKACoRRbG-Q'
  }
};



const handleWheel = (event)=>{
  event.preventDefault();
  cardsRef.current.scrollLeft += event.deltaY;
}

useEffect(()=>{

fetch(`https://api.themoviedb.org/3/movie/${category?category:"now_playing"}?language=en-US&page=1`, options)
  .then(res => res.json())
  .then(res => setApiData(res.results))
  .catch(err => console.error(err));


  cardsRef.current.addEventListener('wheel',handleWheel)
},[])




  return (

    <div className='title-cards'>
      <h2>{title?title:"Popular on CineHub"}</h2>
      <div className="card-list" ref={cardsRef}>
        {apiData.map((card,index)=>{
          return <Link to={`/player/${card.id}`}  className="card" key ={index}>
            <img src={`https://image.tmdb.org/t/p/w500` +card.backdrop_path} alt="" />
            <p>{card.original_title}</p>
          </Link>
        }
      )}

      </div>
    </div>

  )
}

export default TitleCards
