const registroGlicoseRepository = require('../repositories/registroGlicoseRepository')

async function listRegistrosGlicose() {
  return await registroGlicoseRepository.findAll()
}

async function getRegistroGlicoseById(id) {
  const registroGlicose = await registroGlicoseRepository.findById(id)

  if (!registroGlicose) {
    const error = new Error('Registro de glicose não encontrado')
    error.statusCode = 404
    throw error
  }

  return registroGlicose
}

async function createRegistroGlicose(data) {
  const { id_usuario, nivel_glicose, data_hora, id_periodo } = data

  if (!id_usuario || nivel_glicose === undefined || !data_hora || !id_periodo) {
    const error = new Error('Todos os campos são obrigatórios')
    error.statusCode = 400
    throw error
  }

  return await registroGlicoseRepository.create({
    id_usuario,
    nivel_glicose,
    data_hora,
    id_periodo
  })
}

async function updateRegistroGlicose(id, data) {
  const registroGlicose = await registroGlicoseRepository.findById(id)

  if (!registroGlicose) {
    const error = new Error('Registro de glicose não encontrado')
    error.statusCode = 404
    throw error
  }

  const { id_usuario, nivel_glicose, data_hora, id_periodo } = data

  if (!id_usuario || nivel_glicose === undefined || !data_hora || !id_periodo) {
    const error = new Error('Todos os campos são obrigatórios')
    error.statusCode = 400
    throw error
  }

  return await registroGlicoseRepository.update(id, {
    id_usuario,
    nivel_glicose,
    data_hora,
    id_periodo
  })
}

async function deleteById(id) {
  const registroGlicose = await registroGlicoseRepository.findById(id)

  if (!registroGlicose) {
    const error = new Error('Registro de glicose não encontrado')
    error.statusCode = 404
    throw error
  }

  await registroGlicoseRepository.deleteById(id)
}

module.exports = {
  listRegistrosGlicose,
  getRegistroGlicoseById,
  createRegistroGlicose,
  updateRegistroGlicose,
  deleteById
}
