const dataBase = require('../config/database')
const db = dataBase.pool

async function findAll() {
  const [rows] = await db.execute(
    'SELECT id_tipo_insulina, nome FROM tipoinsulina ORDER BY id_tipo_insulina ASC'
  )

  return rows
}

async function findById(id) {
  const [rows] = await db.execute(
    'SELECT id_tipo_insulina, nome FROM tipoinsulina WHERE id_tipo_insulina = ?',
    [id]
  )

  return rows[0]
}

async function deleteById(id) {
  await db.execute(
    'DELETE FROM tipoinsulina WHERE id_tipo_insulina = ?',
    [id]
  )
}

async function updateById(id, tipoInsulina) {
  const { nome } = tipoInsulina

  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    await conn.execute(
      'UPDATE tipoinsulina SET nome = ? WHERE id_tipo_insulina = ?',
      [nome, id]
    )

    await conn.commit()

    return {
      id_tipo_insulina: Number(id),
      nome
    }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function create(tipoInsulina) {
  const { nome } = tipoInsulina

  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const [result] = await conn.execute(
      'INSERT INTO tipoinsulina (nome) VALUES (?)',
      [nome]
    )

    await conn.commit()

    return {
      id_tipo_insulina: result.insertId,
      nome
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
  findById,
  create,
  updateById,
  deleteById
}
