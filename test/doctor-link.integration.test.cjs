const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const app = require('../src/app')
const { pool } = require('../src/config/database')
const { issueToken } = require('../src/services/authTokenService')
const { hashInviteCode } = require('../src/services/doctorService')

test('links a patient to one doctor with a single-use invitation', async (t) => {
  const [doctors] = await pool.execute('SELECT id_usuario FROM medico ORDER BY id_usuario LIMIT 1')
  if (!doctors[0]) return t.skip('No doctor account is available in the test database.')

  const doctorId = Number(doctors[0].id_usuario)
  const doctorToken = issueToken({ id_usuario: doctorId, tipo_usuario: 'medico' })
  const suffix = crypto.randomBytes(8).toString('hex')
  const email = `doctor-link-${suffix}@example.invalid`
  let server
  let inviteHash
  const patientIds = []

  try {
    server = app.listen(0, '127.0.0.1')
    await new Promise((resolve) => server.once('listening', resolve))
    const baseUrl = `http://127.0.0.1:${server.address().port}`

    const inviteResponse = await fetch(`${baseUrl}/medicos/vinculos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${doctorToken}` },
    })
    assert.equal(inviteResponse.status, 201)
    const invite = await inviteResponse.json()
    inviteHash = hashInviteCode(invite.codigo)

    const account = {
      nome: 'Paciente temporario de teste',
      email,
      senha: 'temporary-test-password',
      tipo_login: 'email',
      tipo_usuario: 'paciente',
    }
    const registrationResponse = await fetch(`${baseUrl}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(account),
    })
    assert.equal(registrationResponse.status, 201)
    const patientId = (await registrationResponse.json()).id
    patientIds.push(patientId)

    const [patientRows] = await pool.execute(
      'SELECT id_medico FROM paciente WHERE id_usuario = ?',
      [patientId]
    )
    assert.equal(patientRows[0]?.id_medico, null)

    const patientToken = issueToken({ id_usuario: patientId, tipo_usuario: 'paciente' })
    const initialLinkResponse = await fetch(`${baseUrl}/pacientes/vinculo`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    })
    assert.equal(initialLinkResponse.status, 200)
    assert.deepEqual(await initialLinkResponse.json(), { vinculado: false, medico: null })

    const redeemResponse = await fetch(`${baseUrl}/pacientes/vinculo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo_vinculo: invite.codigo }),
    })
    assert.equal(redeemResponse.status, 200)

    const [linkedRows] = await pool.execute(
      'SELECT id_medico FROM paciente WHERE id_usuario = ?',
      [patientId]
    )
    assert.equal(Number(linkedRows[0]?.id_medico), doctorId)

    const ownRecords = await fetch(`${baseUrl}/registros-glicose/usuario/${patientId}`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    })
    assert.equal(ownRecords.status, 404)

    const otherPatientRecords = await fetch(`${baseUrl}/registros-glicose/usuario/${patientId + 1}`, {
      headers: { Authorization: `Bearer ${patientToken}` },
    })
    assert.equal(otherPatientRecords.status, 403)

    const doctorPatientRecords = await fetch(`${baseUrl}/registros-glicose/usuario/${patientId}`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    })
    assert.equal(doctorPatientRecords.status, 403)

    const secondRegistration = await fetch(`${baseUrl}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...account, email: `second-${suffix}@example.invalid` }),
    })
    assert.equal(secondRegistration.status, 201)
    const secondPatientId = (await secondRegistration.json()).id
    patientIds.push(secondPatientId)
    const reusedInviteResponse = await fetch(`${baseUrl}/pacientes/vinculo`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${issueToken({ id_usuario: secondPatientId, tipo_usuario: 'paciente' })}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo_vinculo: invite.codigo }),
    })
    assert.equal(reusedInviteResponse.status, 400)

    const patientsResponse = await fetch(`${baseUrl}/medicos/pacientes`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    })
    assert.equal(patientsResponse.status, 200)
    const patients = await patientsResponse.json()
    assert.ok(patients.some((patient) => patient.id === patientId))

    const recordsResponse = await fetch(`${baseUrl}/medicos/pacientes/${patientId}/registros`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    })
    assert.equal(recordsResponse.status, 200)
    assert.deepEqual(await recordsResponse.json(), [])
  } finally {
    for (const patientId of patientIds) {
      await pool.execute('DELETE FROM paciente WHERE id_usuario = ?', [patientId])
      await pool.execute('DELETE FROM usuario WHERE id_usuario = ?', [patientId])
    }
    if (inviteHash) {
      await pool.execute('DELETE FROM codigo_vinculo_medico WHERE codigo_hash = ?', [inviteHash])
    }
    if (server) await new Promise((resolve) => server.close(resolve))
  }
})

test.after(async () => {
  await pool.end()
})
