const dataBase = require('../config/database')
const db = dataBase.pool

async function findAll() {
  const [rows] = await db.execute(
    'SELECT id_registro, id_usuario, nivel_glicose, data_hora, id_periodo, observacao FROM registroglicose ORDER BY id_registro ASC'
  )

  return rows
}

async function findById(id) {
  const [rows] = await db.execute(
    'SELECT id_registro, id_usuario, nivel_glicose, data_hora, id_periodo, observacao FROM registroglicose WHERE id_registro = ?',
    [id]
  )

  return rows[0]
}

async function findDetalhadoById(id) {
  const [rows] = await db.execute(
    `SELECT
      rg.id_registro,
      rg.id_usuario,
      rg.nivel_glicose,
      rg.data_hora,
      rg.id_periodo,
      rg.observacao,
      p.descricao AS periodo_descricao,
      ri.id_registro_insulina,
      ri.id_tipo_insulina,
      ri.unidade_insulina,
      ti.nome AS tipo_insulina_nome,
      a.id_alarme,
      a.data_hora AS lembrete_data_hora,
      a.id_periodo AS lembrete_id_periodo,
      pl.descricao AS lembrete_periodo_descricao
    FROM registroglicose rg
    LEFT JOIN periodo p ON p.id_periodo = rg.id_periodo
    LEFT JOIN registroinsulina ri ON ri.id_registro = rg.id_registro
    LEFT JOIN tipoinsulina ti ON ti.id_tipo_insulina = ri.id_tipo_insulina
    LEFT JOIN alarme a ON a.id_registro = rg.id_registro
    LEFT JOIN periodo pl ON pl.id_periodo = a.id_periodo
    WHERE rg.id_registro = ?`,
    [id]
  )

  const row = rows[0]

  if (!row) {
    return undefined
  }

  return formatarRegistroDetalhado(row)
}

async function findByUserId(id_usuario) {
  const [rows] = await db.execute(
    'SELECT id_registro, id_usuario, nivel_glicose, data_hora, id_periodo, observacao FROM registroglicose WHERE id_usuario = ? ORDER BY data_hora DESC',
    [id_usuario]
  )

  return rows
}

