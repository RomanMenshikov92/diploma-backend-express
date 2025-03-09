/**
 * @module hallsRouter
 *
 * Модуль для управления залами. Включает маршруты для получения, создания, обновления конфигурации и цен залов, а также для удаления залов.
 */
const express = require("express");
const hallsRouter = express.Router();
const pool = require("../db");

/**
 * Получение всех залов.
 * @route GET /halls
 * @group halls - Операции с залами
 * @returns {Array} 200 - Массив залов
 * @returns {Error}  500 - Ошибка сервера
 */
hallsRouter.get("/halls", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM halls");
    res.json(result.rows);
  } catch (error) {
    console.error("Ошибка при получении залов:", error.message);
    res.status(500).send("Ошибка сервера");
  }
});

/**
 * Удаление зала по ID.
 * @route DELETE /halls/{id}
 * @group halls - Операции с залами
 * @param {number} id.path.required - ID зала
 * @returns {null} 204 - Успешное удаление
 * @returns {Error}  400 - Ошибка, если есть проданные билеты или открытые сеансы
 * @returns {Error}  500 - Ошибка сервера
 */
hallsRouter.delete("/halls/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount: soldTicketsCount } = await pool.query(
      "SELECT 1 FROM sold_tickets st JOIN sessions s ON st.session_id = s.id WHERE s.hall_id = $1 LIMIT 1",
      [id]
    );
    // Проверяем, есть ли проданные билеты в зале
    if (soldTicketsCount > 0) {
      // Если есть, возвращаем ошибку 400
      return res.status(400).json({ message: "В зале есть проданные билеты, удаление невозможно." });
    }

    const { rowCount: openSessionsCount } = await pool.query("SELECT 1 FROM sessions WHERE hall_id = $1 AND status = $2 LIMIT 1", [id, "open"]);

    if (openSessionsCount > 0) {
      return res.status(400).json({ message: "Приостановите продажу билетов для этого зала, прежде чем удалять его." });
    }

    await pool.query("DELETE FROM halls WHERE id = $1", [id]);
    res.sendStatus(204);
  } catch (error) {
    console.error("Ошибка при удалении зала:", error.message);
    res.status(500).send("Ошибка сервера");
  }
});

/**
 * Создание нового зала.
 * @route POST /halls
 * @group halls - Операции с залами
 * @param {string} name.body.required - Название зала
 * @returns {null} 201 - Успешное создание
 * @returns {Error}  500 - Ошибка сервера
 */
hallsRouter.post("/halls", async (req, res) => {
  const { name } = req.body;
  try {
    await pool.query("INSERT INTO halls (name, seats, price_regular, price_vip) VALUES ($1, $2, $3, $4)", [name, "[]", 300, 500]);
    res.sendStatus(201);
  } catch (error) {
    console.error("Ошибка при создании зала:", error.message);
    res.status(500).send("Ошибка сервера");
  }
});

/**
 * Получение конфигурации зала по ID.
 * @route GET /halls/{id}
 * @group halls - Операции с залами
 * @param {number} id.path.required - ID зала
 * @returns {Object} 200 - Конфигурация зала
 * @returns {Error}  404 - Зал не найден
 * @returns {Error}  500 - Ошибка сервера
 */
hallsRouter.get("/halls/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT seats FROM halls WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).send("Зал не найден");
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Ошибка при получении конфигурации зала:", error.message);
    res.status(500).send("Ошибка сервера");
  }
});

/**
 * Обновление конфигурации зала по ID.
 * @route POST /halls/{id}/config
 * @group halls - Операции с залами
 * @param {number} id.path.required - ID зала
 * @param {Array} seats.body.required - Новая конфигурация мест
 * @returns {null} 200 - Успешное обновление
 * @returns {Error}  400 - Ошибка, если есть проданные билеты
 * @returns {Error}  500 - Ошибка сервера
 */
hallsRouter.post("/halls/:id/config", async (req, res) => {
  const { id } = req.params;
  const { seats } = req.body;
  try {
    const { rowCount } = await pool.query("SELECT 1 FROM sold_tickets st JOIN sessions s ON st.session_id = s.id WHERE s.hall_id = $1 LIMIT 1", [id]);

    if (rowCount > 0) {
      return res.status(400).json({ message: "В зале есть проданные билеты, изменение конфигурации невозможно." });
    }

    await pool.query("UPDATE halls SET seats = $1 WHERE id = $2", [seats, id]);
    res.sendStatus(200);
  } catch (error) {
    console.error("Ошибка при сохранении конфигурации зала:", error.message);
    res.status(500).send("Ошибка сервера");
  }
});

/**
 * Обновление цен для зала по ID.
 * @route POST /halls/{id}/prices
 * @group halls - Операции с залами
 * @param {number} id.path.required - ID зала
 * @param {number} regularPrice.body.required - Новая цена за обычные билеты
 * @param {number} vipPrice.body.required - Новая цена за VIP-билеты
 * @returns {null} 200 - Успешное обновление цен
 * @returns {Error}  400 - Ошибка, если есть проданные билеты
 * @returns {Error}  500 - Ошибка сервера
 */
hallsRouter.post("/halls/:id/prices", async (req, res) => {
  const { id } = req.params;
  const { regularPrice, vipPrice } = req.body;
  try {
    const { rowCount } = await pool.query("SELECT 1 FROM sold_tickets st JOIN sessions s ON st.session_id = s.id WHERE s.hall_id = $1 LIMIT 1", [id]);

    if (rowCount > 0) {
      return res.status(400).json({ message: "В зале есть проданные билеты, изменение цен невозможно." });
    }

    await pool.query("UPDATE halls SET price_regular = $1, price_vip = $2 WHERE id = $3", [regularPrice, vipPrice, id]);
    res.sendStatus(200);
  } catch (error) {
    console.error("Ошибка при обновлении цен зала:", error.message);
    res.status(500).send("Ошибка сервера");
  }
});

module.exports = hallsRouter;
