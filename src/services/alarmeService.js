const alarmeRepository = require('../repositories/alarmeRepository')

const DIAS_SEMANA_VALIDOS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM']

function normalizarDiasSemana(diasSemana) {
  const dias = Array.isArray(diasSemana)
    ? diasSemana
    : typeof diasSemana === 'string'
      ? diasSemana.split(',')
      : []
  const diasNormalizados = [...new Set(dias.map(dia => String(dia).trim().toUpperCase()).filter(Boolean))]

  if (diasNormalizados.length === 0 || diasNormalizados.some(dia => !DIAS_SEMANA_VALIDOS.includes(dia))) {
    const error = new Error(`dias_semana deve conter ao menos um destes valores: ${DIAS_SEMANA_VALIDOS.join(', ')}`)
    error.statusCode = 400
    throw error
  }

  return DIAS_SEMANA_VALIDOS.filter(dia => diasNormalizados.includes(dia))
}

function normalizarAtivo(ativo, valorPadrao) {
  if (ativo === undefined) return valorPadrao
  if (ativo === true || ativo === 1 || ativo === '1' || ativo === 'true') return true
  if (ativo === false || ativo === 0 || ativo === '0' || ativo === 'false') return false

  const error = new Error('ativo deve ser um valor booleano')
  error.statusCode = 400
  throw error
}

async function listAlarmes() {
  return await alarmeRepository.findAll()
}

async function getAlarmesByUsuarioId(usuarioId) {
  const id = Number(usuarioId)

  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error('ID do usuario deve ser um numero inteiro maior que zero')
    error.statusCode = 400
    throw error
  }

  return await alarmeRepository.findByUsuarioId(id)
}

async function getAlarmeById(id) {
  const alarme = await alarmeRepository.findById(id)

  if (!alarme) {
    const error = new Error('Alarme nao encontrado')
    error.statusCode = 404
    throw error
  }

  return alarme
}

async function createAlarme(data) {
  const { id_usuario, data_hora, id_periodo, id_registro, dias_semana, ativo } = data

  if (!id_usuario || !data_hora) {
    const error = new Error('Todos os campos sao obrigatorios')
    error.statusCode = 400
    throw error
  }

  return await alarmeRepository.create({
    id_usuario,
    data_hora,
    id_periodo,
    id_registro,
    dias_semana: normalizarDiasSemana(dias_semana),
    ativo: normalizarAtivo(ativo, true)
  })
}

async function updateAlarme(id, data) {
  const alarme = await alarmeRepository.findById(id)

  if (!alarme) {
    const error = new Error('Alarme nao encontrado')
    error.statusCode = 404
    throw error
  }

  const { id_usuario, data_hora, id_periodo, id_registro, dias_semana, ativo } = data

  if (!id_usuario || !data_hora) {
    const error = new Error('Todos os campos sao obrigatorios')
    error.statusCode = 400
    throw error
  }

  return await alarmeRepository.update(id, {
    id_usuario,
    data_hora,
    id_periodo,
    id_registro,
    dias_semana: normalizarDiasSemana(dias_semana === undefined ? alarme.dias_semana : dias_semana),
    ativo: normalizarAtivo(ativo, alarme.ativo)
  })
}

async function deleteById(id) {
  const alarme = await alarmeRepository.findById(id)

  if (!alarme) {
    const error = new Error('Alarme nao encontrado')
    error.statusCode = 404
    throw error
  }

  await alarmeRepository.deleteById(id)
}

module.exports = {
  listAlarmes,
  getAlarmesByUsuarioId,
  getAlarmeById,
  createAlarme,
  updateAlarme,
  deleteById
}
