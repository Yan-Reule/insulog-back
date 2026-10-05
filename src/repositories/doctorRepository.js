const dataBase = require('../config/database')
const db = dataBase.pool

async function createInvite(idMedico, codigoHash, expiraEm) {
  await db.execute(
    'INSERT INTO codigo_vinculo_medico (id_medico, codigo_hash, expira_em) VALUES (?, ?, ?)',
    [idMedico, codigoHash, expiraEm]
  )
}

async function findPatientsByDoctor(idMedico) {
  const [rows] = await db.execute(
    `SELECT
      u.id_usuario,
      u.nome,
      u.email,
      (SELECT AVG(rg.nivel_glicose)
       FROM registroglicose rg
       WHERE rg.id_usuario = p.id_usuario
         AND rg.data_hora >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS media_glicose_7_dias,
      (SELECT COUNT(*)
       FROM registroglicose rg
       WHERE rg.id_usuario = p.id_usuario
         AND rg.data_hora >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS registros_7_dias,
      (SELECT rg.data_hora
       FROM registroglicose rg
       WHERE rg.id_usuario = p.id_usuario
       ORDER BY rg.data_hora DESC, rg.id_registro DESC
       LIMIT 1) AS ultimo_registro,
      (SELECT rg.nivel_glicose
       FROM registroglicose rg
       WHERE rg.id_usuario = p.id_usuario
       ORDER BY rg.data_hora DESC, rg.id_registro DESC
       LIMIT 1) AS ultima_glicose
    FROM paciente p
    INNER JOIN usuario u ON u.id_usuario = p.id_usuario
    WHERE p.id_medico = ?
    ORDER BY u.nome ASC`,
    [idMedico]
  )

  return rows
}

async function findPatientByDoctor(idMedico, idPaciente) {
  const [rows] = await db.execute(
    `SELECT
      u.id_usuario,
      u.nome,
      u.email,
      (SELECT AVG(rg.nivel_glicose)
       FROM registroglicose rg
       WHERE rg.id_usuario = p.id_usuario
         AND rg.data_hora >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS media_glicose_7_dias,
      (SELECT COUNT(*)
       FROM registroglicose rg
       WHERE rg.id_usuario = p.id_usuario
         AND rg.data_hora >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS registros_7_dias,
      (SELECT rg.data_hora
       FROM registroglicose rg
       WHERE rg.id_usuario = p.id_usuario
       ORDER BY rg.data_hora DESC, rg.id_registro DESC
       LIMIT 1) AS ultimo_registro,
      (SELECT rg.nivel_glicose
       FROM registroglicose rg
       WHERE rg.id_usuario = p.id_usuario
       ORDER BY rg.data_hora DESC, rg.id_registro DESC
       LIMIT 1) AS ultima_glicose
    FROM paciente p
    INNER JOIN usuario u ON u.id_usuario = p.id_usuario
    WHERE p.id_medico = ? AND p.id_usuario = ?
    LIMIT 1`,
    [idMedico, idPaciente]
  )

  return rows[0]
}

async function findPatientRecordsByDoctor(idMedico, idPaciente) {
  const [rows] = await db.execute(
    `SELECT
      rg.id_registro,
      rg.id_usuario,
      rg.nivel_glicose,
      rg.data_hora,
      p.descricao AS periodo,
      GROUP_CONCAT(
        DISTINCT CONCAT(ti.nome, ' · ', ri.unidade_insulina, 'U')
        ORDER BY ti.nome SEPARATOR ', '
      ) AS insulina
    FROM paciente paciente
    INNER JOIN registroglicose rg ON rg.id_usuario = paciente.id_usuario
    LEFT JOIN periodo p ON p.id_periodo = rg.id_periodo
    LEFT JOIN registroinsulina ri ON ri.id_registro = rg.id_registro
    LEFT JOIN tipoinsulina ti ON ti.id_tipo_insulina = ri.id_tipo_insulina
    WHERE paciente.id_medico = ? AND paciente.id_usuario = ?
    GROUP BY rg.id_registro, rg.id_usuario, rg.nivel_glicose, rg.data_hora, p.descricao
    ORDER BY rg.data_hora DESC, rg.id_registro DESC`,
    [idMedico, idPaciente]
  )

  return rows
}

module.exports = {
  createInvite,
  findPatientsByDoctor,
  findPatientByDoctor,
  findPatientRecordsByDoctor,
}
