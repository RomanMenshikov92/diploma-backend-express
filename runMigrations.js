// Импортируем и настраиваем переменные окружения из файла .env
require("dotenv").config();
// Импортируем библиотеку для миграции базы данных PostgreSQL
const nodePgMigrate = require("node-pg-migrate");

/**
 * Выполняет миграцию базы данных.
 * @async
 * @function migrate
 * @param {string} direction - Направление миграции ('up' или 'down').
 * @param {string} file - Имя файла миграции.
 * @returns {Promise<void>} Возвращает промис, который разрешается, когда миграция завершена.
 */
const migrate = async (direction, file) => {
  try {
    await nodePgMigrate.default({
      direction,
      migrationsTable: "pgmigrations",
      dir: "migrations",
      migrationFile: file,
      databaseUrl: process.env.DATABASE_URL,
    });
    console.log(`Миграция ${direction} завершена для ${file}`);
  } catch (error) {
    console.error(`Migration ${direction} завершена с ошибкой для ${file}`, error);
  }
};

/**
 * Запускает последовательность миграций.
 * @async
 * @function runMigrations
 * @returns {Promise<void>} Возвращает промис, который разрешается, когда все миграции завершены.
 */
const runMigrations = async () => {
  await migrate("up", "1717738472803_create-tables.js");
  await migrate("up", "1717738479853_populate-tables.js");
};

// Запускаем миграции
runMigrations();
