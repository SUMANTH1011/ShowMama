import axios from 'axios';
import Movie from '../models/Movie.js';
import Show from '../models/Show.js';
import { inngest } from '../inngest/index.js';

const tmdbHeaders = {
  accept: 'application/json',
  Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`,
};

export const getNowPlayingMovies = async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.themoviedb.org/3/movie/now_playing',
      { headers: tmdbHeaders }
    );

    const movies = response.data.results;
    res.json({ success: true, movies });
  } catch (error) {
    console.error('Error fetching now playing movies:', error.message);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch now playing movies' });
  }
};

// API to add a new show
export const addShow = async (req, res) => {
  try {
    const { movieId, showsInput, showPrice } = req.body;

    if (!movieId || !showsInput || !showPrice) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' });
    }

    let movie = await Movie.findOne({ tmdbId: movieId });

    if (!movie) {
      const movieDetailsResponse = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}`,
        { headers: tmdbHeaders }
      );

      const movieCreditsResponse = await axios.get(
        `https://api.themoviedb.org/3/movie/${movieId}/credits`,
        { headers: tmdbHeaders }
      );

      const movieApiData = movieDetailsResponse.data;
      const movieCreditsData = movieCreditsResponse.data;

      const movieDetails = {
        _id: movieId,
        title: movieApiData.title,
        overview: movieApiData.overview,
        poster_path: movieApiData.poster_path,
        backdrop_path: movieApiData.backdrop_path,
        genres: movieApiData.genres.map((g) => g.name),
        cast: movieCreditsData.cast.slice(0, 5).map((c) => c.name),
        vote_average: movieApiData.vote_average,
        release_date: movieApiData.release_date,
        original_language: movieApiData.original_language,
        tagline: movieApiData.tagline || '',
        runtime: movieApiData.runtime,
      };

      movie = await Movie.create(movieDetails);
    }

    const showsToCreate = [];

    showsInput.forEach((show) => {
      const showDate = show.date;
      show.time.forEach((time) => {
        const dateTimeString = `${showDate}T${time}:00`;
        showsToCreate.push({
          movie: movie._id,
          showDateTime: new Date(dateTimeString),
          showPrice: showPrice,
          occupiedSeats: [],
        });
      });
    });

    if (showsToCreate.length > 0) {
      await Show.insertMany(showsToCreate);
    }
    await inngest.send({
      name: 'app/show.added',
      data: {
        movieTitle: movie.title,
        showTime: showsToCreate.map((s) => s.showDateTime),
      },
    });
    res.json({ success: true, message: 'Show added successfully' });
  } catch (error) {
    console.error('Error adding new show:', error.message);
    res.status(500).json({ success: false, message: 'Failed to add new show' });
  }
};

// API to get shows from the database
export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({
      showDateTime: { $gte: new Date() },
    })
      .populate('movie')
      .sort({ showDateTime: 1 });

    res.json({ success: true, shows }); // ✅ send full shows
  } catch (err) {
    console.error('Get Shows Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// API to get a single show from the database
export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;
    const shows = await Show.find({
      movie: movieId,
      showDateTime: { $gte: new Date() },
    }).populate('movie');
    if (!shows) {
      return res
        .status(404)
        .json({ success: false, message: 'Show not found' });
    }
    const movie = await Movie.findById(movieId);
    const dateTime = {};
    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split('T')[0];
      if (!dateTime[date]) {
        dateTime[date] = [];
      }
      dateTime[date].push({
        time: show.showDateTime.toISOString().split('T')[1].substring(0, 5),
        showId: show._id,
      });
    });
    res.status(200).json({ success: true, movie, dateTime });
  } catch (err) {
    console.error('Get Show Error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
