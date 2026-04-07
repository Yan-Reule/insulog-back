const alarmeRepository = require('../repositories/alarmeRepository')

async function listAlarmes() {
  return await alarmeRepository.findAll()
}

async function getAlarmeById(id) {
  const alarme = await alarmeRepository.findById(id)

  if (!alarme) {
    const error = new Error('Alarme não encontrado')
    error.statusCode = 404
    throw error
  }

  return alarme
}

async function createAlarme(data) {
  const { id_usuario, data_hora } = data

  if (!id_usuario || !data_hora) {
    const error = new Error('Todos os campos são obrigatórios')
    error.statusCode = 400
    throw error
  }

  return await alarmeRepository.create({
    id_usuario,
    data_hora
  })
}

async function updateAlarme(id, data) {
  const alarme = await alarmeRepository.findById(id)

  if (!alarme) {
    const error = new Error('Alarme não encontrado')
    error.statusCode = 404
    throw error
  }

  const { id_usuario, data_hora } = data

  if (!id_usuario || !data_hora) {
    const error = new Error('Todos os campos são obrigatórios')
    error.statusCode = 400
    throw error
  }

  return await alarmeRepository.update(id, {
    id_usuario,
    data_hora
  })
}

async function deleteById(id) {
  const alarme = await alarmeRepository.findById(id)

  if (!alarme) {
    const error = new Error('Alarme não encontrado')
    error.statusCode = 404
    throw error
  }

  await alarmeRepository.deleteById(id)
}

module.exports = {
  listAlarmes,
  getAlarmeById,
  createAlarme,
  updateAlarme,
  deleteById
}
