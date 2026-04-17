const registroGlicoseRepository = require('../repositories/registroGlicoseRepository')
const userRepository = require('../repositories/userRepository')

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

async function getRegistrosGlicoseByUserId(nome) {
  const useId = await userRepository.findByLogin(nome);

  if (!useId){
     const error = new Error('Usuario não encontrado')
    error.statusCode = 400
    throw error
  }

  const registrosGlicose = await registroGlicoseRepository.findByUserId(useId)

  if (!registrosGlicose || registrosGlicose.length === 0) {
    const error = new Error('Nenhum registro de glicose encontrado para este usuário')
    error.statusCode = 404
    throw error
  }

  return registrosGlicose
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
  deleteById,
  getRegistrosGlicoseByUserId
}
