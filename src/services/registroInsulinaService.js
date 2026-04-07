const registroInsulinaRepository = require('../repositories/registroInsulinaRepository')

async function listRegistrosInsulina() {
  return await registroInsulinaRepository.findAll()
}

async function getRegistroInsulinaById(id) {
  const registroInsulina = await registroInsulinaRepository.findById(id)

  if (!registroInsulina) {
    const error = new Error('Registro de insulina não encontrado')
    error.statusCode = 404
    throw error
  }

  return registroInsulina
}

async function createRegistroInsulina(data) {
  const { id_registro, id_tipo_insulina, unidade_insulina } = data

  if (!id_registro || !id_tipo_insulina || unidade_insulina === undefined) {
    const error = new Error('Todos os campos são obrigatórios')
    error.statusCode = 400
    throw error
  }

  return await registroInsulinaRepository.create({
    id_registro,
    id_tipo_insulina,
    unidade_insulina
  })
}

async function updateRegistroInsulina(id, data) {
  const registroInsulina = await registroInsulinaRepository.findById(id)

  if (!registroInsulina) {
    const error = new Error('Registro de insulina não encontrado')
    error.statusCode = 404
    throw error
  }

  const { id_registro, id_tipo_insulina, unidade_insulina } = data

  if (!id_registro || !id_tipo_insulina || unidade_insulina === undefined) {
    const error = new Error('Todos os campos são obrigatórios')
    error.statusCode = 400
    throw error
  }

  return await registroInsulinaRepository.update(id, {
    id_registro,
    id_tipo_insulina,
    unidade_insulina
  })
}

async function deleteById(id) {
  const registroInsulina = await registroInsulinaRepository.findById(id)

  if (!registroInsulina) {
    const error = new Error('Registro de insulina não encontrado')
    error.statusCode = 404
    throw error
  }

  await registroInsulinaRepository.deleteById(id)
}

module.exports = {
  listRegistrosInsulina,
  getRegistroInsulinaById,
  createRegistroInsulina,
  updateRegistroInsulina,
  deleteById
}
