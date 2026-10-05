const dataBase = require('../config/database')
const db = dataBase.pool

async function findAll() {
  const [rows] = await db.execute(
    'SELECT * FROM usuario ORDER BY id_usuario ASC'
  )

  return rows
}

async function deleteById(id) {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    await conn.execute(
      'DELETE FROM paciente WHERE id_usuario = ?',
      [id]
    )

    await conn.execute(
      'DELETE FROM medico WHERE id_usuario = ?',
      [id]
    )

    await conn.execute(
      'DELETE FROM usuario WHERE id_usuario = ?',
      [id]
    )

    await conn.commit()
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function findById(id) {
  const [rows] = await db.execute(
    'SELECT id_usuario, nome, email, tipo_login, tipo_usuario FROM usuario WHERE id_usuario = ?',
    [id]
  )

  return rows[0]
}

async function findByEmail(email) {
  const [rows] = await db.execute(
    'SELECT id_usuario, nome, email, tipo_login, tipo_usuario FROM usuario WHERE email = ?',
    [email]
  )

  return rows[0]
}

async function findByLogin(username) {
  const [rows] = await db.execute(
    `SELECT id_usuario, nome, email, senha, tipo_login, tipo_usuario
     FROM usuario
     WHERE email = ? OR nome = ?
     LIMIT 1`,
    [username, username]
  )

  return rows[0]
}

async function findByType(tipo_usuario) {
  const [rows] = await db.execute(
    'SELECT id_usuario, nome, email, tipo_login, tipo_usuario FROM usuario WHERE tipo_usuario = ?',
    [tipo_usuario]
  )

  return rows
}

async function create(user, tipoNormalizado) {
  const { nome, email, senha, tipo_login, tipo_usuario, crm } = user

  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const [result] = await conn.execute(
      'INSERT INTO usuario (nome, email, senha, tipo_login, tipo_usuario) VALUES (?, ?, ?, ?, ?)',
      [nome, email, senha, tipo_login, tipo_usuario]
    )

    const idUsuario = result.insertId

    if (tipoNormalizado === 'medico') {
      await conn.execute(
        `INSERT INTO medico (id_usuario, crm) VALUES (?, ?)`,
        [idUsuario, crm]
      )
    }

    if (tipoNormalizado === 'paciente') {
      await conn.execute(
        'INSERT INTO paciente (id_usuario, id_medico) VALUES (?, NULL)',
        [idUsuario]
      )
    }

    await conn.commit()

    return {
      id: idUsuario,
      nome,
      email
    }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function redeemPatientInvite(idPaciente, codigoHash) {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const [patients] = await conn.execute(
      'SELECT id_medico FROM paciente WHERE id_usuario = ? FOR UPDATE',
      [idPaciente]
    )

    if (!patients[0]) {
      const error = new Error('Conta de paciente nao encontrada.')
      error.statusCode = 404
      throw error
    }

    if (patients[0].id_medico !== null) {
      const error = new Error('Este paciente ja esta vinculado a um medico.')
      error.statusCode = 409
      throw error
    }

    const [invites] = await conn.execute(
      `SELECT id_codigo, id_medico
       FROM codigo_vinculo_medico
       WHERE codigo_hash = ? AND resgatado_em IS NULL AND expira_em > NOW()
       FOR UPDATE`,
      [codigoHash]
    )

    if (!invites[0]) {
      const error = new Error('Codigo de vinculo invalido, expirado ou ja utilizado.')
      error.statusCode = 400
      throw error
    }

    const [linkResult] = await conn.execute(
      'UPDATE paciente SET id_medico = ? WHERE id_usuario = ? AND id_medico IS NULL',
      [invites[0].id_medico, idPaciente]
    )

    if (linkResult.affectedRows !== 1) {
      const error = new Error('Este paciente ja esta vinculado a um medico.')
      error.statusCode = 409
      throw error
    }

    const [consumeResult] = await conn.execute(
      'UPDATE codigo_vinculo_medico SET resgatado_em = NOW(), id_paciente = ? WHERE id_codigo = ? AND resgatado_em IS NULL',
      [idPaciente, invites[0].id_codigo]
    )

    if (consumeResult.affectedRows !== 1) {
      const error = new Error('Este codigo de vinculo ja foi utilizado.')
      error.statusCode = 400
      throw error
    }

    await conn.commit()

    return {
      id_paciente: idPaciente,
      id_medico: Number(invites[0].id_medico),
    }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function findDoctorForPatient(idPaciente) {
  const [rows] = await db.execute(
    `SELECT p.id_medico, u.nome, u.email, m.crm
     FROM paciente p
     LEFT JOIN usuario u ON u.id_usuario = p.id_medico
     LEFT JOIN medico m ON m.id_usuario = p.id_medico
     WHERE p.id_usuario = ?
     LIMIT 1`,
    [idPaciente]
  )

  return rows[0]
}

async function update(id, user) {
  const { nome, email, senha, tipo_login, tipo_usuario, id_medico, crm } = user

  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    await conn.execute(
      'UPDATE usuario SET nome = ?, email = ?, senha = ?, tipo_login = ?, tipo_usuario = ? WHERE id_usuario = ?',
      [nome, email, senha, tipo_login, tipo_usuario, id]
    )
    await conn.commit()

     return {
      id: id,
      nome,
      email
    }

  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

module.exports = {
  findAll,
  findByEmail,
  findByLogin,
  findById,
  create,
  redeemPatientInvite,
  findDoctorForPatient,
  findByType,
  deleteById,
  update
}
