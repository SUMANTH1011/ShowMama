import React from 'react';
import Loading from '../../components/Loading';
import Title from '../../components/admin/Title';
import dateFormat from '../../lib/dateFormat';
import { useAppContext } from '../../context/AppContext';
const ListShows = () => {
  const currency = import.meta.env.VITE_CURRENCY;

  const { axios, getToken, user } = useAppContext();

  const [shows, setShows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const getAllShows = async () => {
    try {
      const { data } = await axios.get('/api/show/all', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      setShows(data.shows);
      setLoading(false);
    } catch (err) {
      console.log(err);
    }
  };
  React.useEffect(() => {
    if (user) {
      getAllShows();
    }
  }, [user]);

  return !loading ? (
    <>
      <Title text1="List" text2="Shows" />
      <div className="max-w-4xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">Movie Name</th>
              <th className="p-2 font-medium pl-5">Show Time</th>
              <th className="p-2 font-medium pl-5">Total Bookings</th>
              <th className="p-2 font-medium pl-5">Earnings</th>
            </tr>
          </thead>
          <tbody className="text-sm font-light">
            {shows.map((show, index) => (
              <tr
                key={index}
                className="border-b border-primary/10 bg-primary/5 even:bg-primary/10"
              >
                <td className="p-2 pl-5 min-w-45">
                  {' '}
                  {show.movie?.title || 'Movie not found'}
                </td>
                <td className="p-2">{dateFormat(show.showDateTime)}</td>
                <td className="p-2 pl-5">
                  {' '}
                  {show.occupiedSeats
                    ? Object.keys(show.occupiedSeats).length
                    : 0}
                </td>
                <td className="p-2">
                  {currency}
                  {(show.occupiedSeats
                    ? Object.keys(show.occupiedSeats).length
                    : 0) * show.showPrice}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  ) : (
    <Loading />
  );
};

export default ListShows;
