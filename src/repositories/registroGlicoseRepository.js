const dataBase = require('../config/database')
const db = dataBase.pool

async function findAll() {
  const [rows] = await db.execute(
    `SELECT rg.id_registro, rg.id_usuario, rg.nivel_glicose, rg.data_hora, p.descricao AS periodo
     FROM registroglicose rg
     LEFT JOIN periodo p ON p.id_periodo = rg.id_periodo
     ORDER BY rg.id_registro ASC`
  )

  return rows
}

async function findById(id) {
  const [rows] = await db.execute(
    `SELECT rg.id_registro, rg.id_usuario, rg.nivel_glicose, rg.data_hora, p.descricao AS periodo
     FROM registroglicose rg
     LEFT JOIN periodo p ON p.id_periodo = rg.id_periodo
     WHERE rg.id_registro = ?`,
    [id]
  )

  return rows[0]
}

async function findByUserId(id_usuario) {
  const [rows] = await db.execute(
    `SELECT rg.id_registro, rg.id_usuario, rg.nivel_glicose, rg.data_hora, p.descricao AS periodo
     FROM registroglicose rg
     LEFT JOIN periodo p ON p.id_periodo = rg.id_periodo
     WHERE rg.id_usuario = ?
     ORDER BY rg.data_hora DESC`,
    [id_usuario]
  )

  return rows
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

    const [rows] = await conn.execute(
      `SELECT rg.id_registro, rg.id_usuario, rg.nivel_glicose, rg.data_hora, p.descricao AS periodo
       FROM registroglicose rg
       LEFT JOIN periodo p ON p.id_periodo = rg.id_periodo
       WHERE rg.id_registro = ?`,
      [result.insertId]
    )

    await conn.commit()

    return rows[0]
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

    const [rows] = await conn.execute(
      `SELECT rg.id_registro, rg.id_usuario, rg.nivel_glicose, rg.data_hora, p.descricao AS periodo
       FROM registroglicose rg
       LEFT JOIN periodo p ON p.id_periodo = rg.id_periodo
       WHERE rg.id_registro = ?`,
      [id]
    )

    await conn.commit()

    return rows[0]
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

async function findByUserIdAndPeriod(id_usuario, dataInicio, dataFim) {
  const [rows] = await db.execute(
    `SELECT rg.id_registro, rg.id_usuario, rg.nivel_glicose, rg.data_hora, p.descricao AS periodo
     FROM registroglicose rg
     LEFT JOIN periodo p ON p.id_periodo = rg.id_periodo
     WHERE rg.id_usuario = ? AND rg.data_hora BETWEEN ? AND ?
     ORDER BY rg.data_hora DESC`,
    [id_usuario, dataInicio, dataFim]
  )

  return rows
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  deleteById,
  findByUserId,
  findByUserIdAndPeriod
}
