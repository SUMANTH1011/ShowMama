import React from 'react'
import {assets} from '../assets/assets'
import { ArrowRight, CalendarIcon ,ClockIcon} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const HeroSection = () => {
    const navigate=useNavigate()
  return (
    <div className='flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 bg-[url("/prabhas-the-raja.jpg")] bg-cover bg-center h-screen'>
        <img
  src={assets.peoplemedia}
  alt="People Media Factory"
  className="h-10 md:h-12 w-auto mb-3"
/>

        <h1 className='text-5xl md:text-[70px] md:leading-18 font-semibold max-w-110'>The Raja <br /> Saab</h1>
        <div className='flex items-center gap-4 text-gray-300'>
            <span>Horror | Comedy</span>
            <div className='flex items-center gap-1'>
            <CalendarIcon className='w-4.5 h-4.5'/>2026
            </div>
             <div className='flex items-center gap-1'>
            <ClockIcon className='w-4.5 h-4.5'/>3h 10m
            </div>
        </div>
        <p className='max-w-md text-gary-300'>
            Rebellion and royalty didn`t just come, they`re in his blood. The Powerful and Majestic reign of the Raja Saab will set new rules across the board.
        </p>
        <button className='flex items-center gap-1 px-6 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'
        onClick={()=>navigate('/movies')}>
            Explore Movies
            <ArrowRight className='w-5 h-5'/>
        </button>
    </div>
  )
}

export default HeroSection