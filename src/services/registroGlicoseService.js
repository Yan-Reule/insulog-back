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

async function getDashboardDados(id_usuario, dataInicio, dataFim) {
  // Validar parâmetros
  if (!id_usuario) {
    const error = new Error('ID do usuário é obrigatório')
    error.statusCode = 400
    throw error
  }

  if (!dataInicio || !dataFim) {
    const error = new Error('Data de início e fim são obrigatórias')
    error.statusCode = 400
    throw error
  }

  // Buscar registros no período
  const registros = await registroGlicoseRepository.findByUserIdAndPeriod(id_usuario, dataInicio, dataFim)

  if (!registros || registros.length === 0) {
    return {
      mediaDiaria: 0,
      mediaGeral: {
        media: 0,
        tudoCerto: 0,
        baixa: 0,
        alta: 0
      },
      registros: []
    }
  }

  // Calcular média geral
  const soma = registros.reduce((acc, reg) => acc + reg.nivel_glicose, 0)
  const mediaGeral = soma / registros.length

  // Classificar registros e contar
  let tudoCerto = 0
  let baixa = 0
  let alta = 0

  const registrosFormatados = registros.map(reg => {
    let status = 1 // Padrão: Tudo Certo

    if (reg.nivel_glicose < 70) {
      status = 0 // Baixa
      baixa++
    } else if (reg.nivel_glicose > 125) {
      status = 2 // Alta
      alta++
    } else {
      tudoCerto++
    }

    return {
      id: reg.id_registro,
      horaDoRegistro: reg.data_hora,
      status: status
    }
  })

  // Calcular média diária (média dos últimos registros agrupados por dia)
  const registrosPorDia = {}
  registros.forEach(reg => {
    const data = new Date(reg.data_hora).toISOString().split('T')[0]
    if (!registrosPorDia[data]) {
      registrosPorDia[data] = []
    }
    registrosPorDia[data].push(reg.nivel_glicose)
  })

  let totalMedias = 0
  let quantidadeDias = 0

  Object.values(registrosPorDia).forEach(dia => {
    const somaDia = dia.reduce((acc, val) => acc + val, 0)
    const mediaDia = somaDia / dia.length
    totalMedias += mediaDia
    quantidadeDias++
  })

  const mediaDiaria = quantidadeDias > 0 ? totalMedias / quantidadeDias : 0

  return {
    mediaDiaria: parseFloat(mediaDiaria.toFixed(2)),
    mediaGeral: {
      media: parseFloat(mediaGeral.toFixed(2)),
      tudoCerto: tudoCerto,
      baixa: baixa,
      alta: alta
    },
    registros: registrosFormatados
  }
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
  getRegistrosGlicoseByUserId,
  getDashboardDados
}

