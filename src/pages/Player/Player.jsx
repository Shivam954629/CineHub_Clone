import React, { useEffect, useState } from 'react'
import './Player.css'
import back_arrow_icon from '../../assets/back_arrow_icon.png'
import { useNavigate, useParams } from 'react-router-dom'

const Player = () => {

  const {id} = useParams();

  const navigate= useNavigate();

  const [apiData, setApiData] = useState({
    name: "",
    key:"",
    published_at: "",
    type: ""
  })

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzMjc2YmY5OTE4NjUzNTljYzY2ZjMxNTcxZGZhMTFiMCIsIm5iZiI6MTc1NDc1ODI1OC41OCwic3ViIjoiNjg5NzdjNzI3ZmViYTFjNjU5NmQ2NDk3Iiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9.9dA_j_SoopkfQB0qOBeFEhPn9YZysmRouKACoRRbG-Q'
  }
};

useEffect(()=>{
  fetch(`https://api.themoviedb.org/3/movie/${id}/videos?language=en-US`, options)
  .then(res => res.json())
  .then(res => setApiData(res.results[0]))
  .catch(err => console.error(err));


},[])


  return (
    <div className='player'>
      <img src={back_arrow_icon} alt="" onClick={()=>{navigate(-2)}}/>
      <iframe width='90%' height='90%'
      src={`https://www.youtube.com/embed/${apiData.key}`} 
      title='trailer' frameBorder='0' allowFullScreen></iframe>
      <div className="player-info">
        <p>{apiData.published_at.slice(0,10)}</p>
        <p>{apiData.name}</p>
        <p>{apiData.type}</p>

      </div>
      
    </div>
  )
}

export default Player

