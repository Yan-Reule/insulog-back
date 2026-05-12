const dataBase = require('../config/database')
const db = dataBase.pool

async function findAll() {
  const [rows] = await db.execute(
    'SELECT id_alarme, id_usuario, data_hora, id_periodo, id_registro FROM alarme ORDER BY id_alarme ASC'
  )

  return rows
}

async function findById(id) {
  const [rows] = await db.execute(
    'SELECT id_alarme, id_usuario, data_hora, id_periodo, id_registro FROM alarme WHERE id_alarme = ?',
    [id]
  )

  return rows[0]
}

async function create(alarme) {
  const { id_usuario, data_hora, id_periodo, id_registro } = alarme
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const [result] = await conn.execute(
      'INSERT INTO alarme (id_usuario, data_hora, id_periodo, id_registro) VALUES (?, ?, ?, ?)',
      [id_usuario, data_hora, id_periodo || null, id_registro || null]
    )

    await conn.commit()

    return {
      id_alarme: result.insertId,
      id_usuario,
      data_hora,
      id_periodo: id_periodo || null,
      id_registro: id_registro || null
    }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function update(id, alarme) {
  const { id_usuario, data_hora, id_periodo, id_registro } = alarme
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    await conn.execute(
      'UPDATE alarme SET id_usuario = ?, data_hora = ?, id_periodo = ?, id_registro = ? WHERE id_alarme = ?',
      [id_usuario, data_hora, id_periodo || null, id_registro || null, id]
    )

    await conn.commit()

    return {
      id_alarme: Number(id),
      id_usuario,
      data_hora,
      id_periodo: id_periodo || null,
      id_registro: id_registro || null
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
    'DELETE FROM alarme WHERE id_alarme = ?',
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
