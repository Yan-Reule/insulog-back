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
  const useId = await userRepository.findByLogin(nome)

  if (!useId) {
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

function classificarGlicose(valor) {
  if (valor < 70) {
    return {
      status: 0,
      descricao: 'Baixa'
    }
  }

  if (valor > 125) {
    return {
      status: 2,
      descricao: 'Alta'
    }
  }

  return {
    status: 1,
    descricao: 'Tudo certo'
  }
}

function formatarData(data) {
  return new Date(data).toISOString().split('T')[0]
}

function formatarDataHoraAtual() {
  const agora = new Date()

  const pad = numero => String(numero).padStart(2, '0')

  const ano = agora.getFullYear()
  const mes = pad(agora.getMonth() + 1)
  const dia = pad(agora.getDate())
  const hora = pad(agora.getHours())
  const minuto = pad(agora.getMinutes())
  const segundo = pad(agora.getSeconds())

  return `${ano}-${mes}-${dia} ${hora}:${minuto}:${segundo}`
}

async function getDashboardDados(id_usuario, dataInicio, dataFim) {
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

  const registros = await registroGlicoseRepository.findByUserIdAndPeriod(
    id_usuario,
    dataInicio,
    dataFim
  )

  if (!registros || registros.length === 0) {
    return {
      mediaDiaria: 0,
      statusMediaDiaria: 1,
      statusMediaDiariaDescricao: 'Tudo certo',
      registros: []
    }
  }

  const registrosNormalizados = registros.map(reg => ({
    ...reg,
    nivel_glicose: Number(reg.nivel_glicose)
  }))

  const dataAtual = formatarData(new Date())

  const registrosDoDiaAtual = registrosNormalizados.filter(reg => {
    const dataRegistro = formatarData(reg.data_hora)
    return dataRegistro === dataAtual
  })

  let mediaDiaria = 0

  if (registrosDoDiaAtual.length > 0) {
    const somaDiaAtual = registrosDoDiaAtual.reduce((acc, reg) => {
      return acc + reg.nivel_glicose
    }, 0)

    mediaDiaria = somaDiaAtual / registrosDoDiaAtual.length
  }

  const mediaDiariaArredondada = Math.round(mediaDiaria)
  const classificacaoMediaDiaria = classificarGlicose(mediaDiariaArredondada)

  const registrosFormatados = registrosNormalizados.map(reg => {
    const classificacao = classificarGlicose(reg.nivel_glicose)

    return {
      id: reg.id_registro,
      horaDoRegistro: reg.data_hora,
      nivelGlicose: Math.round(reg.nivel_glicose),
      status: classificacao.status,
      statusDescricao: classificacao.descricao
    }
  })

  return {
    mediaDiaria: mediaDiariaArredondada,
    statusMediaDiaria: classificacaoMediaDiaria.status,
    statusMediaDiariaDescricao: classificacaoMediaDiaria.descricao,
    registros: registrosFormatados
  }
}

async function createRegistroGlicose(data) {
  const { id_usuario, nivel_glicose, data_hora, id_periodo } = data

  if (!id_usuario || nivel_glicose === undefined || !id_periodo) {
    const error = new Error('ID do usuário, nível de glicose e período são obrigatórios')
    error.statusCode = 400
    throw error
  }

  const dataHoraFinal = data_hora || formatarDataHoraAtual()

  return await registroGlicoseRepository.create({
    id_usuario,
    nivel_glicose,
    data_hora: dataHoraFinal,
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