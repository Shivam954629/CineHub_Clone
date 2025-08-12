import React, { useEffect, useRef } from 'react';
import './Navbar.css';
import search_icon from '../../assets/search_icon.svg';
import bell_icon from '../../assets/bell_icon.svg';
import profile_img from '../../assets/profile_img.png';
import caret_icon from '../../assets/caret_icon.svg';
import { logout } from '../../firebase';

const Navbar = () => {

  const navRef= useRef();

  useEffect(()=>{
    window.addEventListener('scroll', ()=>{
      if(window.scrollY >= 80){
        navRef.current.classList.add('nav-dark')
      }else
        navRef.current.classList.remove('nav-dark')
    })
  },[])

  return (
    <div ref={(navRef)} className='navbar'>
      <div className="navbar-left">
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '40px',
          fontWeight: '400',
          color: 'red',
          margin: 0,
          letterSpacing: '1px',
          lineHeight: '1'
        }}>
          <span style={{ fontWeight: '900' }}>CINE</span>HUB
        </h1>

        {/* Navigation links */}
        <ul className="nav-links">
          <li>Home</li>
          <li>TV Shows</li>
          <li>Movies</li>
          <li>New & Popular</li>
          <li>My List</li>
          <li>Browse by Languages</li>
        </ul>
      </div>

      <div className="navbar-right">
        <img src={search_icon} alt="" className='icons' />
        <p>Children</p>
        <img src={bell_icon} alt="" className='icons' />

        {/* Profile with hover dropdown */}
        <div className="navbar-profile">
          <img src={profile_img} alt="" className='profile' />
          <img src={caret_icon} alt="" />

          <div className="dropdown">
            <p onClick={()=>{logout()}}>Sign Out of CineHub</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;
