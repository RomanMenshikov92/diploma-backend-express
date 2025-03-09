/**
 * Импортируем необходимые модули.
 * @module server
 */
const express = require("express");
const cors = require("cors");

const moviesRouter = require("./routes/movies");
const sessionRouter = require("./routes/session");
const seatsRouter = require("./routes/seats");
const authRouter = require("./routes/auth");
const hallsRouter = require("./routes/halls");
const authMiddleware = require("./middleware/auth");

/**
 * Создаем экземпляр приложения Express.
 * @const {Object} app - Экземпляр приложения Express.
 * @const {number} PORT - Порт, на котором будет запущен сервер.
 */
const app = express();
const PORT = process.env.PORT || 5000;

// Используем CORS для разрешения кросс-доменных запросов.
app.use(cors());

// Парсинг входящих JSON-запросов.
app.use(express.json());

// Подключаем маршруты API.
app.use("/api", moviesRouter);
app.use("/api", sessionRouter);
app.use("/api", seatsRouter);
app.use("/api/auth", authRouter);
app.use("/api", authMiddleware, hallsRouter);

/**
 * Обработчик корневого маршрута.
 * @function
 * @param {Object} req - Объект запроса.
 * @param {Object} res - Объект ответа.
 */
app.get("/", (req, res) => {
  res.send("Сервер работает!");
});

/**
 * Обработчик маршрута API.
 * @function
 * @param {Object} req - Объект запроса.
 * @param {Object} res - Объект ответа.
 */
app.get("/api", (req, res) => {
  res.send("API работает!");
});

/**
 * Запускаем сервер.
 * @function
 * @param {number} port - Порт, на котором будет запущен сервер.
 */
app.listen(PORT, () => {
  console.log(`Ваш сервер запущен, и у него порт: ${PORT}`);
});
