const exportacaoRepository = require('../repositories/exportacaoRepository')

async function listExportacoes() {
  return await exportacaoRepository.findAll()
}

async function getExportacaoById(id) {
  const exportacao = await exportacaoRepository.findById(id)

  if (!exportacao) {
    const error = new Error('Exportação não encontrada')
    error.statusCode = 404
    throw error
  }

  return exportacao
}

async function createExportacao(data) {
  const { id_usuario, data: dataExportacao, descricao } = data

  if (!id_usuario || !dataExportacao || !descricao) {
    const error = new Error('Todos os campos são obrigatórios')
    error.statusCode = 400
    throw error
  }

  return await exportacaoRepository.create({
    id_usuario,
    data: dataExportacao,
    descricao
  })
}

async function updateExportacao(id, data) {
  const exportacao = await exportacaoRepository.findById(id)

  if (!exportacao) {
    const error = new Error('Exportação não encontrada')
    error.statusCode = 404
    throw error
  }

  const { id_usuario, data: dataExportacao, descricao } = data

  if (!id_usuario || !dataExportacao || !descricao) {
    const error = new Error('Todos os campos são obrigatórios')
    error.statusCode = 400
    throw error
  }

  return await exportacaoRepository.update(id, {
    id_usuario,
    data: dataExportacao,
    descricao
  })
}

async function deleteById(id) {
  const exportacao = await exportacaoRepository.findById(id)

  if (!exportacao) {
    const error = new Error('Exportação não encontrada')
    error.statusCode = 404
    throw error
  }

  await exportacaoRepository.deleteById(id)
}

module.exports = {
  listExportacoes,
  getExportacaoById,
  createExportacao,
  updateExportacao,
  deleteById
}
