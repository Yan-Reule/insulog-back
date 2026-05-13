const registroGlicoseRepository = require('../repositories/registroGlicoseRepository')
const userRepository = require('../repositories/userRepository')

async function listRegistrosGlicose() {
  return await registroGlicoseRepository.findAll()
}

async function getRegistroGlicoseById(id) {
  const registroGlicose = await registroGlicoseRepository.findDetalhadoById(id)

  if (!registroGlicose) {
    const error = new Error('Registro de glicose nao encontrado')
    error.statusCode = 404
    throw error
  }

  return registroGlicose
}

async function getRegistrosGlicoseByUserId(usuario) {
  const usuarioId = Number(usuario)
  const useId = Number.isNaN(usuarioId)
    ? await userRepository.findByLogin(usuario)
    : { id_usuario: usuarioId }

  if (!useId) {
    const error = new Error('Usuario nao encontrado')
    error.statusCode = 400
    throw error
  }

  const registrosGlicose = await registroGlicoseRepository.findByUserId(useId.id_usuario)

  if (!registrosGlicose || registrosGlicose.length === 0) {
    const error = new Error('Nenhum registro de glicose encontrado para este usuario')
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

function montarRegistroCompleto(data, registroAtual = {}) {
  const id_usuario = data.id_usuario ?? registroAtual.id_usuario
  const nivel_glicose = data.nivel_glicose ?? registroAtual.nivel_glicose
  const id_periodo = data.id_periodo ?? registroAtual.id_periodo
  const data_hora = data.data_hora ?? registroAtual.data_hora ?? formatarDataHoraAtual()
  const observacao = data.observacao ?? registroAtual.observacao ?? null

  return {
    id_usuario,
    nivel_glicose,
    data_hora,
    id_periodo,
    observacao
  }
}

function validarGlicoseObrigatoria(glicose) {
  if (!glicose.id_usuario || glicose.nivel_glicose === undefined || !glicose.id_periodo) {
    const error = new Error('ID do usuario, nivel de glicose e periodo sao obrigatorios')
    error.statusCode = 400
    throw error
  }
}

function normalizarInsulina(data) {
  const insulina = data.insulina

  if (insulina === null) {
    return null
  }

  if (!insulina && data.id_tipo_insulina === undefined && data.unidade_insulina === undefined) {
    return undefined
  }

  const dadosInsulina = insulina || {
    id_tipo_insulina: data.id_tipo_insulina,
    unidade_insulina: data.unidade_insulina
  }

  if (!dadosInsulina.id_tipo_insulina || dadosInsulina.unidade_insulina === undefined) {
    const error = new Error('Tipo de insulina e quantidade sao obrigatorios quando a insulina for informada')
    error.statusCode = 400
    throw error
  }

  return {
    id_tipo_insulina: dadosInsulina.id_tipo_insulina,
    unidade_insulina: dadosInsulina.unidade_insulina
  }
}

function normalizarLembrete(data, id_periodo) {
  const lembrete = data.lembrete

  if (lembrete === null) {
    return null
  }

  if (!lembrete || lembrete.criar === false) {
    return undefined
  }

  if (!lembrete.data_hora) {
    const error = new Error('Horario do lembrete e obrigatorio quando o lembrete for criado')
    error.statusCode = 400
    throw error
  }

  return {
    data_hora: lembrete.data_hora,
    id_periodo: lembrete.id_periodo || id_periodo
  }
}

async function getDashboardDados(id_usuario, dataInicio, dataFim) {
  if (!id_usuario) {
    const error = new Error('ID do usuario e obrigatorio')
    error.statusCode = 400
    throw error
  }

  if (!dataInicio || !dataFim) {
    const error = new Error('Data de inicio e fim sao obrigatorias')
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
      periodo: reg.periodo,
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
  const glicose = montarRegistroCompleto(data)
  validarGlicoseObrigatoria(glicose)

  const insulina = normalizarInsulina(data)
  const lembrete = normalizarLembrete(data, glicose.id_periodo)

  if (!insulina && !lembrete) {
    const registro = await registroGlicoseRepository.create(glicose)
    return await registroGlicoseRepository.findDetalhadoById(registro.id_registro)
  }

  const registro = await registroGlicoseRepository.createCompleto({
    glicose,
    insulina,
    lembrete
  })

  return await registroGlicoseRepository.findDetalhadoById(registro.id_registro)
}

async function updateRegistroGlicose(id, data) {
  const registroGlicose = await registroGlicoseRepository.findById(id)

  if (!registroGlicose) {
    const error = new Error('Registro de glicose nao encontrado')
    error.statusCode = 404
    throw error
  }

  const glicose = montarRegistroCompleto(data, registroGlicose)
  validarGlicoseObrigatoria(glicose)

  const insulina = normalizarInsulina(data)
  const lembrete = normalizarLembrete(data, glicose.id_periodo)

  return await registroGlicoseRepository.updateCompleto(id, {
    glicose,
    insulina,
    lembrete
  })
}

async function deleteById(id) {
  const registroGlicose = await registroGlicoseRepository.findById(id)

  if (!registroGlicose) {
    const error = new Error('Registro de glicose nao encontrado')
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
