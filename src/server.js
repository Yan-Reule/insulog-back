require('dotenv').config()
const app = require('./app')
const { testDatabaseConnection } = require("./config/database");

const PORT = process.env.PORT || 3000

async function startServer() {
  await testDatabaseConnection();

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

startServer();