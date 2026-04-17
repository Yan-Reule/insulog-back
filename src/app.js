const express = require('express')
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const typeInsuRoutes = require('./routes/typeInsuRoutes')
const periodoRoutes = require('./routes/periodoRoutes')
const registroGlicoseRoutes = require('./routes/registroGlicoseRoutes')
const registroInsulinaRoutes = require('./routes/registroInsulinaRoutes')
const exportacaoRoutes = require('./routes/exportacaoRoutes')
const configuracaoRoutes = require('./routes/configuracaoRoutes')
const alarmeRoutes = require('./routes/alarmeRoutes')
const errorHandler = require('./middlewares/errorHandler')

const app = express()

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  next()
})

app.use(express.json())

app.get('/', (req, res) => {
  return res.json({
    mensagem: 'API rodando'
  })
})

app.use('/', authRoutes)
app.use('/usuarios', userRoutes)
app.use('/tipos-insulina', typeInsuRoutes)
app.use('/periodos', periodoRoutes)
app.use('/registros-glicose', registroGlicoseRoutes)
app.use('/registros-insulina', registroInsulinaRoutes)
app.use('/exportacoes', exportacaoRoutes)
app.use('/configuracoes', configuracaoRoutes)
app.use('/alarmes', alarmeRoutes)

app.use(errorHandler)

module.exports = app
