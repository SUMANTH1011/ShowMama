import React, { useEffect } from 'react';
import Title from '../../components/admin/Title';
import Loading from '../../components/Loading';
import { CheckIcon, DeleteIcon, StarIcon } from 'lucide-react';
import kConverter from '../../lib/kConverter';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const AddShows = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;
  const [nowPlaying, setNowPlaying] = React.useState([]);
  const [selectedMovie, setSelectedMovie] = React.useState(null);
  const [dateTimeSelection, setDateTimeSelection] = React.useState({});
  const [dateTimeInput, setDateTimeInput] = React.useState('');
  const [showPrice, setShowPrice] = React.useState('');
  const [addingShow, setAddingShow] = React.useState(false);

  const fetchNowPlayingMovies = async () => {
    try {
      const { data } = await axios.get('/api/show/now-playing', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setNowPlaying(data.movies);
      }
    } catch (err) {
      console.error('Error fetching movies:', err);
    }
  };
  const handleDateTimeAdd = () => {
    if (!dateTimeInput) return;
    const [date, time] = dateTimeInput.split('T');
    if (!date || !time) return;
    setDateTimeSelection((prev) => {
      const times = prev[date] || [];
      if (!times.includes(time)) {
        return { ...prev, [date]: [...times, time] };
      }
      return prev;
    });
  };
  const handleRemoveDateTime = (date, time) => {
    setDateTimeSelection((prev) => {
      const filteredTimes = prev[date].filter((t) => t !== time);
      if (filteredTimes.length === 0) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [date]: filteredTimes };
    });
  };

  const handleSubmit = async () => {
    try {
      setAddingShow(true);
      if (
        !selectedMovie ||
        Object.keys(dateTimeSelection).length === 0 ||
        !showPrice
      ) {
        setAddingShow(false);
        return toast.error('Missing required fields');
      }
      const showsInput = Object.entries(dateTimeSelection).map(
        ([date, time]) => ({
          date,
          time,
        })
      );
      const payload = {
        movieId: selectedMovie,
        showsInput: showsInput,
        showPrice: showPrice,
      };
      const response = await axios.post('/api/show/add', payload, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (response.data.success) {
        toast.success('Show added successfully');
        setSelectedMovie(null);
        setDateTimeSelection({});
        setShowPrice('');
      } else {
        console.log(response.data.message);
      }
    } catch (err) {
      console.log(err);
      toast.error('Failed to add show');
    } finally {
      setAddingShow(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNowPlayingMovies();
    }
  }, [user]);
  return nowPlaying.length > 0 ? (
    <>
      <Title text1="Add" text2="Shows" />
      <p className="mt-10 text-lg font-medium">Now Playing Movies</p>
      <div className="overflow-x-auto pb-4">
        <div className="group flex flex-wrap gap-4 mt-4 w-max">
          {nowPlaying.map((movie) => (
            <div
              key={movie.id}
              className={`relative group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300 max-w-40 cursor-pointer`}
              onClick={() => setSelectedMovie(movie.id)}
            >
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={image_base_url + movie.poster_path}
                  alt=""
                  className="w-full object-cover brightness-90"
                />
                <div className="text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0">
                  <p className="flex items-center gap-1 text-gray-400">
                    <StarIcon className="w-4 h-4 text-primary fill-primary" />
                    {movie.vote_average.toFixed(1)}
                  </p>
                  <p className="text-gray-300">
                    {kConverter(movie.vote_count)} Votes
                  </p>
                </div>
              </div>
              {selectedMovie === movie.id && (
                <div className="absolute top-2 right-2 bg-primary rounded-full w-6 h-6 flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
              )}
              <p className="font-medium truncate">{movie.title}</p>
              <p className="text-gray-400 text-sm">{movie.release_date}</p>
            </div>
          ))}
        </div>
      </div>
      {/* show input price */}
      <div className="mt-8">
        <label className="block font-medium mb-2 text-sm">Show Price</label>
        <div className="inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md">
          <p className="text-gray-400 text-sm">{currency}</p>
          <input
            type="number"
            min={0}
            className="outline-none"
            onChange={(e) => setShowPrice(e.target.value)}
            placeholder="Enter Show Price"
          />
        </div>
      </div>
      {/* Date && Time Input */}
      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">
          Select Date and Time
        </label>
        <div className="inline-flex gap-5 border border-gray-600 p-1 pl-3 rounded-lg">
          <input
            type="datetime-local"
            value={dateTimeInput}
            onChange={(e) => setDateTimeInput(e.target.value)}
            className="outline-none rounded-md"
          />
          <button
            onClick={handleDateTimeAdd}
            className="bg-primary/80 text-white px-3 py-2 text-sm rounded-lg hover:bg-primary cursor-pointer"
          >
            Add Time
          </button>
        </div>
      </div>
      {/* Selected Date and Time Display */}
      {Object.keys(dateTimeSelection).length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2">Selected Date-Time</h2>
          <ul className="space-y-3">
            {Object.entries(dateTimeSelection).map(([date, times]) => (
              <li key={date}>
                <div className="font-medium">{date}</div>
                <div className="flex flex-wrap gap-2 mt-1 text-sm">
                  {times.map((time, index) => (
                    <div
                      key={index}
                      className="border border-primary px-2 py-1 flex items-center rounded"
                    >
                      <span>{time}</span>
                      <DeleteIcon
                        onClick={() => handleRemoveDateTime(date, time)}
                        width={15}
                        className="ml-2 text-red-500 hover:text-red-700 cursor-poniter"
                      />
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={handleSubmit}
        disabled={addingShow}
        className="bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer"
      >
        Add Show
      </button>
    </>
  ) : (
    <Loading />
  );
};

export default AddShows;
