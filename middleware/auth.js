 // Импортируем библиотеку jsonwebtoken для работы с JSON Web Tokens (JWT).
const jwt = require("jsonwebtoken");

/**
 * Middleware для аутентификации пользователей с использованием JWT (JSON Web Token).
 * Проверяет наличие заголовка авторизации и валидность токена.
 *
 * @param {Object} req - Объект запроса.
 * @param {Object} res - Объект ответа.
 * @param {Function} next - Функция для передачи управления следующему middleware.
 * @returns {void}
 */
const authMiddleware = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return res.status(401).send("Требуется авторизация");
  }

  const token = authorizationHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send("Требуется авторизация");
  }

  jwt.verify(token, process.env.JWT_SECRET, (verificationError, decodedToken) => {
    if (verificationError) {
      return res.status(401).send("Неверный токен");
    }
    req.user = decodedToken;
    next();
  });
};

module.exports = authMiddleware;
