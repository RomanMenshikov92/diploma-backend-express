/**
 * Подключение к базе данных.
 * @module pool
 */
const pool = require("./db");

/**
 * Сбрасывает базу данных, удаляя все таблицы и очищая информацию о миграциях.
 * @async
 * @function resetDatabase
 * @returns {Promise<void>} Возвращает промис, который разрешается, когда операция завершена.
 */
async function resetDatabase() {
  try {
    await pool.query(`
      DROP TABLE IF EXISTS sold_tickets;
      DROP TABLE IF EXISTS sessions;
      DROP TABLE IF EXISTS movies;
      DROP TABLE IF EXISTS halls;
      DROP TABLE IF EXISTS admins;
      DELETE FROM pgmigrations;
    `);
    console.log("Сброс базы данных прошел успешно");
  } catch (error) {
    console.error("Ошибка при сбросе базы данных:", error);
  } finally {
    await pool.end();
  }
}

// Запускаем функцию сброса базы данных
resetDatabase();
