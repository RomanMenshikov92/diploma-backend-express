/**
 * @module routes/auth
 *
 * Модуль, содержащий маршруты для аутентификации администраторов, включая регистрацию, вход и обновление токена.
 */
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
require("dotenv").config();

// Создаем новый экземпляр маршрутизатора Express для определения маршрутов аутентификации
const authRouter = express.Router();

/**
 * Регистрация нового администратора.
 *
 * @function
 * @name register
 * @param {Object} req - Объект запроса
 * @param {Object} res - Объект ответа
 * @returns {void}
 * @throws {Error} Ошибка сервера при выполнении запроса
 */
authRouter.post("/register", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Хэшируем пароль перед сохранением в базе данных
    const hashedPassword = await bcrypt.hash(password, 10);

    // Сохраняем нового администратора в базе данных
    await pool.query("INSERT INTO admins (email, password) VALUES ($1, $2)", [email, hashedPassword]);

    // Отправляем ответ о успешной регистрации
    res.status(201).send("Администратор успешно зарегистрирован");
  } catch (error) {
    console.error("Ошибка при регистрации администратора:", error.message);
    // Отправляем сообщение об ошибке сервера
    res.status(500).send("Ошибка сервера");
  }
});

/**
 * Вход администратора в систему.
 *
 * @function
 * @name login
 * @param {Object} req - Объект запроса
 * @param {Object} res - Объект ответа
 * @returns {Object} Токен JWT для администратора
 * @throws {Error} Неверные учетные данные или ошибка сервера
 */
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Проверяем, существует ли администратор с указанным email
    const result = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(400).send("Неверные учетные данные");
    }

    const admin = result.rows[0];

    // Сравниваем введенный пароль с хэшированным паролем в базе данных
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).send("Неверные учетные данные");
    }

    // Создаем JWT токен с идентификатором администратора
    const token = jwt.sign({ adminId: admin.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Отправляем токен в ответе
    res.json({ token });
  } catch (error) {
    console.error("Ошибка при входе в систему:", error.message);

    // Отправляем сообщение об ошибке сервера
    res.status(500).send("Ошибка сервера");
  }
});

/**
 * Обновление токена доступа.
 *
 * @function
 * @name refreshToken
 * @param {Object} req - Объект запроса
 * @param {Object} res - Объект ответа
 * @returns {Object} Новый токен JWT
 * @throws {Error} Неверный или истекший токен
 */
authRouter.post("/refresh-token", async (req, res) => {
  const { token } = req.body;

  // Проверяем, был ли предоставлен токен
  if (!token) {
    return res.status(400).send("Токен не предоставлен");
  }

  try {
    // Проверяем и декодируем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Создаем новый токен с тем же идентификатором администратора
    const newToken = jwt.sign({ adminId: decoded.adminId }, process.env.JWT_SECRET, { expiresIn: "1h" });

    // Отправляем новый токен в ответе
    res.json({ token: newToken });
  } catch (error) {
    console.error("Ошибка при обновлении токена:", error.message);

    // Отправляем сообщение об ошибке, если токен недействителен или истек
    res.status(401).send("Неверный или истекший токен");
  }
});

module.exports = authRouter;
