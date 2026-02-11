import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;
// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [shows, setShows] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]);

  const { user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const fetchIsAdmin = async () => {
    try {
      const { data } = await axios.get('/api/admin/is-admin', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      setIsAdmin(data.isAdmin);
      if (!data.isAdmin && location.pathname.startsWith('/admin')) {
        navigate('/');
        toast.error('You are not authorized to access admin page');
      }
    } catch (err) {
      console.log(err);
      setIsAdmin(false); 
    }
  };
  const fetchShows = async () => {
    try {
      const { data } = await axios.get('/api/shows/all');
      if (data.success) {
        setShows(data.shows);
      }
      else {
        toast.error(data.message);
      }
    } catch (err) {
      console.log(err);
    }
  };
  const fetchFavoriteMovies = async () => {
    try{
        const {data}=await axios.get('/api/users/favorites',{
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if(data.success){
          setFavoriteMovies(data.favoriteMovies);
        }
        else{
            toast.error(data.message);
        }
    }
    catch(err){
      console.log(err);
    }
  }
  useEffect(()=>{
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchShows();
  },[])
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchIsAdmin();
      fetchFavoriteMovies();
    }
  }, [user]);

  const value = { axios,fetchIsAdmin,user,getToken,navigate,isAdmin,shows,favoriteMovies,fetchFavoriteMovies};
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => useContext(AppContext);
