/**
 * @fileoverview Application entry point for Walletfy backend server
 * Starts the Express server and configures the listening port
 */

import 'dotenv/config';
import app from './app';

/**
 * Server port configuration
 * The port number on which the server will listen for incoming connections
 * @type {number}
 */
const PORT = Number(process.env.PORT) || 3030;

/**
 * Start the Express server
 * Begins listening for HTTP requests on the configured port
 * @param {number} PORT - The port number to listen on
 * @param {Function} callback - Callback function executed when server starts successfully
 * @returns {void} Logs server startup information to console
 * @throws {Error} When port is already in use or server fails to start
 * @example
 * Server will start on http://localhost:3030
 * Health check: http://localhost:3030/health
 * API endpoints: http://localhost:3030/api/eventos
 */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health endpoint available at http://localhost:${PORT}/health`);
  console.log(`🔧 API endpoints available at http://localhost:${PORT}/api/eventos`);
});