const dataBase = require('../config/database')
const db = dataBase.pool

async function findAll() {
  const [rows] = await db.execute(
    'SELECT id_registro, id_usuario, nivel_glicose, data_hora, id_periodo FROM registroglicose ORDER BY id_registro ASC'
  )

  return rows
}

async function findById(id) {
  const [rows] = await db.execute(
    'SELECT id_registro, id_usuario, nivel_glicose, data_hora, id_periodo FROM registroglicose WHERE id_registro = ?',
    [id]
  )

  return rows[0]
}

async function create(registroGlicose) {
  const { id_usuario, nivel_glicose, data_hora, id_periodo } = registroGlicose
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const [result] = await conn.execute(
      'INSERT INTO registroglicose (id_usuario, nivel_glicose, data_hora, id_periodo) VALUES (?, ?, ?, ?)',
      [id_usuario, nivel_glicose, data_hora, id_periodo]
    )

    await conn.commit()

    return {
      id_registro: result.insertId,
      id_usuario,
      nivel_glicose,
      data_hora,
      id_periodo
    }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function update(id, registroGlicose) {
  const { id_usuario, nivel_glicose, data_hora, id_periodo } = registroGlicose
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    await conn.execute(
      'UPDATE registroglicose SET id_usuario = ?, nivel_glicose = ?, data_hora = ?, id_periodo = ? WHERE id_registro = ?',
      [id_usuario, nivel_glicose, data_hora, id_periodo, id]
    )

    await conn.commit()

    return {
      id_registro: Number(id),
      id_usuario,
      nivel_glicose,
      data_hora,
      id_periodo
    }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function deleteById(id) {
  await db.execute(
    'DELETE FROM registroglicose WHERE id_registro = ?',
    [id]
  )
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  deleteById
}
