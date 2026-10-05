const test = require('node:test')
const assert = require('node:assert/strict')
const { issueToken, verifyToken } = require('../src/services/authTokenService')
const { hashInviteCode, withPatientStatus } = require('../src/services/doctorService')

const doctor = { id_usuario: 42, tipo_usuario: 'medico' }
const now = Date.UTC(2026, 9, 5, 12)

test('emits and verifies an authenticated user token', () => {
  const token = issueToken(doctor, now)

  assert.deepEqual(verifyToken(token, now + 1000), { userId: 42, role: 'medico' })
})

test('rejects expired and altered tokens', () => {
  const token = issueToken(doctor, now)
  const [header, payload, signature] = token.split('.')
  const alteredPayload = Buffer.from(JSON.stringify({ sub: 99, role: 'medico', exp: Math.floor(now / 1000) + 100 })).toString('base64url')

  assert.equal(verifyToken(token, now + 13 * 60 * 60 * 1000), null)
  assert.equal(verifyToken(`${header}.${alteredPayload}.${signature}`, now), null)
})

test('hashes invite codes case-insensitively after trimming', () => {
  assert.equal(hashInviteCode(' insu-abcd2345 '), hashInviteCode('INSU-ABCD2345'))
})

test('classifies linked patients from their latest glucose reading', () => {
  const recentReading = new Date().toISOString()
  const patient = { id_usuario: 23, nome: 'Paciente', email: 'paciente@example.com', media_glicose_7_dias: '112.5', registros_7_dias: 3, ultimo_registro: recentReading }

  assert.equal(withPatientStatus({ ...patient, ultima_glicose: null }).situacao, 'atencao')
  assert.equal(withPatientStatus({ ...patient, ultima_glicose: 60 }).situacao, 'atencao')
  assert.equal(withPatientStatus({ ...patient, ultima_glicose: 160 }).situacao, 'atencao')
  assert.equal(withPatientStatus({ ...patient, ultima_glicose: 280 }).situacao, 'critico')
  assert.equal(withPatientStatus({ ...patient, ultima_glicose: 120 }).situacao, 'adequado')
})
