import React from 'react'
import {Routes,Route, useLocation} from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import SearLayout from './pages/SeatLayout'
import Favorite from './pages/Favorite'
import MyBookings from './pages/MyBookings'
import Footer from './components/Footer'
import {Toaster} from 'react-hot-toast'
import Layout from './pages/admin/Layout'
import Dashboard from './pages/admin/Dashboard'
import AddShows from './pages/admin/AddShows'
import ListShows from './pages/admin/ListShows'
import ListBookings from './pages/admin/ListBookings'

const App = () => {

  const isAdminRoute = useLocation().pathname.startsWith('/admin')

  return (
    <>
      <Toaster/>
      {!isAdminRoute &&<Navbar/>}
      <Routes>
        <Route exact path='/' element={<Home/>}/>
        <Route exact path='/movies' element={<Movies/>}/>
        <Route exact path='/movies/:id' element={<MovieDetails/>}/>
        <Route exact path='/movies/:id/:date' element={<SearLayout/>}/>
        <Route exact path='/my-bookings' element={<MyBookings/>}/>
        <Route exact path='/favorites' element={<Favorite/>}/>
        <Route path='/admin/*' element={<Layout/>}>
        <Route index element={<Dashboard/>}/>
        <Route  path='add-shows' element={<AddShows/>}/>
        <Route  path='list-shows' element={<ListShows/>}/>
        <Route  path='list-bookings' element={<ListBookings/>}/>
        </Route>
      </Routes>
      {!isAdminRoute && <Footer/>}
    </>
  )
}

export default App