const dataBase = require('../config/database')
const db = dataBase.pool

async function findAll() {
  const [rows] = await db.execute(
    'SELECT id_exportacao, id_usuario, data, descricao FROM exportacao ORDER BY id_exportacao ASC'
  )

  return rows
}

async function findById(id) {
  const [rows] = await db.execute(
    'SELECT id_exportacao, id_usuario, data, descricao FROM exportacao WHERE id_exportacao = ?',
    [id]
  )

  return rows[0]
}

async function create(exportacao) {
  const { id_usuario, data, descricao } = exportacao
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const [result] = await conn.execute(
      'INSERT INTO exportacao (id_usuario, data, descricao) VALUES (?, ?, ?)',
      [id_usuario, data, descricao]
    )

    await conn.commit()

    return {
      id_exportacao: result.insertId,
      id_usuario,
      data,
      descricao
    }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function update(id, exportacao) {
  const { id_usuario, data, descricao } = exportacao
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    await conn.execute(
      'UPDATE exportacao SET id_usuario = ?, data = ?, descricao = ? WHERE id_exportacao = ?',
      [id_usuario, data, descricao, id]
    )

    await conn.commit()

    return {
      id_exportacao: Number(id),
      id_usuario,
      data,
      descricao
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
    'DELETE FROM exportacao WHERE id_exportacao = ?',
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
