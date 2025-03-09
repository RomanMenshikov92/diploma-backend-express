/**
 * Импортируем класс Pool из библиотеки pg для работы с PostgreSQL.
 * @module db
 */
const { Pool } = require("pg");
require("dotenv").config();

/**
 * Создаем пул соединений с базой данных PostgreSQL.
 * @const {Pool} pool - Пул соединений, использующий строку подключения из переменной окружения.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Экспортируем пул соединений для использования в других модулях.
 * @exports pool
 */
module.exports = pool;
