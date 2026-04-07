const dataBase = require('../config/database')
const db = dataBase.pool

async function findAll() {
  const [rows] = await db.execute(
    'SELECT id_registro_insulina, id_registro, id_tipo_insulina, unidade_insulina FROM registroinsulina ORDER BY id_registro_insulina ASC'
  )

  return rows
}

async function findById(id) {
  const [rows] = await db.execute(
    'SELECT id_registro_insulina, id_registro, id_tipo_insulina, unidade_insulina FROM registroinsulina WHERE id_registro_insulina = ?',
    [id]
  )

  return rows[0]
}

async function create(registroInsulina) {
  const { id_registro, id_tipo_insulina, unidade_insulina } = registroInsulina
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const [result] = await conn.execute(
      'INSERT INTO registroinsulina (id_registro, id_tipo_insulina, unidade_insulina) VALUES (?, ?, ?)',
      [id_registro, id_tipo_insulina, unidade_insulina]
    )

    await conn.commit()

    return {
      id_registro_insulina: result.insertId,
      id_registro,
      id_tipo_insulina,
      unidade_insulina
    }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function update(id, registroInsulina) {
  const { id_registro, id_tipo_insulina, unidade_insulina } = registroInsulina
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    await conn.execute(
      'UPDATE registroinsulina SET id_registro = ?, id_tipo_insulina = ?, unidade_insulina = ? WHERE id_registro_insulina = ?',
      [id_registro, id_tipo_insulina, unidade_insulina, id]
    )

    await conn.commit()

    return {
      id_registro_insulina: Number(id),
      id_registro,
      id_tipo_insulina,
      unidade_insulina
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
    'DELETE FROM registroinsulina WHERE id_registro_insulina = ?',
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
