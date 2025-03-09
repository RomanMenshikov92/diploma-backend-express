/**
 * Конфигурация для подключения к базе данных и миграций.
 * @module config
 */
module.exports = {
  /**
   * URL для подключения к базе данных PostgreSQL.
   * @type {string}
   */
  databaseUrl: process.env.DATABASE_URL,
  /**
   * Название таблицы для хранения информации о миграциях.
   * @type {string}
   */
  migrationsTable: "pgmigrations",
  /**
   * Директория, в которой хранятся файлы миграций.
   * @type {string}
   */
  dir: "migrations",
};
