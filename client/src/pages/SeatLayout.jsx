import  { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { assets } from '../assets/assets';
import Loading from '../components/Loading';
import { ArrowRightIcon, ClockIcon } from 'lucide-react';

import BlurCircle from '../components/BlurCircle';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';

const SeatLayout = () => {
  const groupRows = [
    ['A', 'B'],
    ['C', 'D'],
    ['E', 'F'],
    ['G', 'H'],
    ['I', 'J'],
  ];
  const { id, date } = useParams();
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const { axios, user, getToken } = useAppContext();
  const [occupiedSeats, setOccupiedSeats] = useState([]);

  const [show, setShow] = useState(null);

  useEffect(() => {
    const getShow = async () => {
      try {
        const token = await getToken();

        const { data } = await axios.get(`/api/show/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (data.success) {
          setShow({
            movie: data.movie,
            dateTime: data.dateTime,
          });
        }
      } catch (err) {
        console.log('ERROR:', err.response?.data || err.message);
      }
    };

    getShow();
  }, [id]);

  const getOccupiedSeats = async () => {
    try {
      const { data } = await axios.get(
        `/api/booking/seats/${selectedTime.showId}`
      );
      if (data.success) {
        setOccupiedSeats(data.occupiedSeats);
      } else {
        toast.error('Could not fetch occupied seats');
      }
    } catch (err) {
      console.log(err);
    }
  };
  const bookTickets = async () => {
    try {
      if (!user) {
        return toast.error('Please sign in to book tickets');
      }
      if (!selectedTime || selectedSeats.length === 0) {
        return toast.error('Please select show time and seats to proceed');
      }
      const { data } = await axios.post(
        '/api/booking/create',
        { showId: selectedTime.showId, seats: selectedSeats },
        {
          headers: { Authorization: `Bearer ${await getToken()}` },
        }
      );
      if (data.success) {
        {
          window.location.href=data.url;
        }
      } else {
        toast.error(data.message || 'Booking failed');
      }
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    if (selectedTime) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      getOccupiedSeats();
    }
  }, [selectedTime]);

  const handleSeatClick = (seatId) => {
    if (!selectedTime) {
      return toast('Please select a show time first');
    }
    if (!selectedSeats.includes(seatId) && selectedSeats.length > 4) {
      return toast('You can select maximum 5 seats');
    }
    if (occupiedSeats.includes(seatId)) {
      toast('Seat already occupied. Please select another seat.');
      return;
    }
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((seat) => seat !== seatId);
      } else {
        return [...prev, seatId];
      }
    });
  };
  useEffect(() => {
    console.log('Occupied seats:', occupiedSeats);
  }, [occupiedSeats]);

  const renderSeats = (row, count = 9) => (
    <div className="flex gap-2 mt-2" key={row}>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {Array.from({ length: count }, (_, i) => {
          const seatId = `${row}${i + 1}`;
          return (
            <button
              key={seatId}
              onClick={() => handleSeatClick(seatId)}
              className={`w-8 h-8 rounded border border-primary/60 cursor-pointer 
                ${selectedSeats.includes(seatId) && 'bg-primary text-white'}
                ${occupiedSeats.includes(seatId) && 'opacity-50'}`}
            >
              {seatId}
            </button>
          );
        })}
      </div>
    </div>
  );
  const timings = show
    ? show.dateTime[
        Object.keys(show.dateTime).find((key) => key.trim() === date.trim())
      ]
    : null;
  return show ? (
    <div className="flex flex-col px-6 md:flex-row lg:px-40 md:px-16 py-30 md:pt-50 ">
      {/* Timings Available */}
      <div className="w-60 bg-primary/10 rounded-lg h-max border border-primary/20 py-10 md:sticky md:top-30">
        <p className="text-lg font-semibold px-6">Available Timings</p>
        <div className="mt-5 space-y-1">
          {timings && timings.length > 0 ? (
            timings.map((item) => (
              <div
                key={item.time}
                onClick={() => setSelectedTime(item)}
                className={`flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition ${
                  selectedTime?.time === item.time
                    ? 'bg-primary text-white'
                    : 'hover:bg-primary/20'
                }`}
              >
                <ClockIcon className="w-4 h-4" />
                <p className="text-sm">
                  {new Date(`1970-01-01T${item.time}`).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400 px-6">No timings available</p>
          )}
        </div>
      </div>
      {/* Seat Layout */}
      <div className="relative flex-1 flex flex-col items-center max-md:mt-16">
        <BlurCircle top="-100px" left="-100px" />
        <BlurCircle bottom="0" right="0" />
        <h1 className="text-2xl font-semibold mb-4">Select your seat</h1>
        <img src={assets.screenImage} alt="screen" />
        <p className="text-gray-400 text-sm mb-6">SCREEN SIDE</p>
        <div className="flex flex-col items-center mt-10 text-xs text-gray-300">
          <div className="grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-2 mb-6">
            {groupRows[0].map((row) => renderSeats(row))}
          </div>

          <div className="grid grid-cols-2 gap-11">
            {groupRows.slice(1).map((group, idx) => (
              <div key={idx}>{group.map((row) => renderSeats(row))}</div>
            ))}
          </div>
        </div>
        <button
          className="flex items-center gap-1 mt-20 px-10 py-3 text-sm
             bg-primary hover:bg-primary-dull transition
             rounded-full font-medium cursor-pointer
             active:scale-95"
          onClick={bookTickets}
        >
          Proceed to Checkout
          <ArrowRightIcon strokeWidth={3} className="w-4 h-4" />
        </button>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default SeatLayout;
