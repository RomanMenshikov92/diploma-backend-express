/**
 * @module moviesRouter
 *
 * Модуль для управления фильмами и их сеансами. Включает маршруты для получения фильмов по дате, получения всех фильмов и добавления нового фильма.
 */
const express = require("express");
const moviesRouter = express.Router();
const pool = require("../db");

/**
 * Получение фильмов и их сеансов на указанную дату.
 * @route GET /moviesdate
 * @group movies - Операции с фильмами
 * @param {string} date.query.required - Дата в формате YYYY-MM-DD
 * @returns {Array} 200 - Массив фильмов с сеансами
 * @returns {Error}  500 - Ошибка сервера
 */
moviesRouter.get("/moviesdate", async (req, res) => {
  const { date } = req.query;

  try {
    // Запрос к базе данных для получения фильмов и их сеансов на указанную дату
    const result = await pool.query(
      `
      SELECT
        movies.id AS movie_id,
        movies.title,
        movies.synopsis,
        movies.duration,
        movies.origin,
        movies.poster,
        sessions.id AS session_id,
        sessions.time,
        halls.name AS hall,
        halls.price_regular,
        halls.price_vip
      FROM
        movies
      JOIN
        sessions ON movies.id = sessions.movie_id
      JOIN
        halls ON sessions.hall_id = halls.id
      WHERE
        sessions.date = $1
        AND sessions.status = 'open'
    `,
      [date]
    );

    const moviesMap = new Map();

    // Группируем данные сеансов по фильмам
    result.rows.forEach((row) => {
      const { movie_id, title, synopsis, duration, origin, poster, session_id, hall, time, price_regular, price_vip } = row;
      if (!moviesMap.has(movie_id)) {
        moviesMap.set(movie_id, {
          id: movie_id,
          title,
          synopsis,
          duration,
          origin,
          poster,
          sessions: [],
        });
      }
      moviesMap.get(movie_id).sessions.push({ session_id, hall, time, price_regular, price_vip });
    });

    const movies = Array.from(moviesMap.values());
    res.json(movies);
  } catch (error) {
    console.error("Ошибка при получении фильмов и сеансов:", error.message);
    res.status(500).send("Server Error");
  }
});

/**
 * Получение всех фильмов.
 * @route GET /movies
 * @group movies - Операции с фильмами
 * @returns {Array} 200 - Массив всех фильмов
 * @returns {Error}  500 - Ошибка сервера
 */
moviesRouter.get("/movies", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM movies");
    res.json(result.rows);
  } catch (error) {
    console.error("Ошибка при получении фильмов:", error.message);
    res.status(500).send("Ошибка сервера");
  }
});

/**
 * Добавление нового фильма.
 * @route POST /movies
 * @group movies - Операции с фильмами
 * @param {string} title.body.required - Название фильма
 * @param {number} duration.body.required - Длительность фильма в минутах
 * @param {string} origin.body.required - Страна производства
 * @param {string} poster.body.required - URL постера фильма
 * @param {string} synopsis.body.required - Синопсис фильма
 * @returns {Object} 201 - Созданный фильм
 * @returns {Error}  500 - Ошибка сервера
 */
moviesRouter.post("/movies", async (req, res) => {
  const { title, duration, origin, poster, synopsis } = req.body;

  try {
    // Вставка нового фильма в базу данных
    const result = await pool.query("INSERT INTO movies (title, duration, origin, poster, synopsis) VALUES ($1, $2, $3, $4, $5) RETURNING *", [
      title,
      duration,
      origin,
      poster,
      synopsis,
    ]);

    const newMovie = result.rows[0];
    res.status(201).json(newMovie);
  } catch (error) {
    console.error("Ошибка при добавлении фильма:", error.message);
    res.status(500).send("Ошибка сервера");
  }
});

module.exports = moviesRouter;
