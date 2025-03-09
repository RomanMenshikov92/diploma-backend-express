/**
 * @module sessionsRouter
 *
 * Модуль для управления сеансами фильмов. Включает маршруты для получения, добавления, обновления и удаления сеансов.
 */
const express = require("express");
const sessionRouter = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/auth");

/**
 * Получение данных о сеансе по ID.
 * @route GET /session
 * @group sessions - Операции с сеансами
 * @param {string} sessionId.query.required - ID сеанса
 * @returns {Object} 200 - Данные о сеансе
 * @returns {Error}  404 - Сеанс не найден
 * @returns {Error}  500 - Ошибка сервера
 */
sessionRouter.get("/session", async (req, res) => {
  const { sessionId } = req.query;

  try {
    // Запрос к базе данных для получения данных о сеансе
    const result = await pool.query(
      `
      SELECT
        movies.id AS movie_id,
        movies.title,
        movies.synopsis,
        movies.duration,
        movies.origin,
        movies.poster,
        halls.name AS hall,
        sessions.time,
        sessions.date,
        halls.seats,
        halls.price_regular,
        halls.price_vip
      FROM
        sessions
      JOIN
        movies ON sessions.movie_id = movies.id
      JOIN
        halls ON sessions.hall_id = halls.id
      WHERE
        sessions.id = $1
    `,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const session = result.rows[0];
    const seats = session.seats; // Данные уже являются JSON

    // Запрос к базе данных для получения данных о проданных билетах
    const soldTicketsResult = await pool.query(
      `
      SELECT seat_row, seat_column, status
      FROM sold_tickets
      WHERE session_id = $1
    `,
      [sessionId]
    );

    const soldTickets = soldTicketsResult.rows;

    res.json({
      movie: {
        id: session.movie_id,
        title: session.title,
        synopsis: session.synopsis,
        duration: session.duration,
        origin: session.origin,
        poster: session.poster,
      },
      hall: session.hall,
      time: session.time,
      date: session.date,
      seats,
      prices: {
        standart: session.price_regular,
        vip: session.price_vip,
      },
      soldTickets,
    });
  } catch (error) {
    console.error("Ошибка при получении данных о сеансе:", error.message);
    res.status(500).send("Server Error");
  }
});

/**
 * Получение всех сеансов.
 * @route GET /sessions
 * @group sessions - Операции с сеансами
 * @returns {Array} 200 - Массив всех сеансов
 * @returns {Error}  500 - Ошибка сервера
 */
sessionRouter.get("/sessions", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM sessions");
    res.json(result.rows);
  } catch (error) {
    console.error("Ошибка при получении сеансов:", error.message);
    res.status(500).send("Ошибка сервера");
  }
});

/**
 * Получение сеансов по указанной дате.
 * @route GET /sessions/by-date
 * @group sessions - Операции с сеансами
 * @param {string} date.query.required - Дата в формате YYYY-MM-DD
 * @returns {Array} 200 - Массив сеансов на указанную дату
 * @returns {Error}  500 - Ошибка сервера
 */
sessionRouter.get("/sessions/by-date", async (req, res) => {
  const { date } = req.query;

  try {
    const result = await pool.query(
      `
      SELECT
        sessions.id,
        sessions.hall_id,
        sessions.movie_id,
        sessions.time,
        sessions.date,
        sessions.status,
        movies.title,
        movies.duration,
        movies.poster
      FROM
        sessions
      JOIN
        movies ON sessions.movie_id = movies.id
      WHERE
        sessions.date = $1
    `,
      [date]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Ошибка при получении сеансов по дате:", error.message);
    res.status(500).send("Ошибка сервера");
  }
});

/**
 * Обновление времени сеансов.
 * @route PUT /sessions
 * @group sessions - Операции с сеансами
 * @param {Array} sessions.body.required - Массив объектов сеансов с полями `id` и `time`
 * @returns {null} 200 - Успешное обновление сеансов
 * @returns {Error}  500 - Ошибка сервера
 */
sessionRouter.put("/sessions", authMiddleware, async (req, res) => {
  const sessions = req.body;
  try {
    for (const session of sessions) {
      await pool.query("UPDATE sessions SET time = $1 WHERE id = $2", [session.time, session.id]);
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("Ошибка при обновлении сеансов:", error.message);
    res.status(500).send("Ошибка сервера");
  }
});

/**
 * Добавление новых сеансов.
 * @route POST /sessions
 * @group sessions - Операции с сеансами
 * @param {Array} sessions.body.required - Массив объектов сеансов с полями `hall_id`, `movie_id`, `time`, `date`
 * @returns {null} 201 - Успешное добавление сеансов
 * @returns {Error}  500 - Ошибка сервера
 */
sessionRouter.post("/sessions", authMiddleware, async (req, res) => {
  const sessions = req.body;
  try {
    for (const session of sessions) {
      await pool.query("INSERT INTO sessions (hall_id, movie_id, time, date, status) VALUES ($1, $2, $3, $4, $5)", [
        session.hall_id,
        session.movie_id,
        session.time,
        session.date,
        "closed",
      ]);
    }
    res.sendStatus(201);
  } catch (error) {
    console.error("Ошибка при добавлении сеансов:", error.message);
    res.status(500).send("Ошибка сервера");
  }
});

/**
 * Удаление сеанса по ID.
 * @route DELETE /sessions/{id}
 * @group sessions - Операции с сеансами
 * @param {string} id.path.required - ID сеанса
 * @returns {null} 204 - Успешное удаление сеанса
 * @returns {Error}  500 - Ошибка сервера
 */
sessionRouter.delete("/sessions/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM sessions WHERE id = $1", [id]);
    res.sendStatus(204);
  } catch (error) {
    console.error("Ошибка при удалении сеанса:", error.message);
    res.status(500).send("Ошибка сервера");
  }
});

/**
 * Обновление статуса сеансов по ID зала.
 * @route POST /sessions/status
 * @group sessions - Операции с сеансами
 * @param {Object} hallId.body.required - ID зала и новый статус
 * @param {string} hallId.body.required - ID зала
 * @param {string} status.body.required - Новый статус сеансов (например, "open" или "closed")
 * @returns {Object} 200 - Сообщение об успешном обновлении статуса
 * @returns {Error}  500 - Ошибка сервера
 */
sessionRouter.post("/sessions/status", authMiddleware, async (req, res) => {
  const { hallId, status } = req.body;

  try {
    // Обновляем сеансы, у которых нет проданных билетов
    const result = await pool.query(
      `
      UPDATE sessions
      SET status = $1
      WHERE hall_id = $2 AND status != $1 AND id NOT IN (
        SELECT session_id FROM sold_tickets
      )`,
      [status, hallId]
    );

    // Проверяем, если есть сеансы, которые не были обновлены из-за наличия проданных билетов
    const remainingSessions = await pool.query(
      `
      SELECT id FROM sessions
      WHERE hall_id = $2 AND status != $1 AND id IN (
        SELECT session_id FROM sold_tickets
      )`,
      [status, hallId]
    );

    if (remainingSessions.rowCount > 0) {
      return res.status(200).json({
        message: `Не все сеансы были ${status === "open" ? "открыты" : "закрыты"}, так как имеются сеансы с проданными билетами.`,
      });
    } else {
      return res.status(200).json({
        message: `Все сеансы были успешно ${status === "open" ? "открыты" : "закрыты"}.`,
      });
    }
  } catch (error) {
    console.error("Ошибка при обновлении статуса сеансов:", error.message);
    console.error("Подробности ошибки:", error);
    res.status(500).send("Ошибка сервера");
  }
});

module.exports = sessionRouter;