async function create(registroGlicose) {
  const { id_usuario, nivel_glicose, data_hora, id_periodo, observacao } = registroGlicose
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const [result] = await conn.execute(
      'INSERT INTO registroglicose (id_usuario, nivel_glicose, data_hora, id_periodo, observacao) VALUES (?, ?, ?, ?, ?)',
      [id_usuario, nivel_glicose, data_hora, id_periodo, observacao ?? null]
    )

    await conn.commit()

    return {
      id_registro: result.insertId,
      id_usuario,
      nivel_glicose,
      data_hora,
      id_periodo,
      observacao: observacao ?? null
    }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function createCompleto(registro) {
  const { glicose, insulina, lembrete } = registro
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    const [registroResult] = await conn.execute(
      'INSERT INTO registroglicose (id_usuario, nivel_glicose, data_hora, id_periodo, observacao) VALUES (?, ?, ?, ?, ?)',
      [
        glicose.id_usuario,
        glicose.nivel_glicose,
        glicose.data_hora,
        glicose.id_periodo,
        glicose.observacao ?? null
      ]
    )

    const idRegistro = registroResult.insertId
    let registroInsulina = null
    let registroLembrete = null

    if (insulina) {
      const [insulinaResult] = await conn.execute(
        'INSERT INTO registroinsulina (id_registro, id_tipo_insulina, unidade_insulina) VALUES (?, ?, ?)',
        [idRegistro, insulina.id_tipo_insulina, insulina.unidade_insulina]
      )

      registroInsulina = {
        id_registro_insulina: insulinaResult.insertId,
        id_registro: idRegistro,
        id_tipo_insulina: insulina.id_tipo_insulina,
        unidade_insulina: insulina.unidade_insulina
      }
    }

    if (lembrete) {
      const [lembreteResult] = await conn.execute(
        'INSERT INTO alarme (id_usuario, data_hora, id_periodo, id_registro) VALUES (?, ?, ?, ?)',
        [glicose.id_usuario, lembrete.data_hora, lembrete.id_periodo, idRegistro]
      )

      registroLembrete = {
        id_alarme: lembreteResult.insertId,
        id_usuario: glicose.id_usuario,
        data_hora: lembrete.data_hora,
        id_periodo: lembrete.id_periodo,
        id_registro: idRegistro
      }
    }

    await conn.commit()

    return {
      id_registro: idRegistro,
      id_usuario: glicose.id_usuario,
      nivel_glicose: glicose.nivel_glicose,
      data_hora: glicose.data_hora,
      id_periodo: glicose.id_periodo,
      observacao: glicose.observacao ?? null,
      insulina: registroInsulina,
      lembrete: registroLembrete
    }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function update(id, registroGlicose) {
  const { id_usuario, nivel_glicose, data_hora, id_periodo, observacao } = registroGlicose
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    await conn.execute(
      'UPDATE registroglicose SET id_usuario = ?, nivel_glicose = ?, data_hora = ?, id_periodo = ?, observacao = ? WHERE id_registro = ?',
      [id_usuario, nivel_glicose, data_hora, id_periodo, observacao ?? null, id]
    )

    await conn.commit()

    return {
      id_registro: Number(id),
      id_usuario,
      nivel_glicose,
      data_hora,
      id_periodo,
      observacao: observacao ?? null
    }
  } catch (error) {
    await conn.rollback()
    throw error
  } finally {
    conn.release()
  }
}

async function updateCompleto(id, registro) {
  const { glicose, insulina, lembrete } = registro
  const conn = await db.getConnection()
  let committed = false

  try {
    await conn.beginTransaction()

    await conn.execute(
      'UPDATE registroglicose SET id_usuario = ?, nivel_glicose = ?, data_hora = ?, id_periodo = ?, observacao = ? WHERE id_registro = ?',
      [
        glicose.id_usuario,
        glicose.nivel_glicose,
        glicose.data_hora,
        glicose.id_periodo,
        glicose.observacao ?? null,
        id
      ]
    )

    if (insulina === null) {
      await conn.execute(
        'DELETE FROM registroinsulina WHERE id_registro = ?',
        [id]
      )
    } else if (insulina) {
      const [rows] = await conn.execute(
        'SELECT id_registro_insulina FROM registroinsulina WHERE id_registro = ? LIMIT 1',
        [id]
      )

      if (rows[0]) {
        await conn.execute(
          'UPDATE registroinsulina SET id_tipo_insulina = ?, unidade_insulina = ? WHERE id_registro_insulina = ?',
          [insulina.id_tipo_insulina, insulina.unidade_insulina, rows[0].id_registro_insulina]
        )
      } else {
        await conn.execute(
          'INSERT INTO registroinsulina (id_registro, id_tipo_insulina, unidade_insulina) VALUES (?, ?, ?)',
          [id, insulina.id_tipo_insulina, insulina.unidade_insulina]
        )
      }
    }

    if (lembrete === null) {
      await conn.execute(
        'DELETE FROM alarme WHERE id_registro = ?',
        [id]
      )
    } else if (lembrete) {
      const [rows] = await conn.execute(
        'SELECT id_alarme FROM alarme WHERE id_registro = ? LIMIT 1',
        [id]
      )

      if (rows[0]) {
        await conn.execute(
          'UPDATE alarme SET id_usuario = ?, data_hora = ?, id_periodo = ? WHERE id_alarme = ?',
          [glicose.id_usuario, lembrete.data_hora, lembrete.id_periodo, rows[0].id_alarme]
        )
      } else {
        await conn.execute(
          'INSERT INTO alarme (id_usuario, data_hora, id_periodo, id_registro) VALUES (?, ?, ?, ?)',
          [glicose.id_usuario, lembrete.data_hora, lembrete.id_periodo, id]
        )
      }
    }

    await conn.commit()
    committed = true
  } catch (error) {
    if (!committed) {
      await conn.rollback()
    }
    throw error
  } finally {
    conn.release()
  }

  return await findDetalhadoById(id)
}

async function deleteById(id) {
  const conn = await db.getConnection()

  try {
    await conn.beginTransaction()

    await conn.execute(
      'DELETE FROM alarme WHERE id_registro = ?',
      [id]
    )

    await conn.execute(
      'DELETE FROM registroinsulina WHERE id_registro = ?',
      [id]
    )

    await conn.execute(
      'DELETE FROM registroglicose WHERE id_registro = ?',
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

async function findByUserIdAndPeriod(id_usuario, dataInicio, dataFim) {
  const [rows] = await db.execute(
    'SELECT id_registro, id_usuario, nivel_glicose, data_hora, id_periodo, observacao FROM registroglicose WHERE id_usuario = ? AND data_hora BETWEEN ? AND ? ORDER BY data_hora DESC',
    [id_usuario, dataInicio, dataFim]
  )

  return rows
}

function formatarRegistroDetalhado(row) {
  return {
    id_registro: row.id_registro,
    id_usuario: row.id_usuario,
    nivel_glicose: row.nivel_glicose,
    data_hora: row.data_hora,
    id_periodo: row.id_periodo,
    observacao: row.observacao,
    periodo: {
      id_periodo: row.id_periodo,
      descricao: row.periodo_descricao
    },
    insulina: row.id_registro_insulina
      ? {
          id_registro_insulina: row.id_registro_insulina,
          id_registro: row.id_registro,
          id_tipo_insulina: row.id_tipo_insulina,
          tipo_insulina: row.tipo_insulina_nome,
          unidade_insulina: row.unidade_insulina
        }
      : null,
    lembrete: row.id_alarme
      ? {
          id_alarme: row.id_alarme,
          id_usuario: row.id_usuario,
          data_hora: row.lembrete_data_hora,
          id_periodo: row.lembrete_id_periodo,
          periodo: row.lembrete_periodo_descricao,
          id_registro: row.id_registro
        }
      : null
  }
}

module.exports = {
  findAll,
  findById,
  findDetalhadoById,
  create,
  createCompleto,
  update,
  updateCompleto,
  deleteById,
  findByUserId,
  findByUserIdAndPeriod
}
