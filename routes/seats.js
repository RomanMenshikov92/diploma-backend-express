/**
 * @module seatsRouter
 *
 * Модуль для управления местами в сеансах. Включает маршруты для обновления статуса мест.
 */
const express = require("express");
const seatsRouter = express.Router();
const pool = require("../db");

/**
 * Обновление статуса мест для указанного сеанса.
 * @route POST /update-seats
 * @group seats - Операции с местами
 * @param {string} sessionId.body.required - ID сеанса
 * @param {Array<string>} selectedSeats.body.required - Массив строк, представляющих выбранные места в формате "row-column"
 * @returns {null} 200 - Успешное обновление мест
 * @returns {Error}  500 - Ошибка сервера
 */
seatsRouter.post("/update-seats", async (req, res) => {
  const { sessionId, selectedSeats } = req.body;

  try {
    // Запрос к базе данных для обновления мест
    for (const seat of selectedSeats) {
      const [row, column] = seat.split("-").map(Number);

      // Проверка, существует ли уже запись для данного места
      const checkResult = await pool.query(
        `
        SELECT * FROM sold_tickets
        WHERE session_id = $1 AND seat_row = $2 AND seat_column = $3
      `,
        [sessionId, row, column]
      );

      if (checkResult.rows.length > 0) {
        // Обновляем статус, если запись уже существует
        await pool.query(
          `
          UPDATE sold_tickets
          SET status = 'taken'
          WHERE session_id = $1 AND seat_row = $2 AND seat_column = $3
        `,
          [sessionId, row, column]
        );
      } else {
        // Вставляем новую запись, если она не существует
        await pool.query(
          `
          INSERT INTO sold_tickets (session_id, seat_row, seat_column, status)
          VALUES ($1, $2, $3, 'taken')
        `,
          [sessionId, row, column]
        );
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(`Ошибка при обновлении мест для сеанса ${sessionId}:`, error.message);
    res.status(500).send("Ошибка сервера");
  }
});

module.exports = seatsRouter;
