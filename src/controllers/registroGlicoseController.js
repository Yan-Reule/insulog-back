const registroGlicoseService = require('../services/registroGlicoseService')

async function index(req, res, next) {
  try {
    const registrosGlicose = await registroGlicoseService.listRegistrosGlicose()
    return res.status(200).json(registrosGlicose)
  } catch (error) {
    next(error)
  }
}

async function showByUserId(req, res, next) {
  try {
    const { id_usuario } = req.params
    const registrosGlicose = await registroGlicoseService.getRegistrosGlicoseByUserId(id_usuario)
    return res.status(200).json(registrosGlicose)
  } catch (error) {
    next(error)
  }
}

async function show(req, res, next) {
  try {
    const { id } = req.params
    const registroGlicose = await registroGlicoseService.getRegistroGlicoseById(id)
    return res.status(200).json(registroGlicose)
  } catch (error) {
    next(error)
  }
}

async function getDashboard(req, res, next) {
  try {
    const { id_usuario, dataInicio, dataFim } = req.query
    const dashboardDados = await registroGlicoseService.getDashboardDados(id_usuario, dataInicio, dataFim)
    return res.status(200).json(dashboardDados)
  } catch (error) {
    next(error)
  }
}

async function create(req, res, next) {
  try {
    const registroGlicose = await registroGlicoseService.createRegistroGlicose(req.body)
    return res.status(201).json(registroGlicose)
  } catch (error) {
    next(error)
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params
    const registroGlicose = await registroGlicoseService.updateRegistroGlicose(id, req.body)
    return res.status(200).json(registroGlicose)
  } catch (error) {
    next(error)
  }
}

async function deleteById(req, res, next) {
  try {
    const { id } = req.params
    await registroGlicoseService.deleteById(id)
    return res.status(204).send()
  } catch (error) {
    next(error)
  }
}

module.exports = {
  index,
  show,
  create,
  update,
  deleteById,
  showByUserId,
  getDashboard
}
