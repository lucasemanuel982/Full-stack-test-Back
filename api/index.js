// Ponto de entrada principal para Vercel
require('tsconfig-paths/register');

// Importar o app Express compilado
const app = require('../dist/app.js').default;

// Exportar o app Express diretamente para Vercel
module.exports = app;
