// logger.js
const winston = require('winston');

// Cấu hình Winston Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: 'app.log' }), // Lưu log vào file
    new winston.transports.Console() // Hiển thị log trong console
  ]
});

module.exports = logger;
