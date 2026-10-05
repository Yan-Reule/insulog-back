const { verifyToken } = require('../services/authTokenService')
const { pool } = require('../config/database')

function requireAuth(req, res, next) {
  const authorization = req.get('authorization') || ''
  const [scheme, token] = authorization.split(' ')
  const user = scheme === 'Bearer' ? verifyToken(token) : null

  if (!user) {
    return res.status(401).json({ message: 'Autenticacao obrigatoria.' })
  }

  req.auth = user
  return next()
}

function requireDoctor(req, res, next) {
  if (req.auth?.role !== 'medico') {
    return res.status(403).json({ message: 'Acesso exclusivo para medicos.' })
  }

  return next()
}

function requirePatient(req, res, next) {
  if (req.auth?.role !== 'paciente') {
    return res.status(403).json({ message: 'Acesso exclusivo para pacientes.' })
  }

  return next()
}

function requireOwnUserId(req, res, next) {
  const requestedId = Number(req.params.id_usuario ?? req.query.id_usuario ?? req.body?.id_usuario)

  if (!Number.isInteger(requestedId) || requestedId !== req.auth.userId) {
    return res.status(403).json({ message: 'Acesso negado aos dados de outro usuario.' })
  }

  return next()
}

async function requireOwnedGlucoseRecord(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT id_usuario FROM registroglicose WHERE id_registro = ? LIMIT 1',
      [req.params.id]
    )
    if (!rows[0] || Number(rows[0].id_usuario) !== req.auth.userId) {
      return res.status(404).json({ message: 'Registro nao encontrado.' })
    }
    if (req.body?.id_usuario && Number(req.body.id_usuario) !== req.auth.userId) {
      return res.status(403).json({ message: 'O registro nao pode ser transferido para outro usuario.' })
    }
    return next()
  } catch (error) {
    return next(error)
  }
}

async function requireOwnedGlucoseReference(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT id_usuario FROM registroglicose WHERE id_registro = ? LIMIT 1',
      [req.body?.id_registro]
    )
    if (!rows[0] || Number(rows[0].id_usuario) !== req.auth.userId) {
      return res.status(404).json({ message: 'Registro de glicose nao encontrado.' })
    }
    return next()
  } catch (error) {
    return next(error)
  }
}

async function requireOwnedInsulinRecord(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT rg.id_usuario
       FROM registroinsulina ri
       INNER JOIN registroglicose rg ON rg.id_registro = ri.id_registro
       WHERE ri.id_registro_insulina = ?
       LIMIT 1`,
      [req.params.id]
    )
    if (!rows[0] || Number(rows[0].id_usuario) !== req.auth.userId) {
      return res.status(404).json({ message: 'Registro de insulina nao encontrado.' })
    }
    return next()
  } catch (error) {
    return next(error)
  }
}

module.exports = {
  requireAuth,
  requireDoctor,
  requirePatient,
  requireOwnUserId,
  requireOwnedGlucoseRecord,
  requireOwnedGlucoseReference,
  requireOwnedInsulinRecord,
}
