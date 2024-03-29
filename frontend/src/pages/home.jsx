import React from 'react'
import logo from '../logo/bookbg-removebg-preview.png';
import { Link } from 'react-router-dom'
import { authenticatedUsername } from './signin';
import { signal } from '@preact/signals-react';
export const favbookdata = signal([]);
const Home = () => {

    return (

        <div className="Home-Page bg-dark text-white container-fluid d-flex justify-content-center allign-items-center">
            <div className="row container ">
                <div className="heading col-lg-6 d-flex justify-content-center allign-items-start flex-column" style={{ height: "91vh" }}>
                    <h2 >BOOK STORE</h2>
                    <h1>Welcome {authenticatedUsername.value ? authenticatedUsername.value : "Guest"}</h1>
                    <Link className="text-white bg-dark " type="button" style={{ alignSelf: "flex-start", background: "black", border: "1px solid", fontWeight: "bold", padding: "1px", textDecoration: "none" }} to="/books">View Books</Link>
                </div>
                <div className="col-lg-6 d-flex justify-content-center allign-items-center flex-column imgblock" style={{ height: "95vh" }}>
                    <img className="bookimg" src={logo} alt="bookstore" />
                </div>
            </div>
        </div >
    )
}

export default Home
