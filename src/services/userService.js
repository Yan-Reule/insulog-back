const userRepository = require('../repositories/userRepository')

async function listUsers() {
  return await userRepository.findAll()
}

async function getUserById(id) {
  const user = await userRepository.findById(id)

  if (!user) {
    const error = new Error('Usuário não encontrado')
    error.statusCode = 404
    throw error
  }

  return user
}

async function getUsersByType(tipo_usuario) {
  const users = await userRepository.findByType(tipo_usuario)
  return users
}

async function deleteById(id) {
  const user = await userRepository.findById(id)

  if (!user) {
    const error = new Error('Usuário não encontrado')
    error.statusCode = 404
    throw error
  }

  await userRepository.deleteById(id)
}

async function createUser(data) {
  const { nome, email, senha, tipo_login, tipo_usuario, id_medico, crm } = data

  console.log('createUser:', data)

  if (!nome || !email || !senha || !tipo_login || !tipo_usuario) {
    const error = new Error('Todos os campos são obrigatórios')
    error.statusCode = 400
    throw error
  }

  const tipoNormalizado = tipo_usuario.toLowerCase()

  if (!['medico', 'paciente'].includes(tipoNormalizado)) {
    const error = new Error('tipo_usuario inválido')
    error.statusCode = 400
    throw error
  }

  if (tipoNormalizado === 'paciente' && !id_medico) {
    const error = new Error('id_medico é obrigatório para usuários do tipo paciente')
    error.statusCode = 400
    throw error
  }

  if (tipoNormalizado === 'medico' && !crm) {
    const error = new Error('crm é obrigatório para usuários do tipo médico')
    error.statusCode = 400
    throw error
  }

  const userExists = await userRepository.findByEmail(email)

  if (userExists) {
    const error = new Error('Já existe um usuário com esse e-mail')
    error.statusCode = 409
    throw error
  }

  return await userRepository.create({ nome, email, senha, tipo_login, tipo_usuario, id_medico, crm }, tipoNormalizado)
}

async function updateUser(id, data) {
  const { nome, email, senha, tipo_login, tipo_usuario, id_medico, crm } = data

  if (!nome || !email || !senha || !tipo_login || !tipo_usuario) {
    const error = new Error('Todos os campos são obrigatórios')
    error.statusCode = 400
    throw error
  }

  return await userRepository.update(id, { nome, email, senha, tipo_login, tipo_usuario, id_medico, crm })

}

module.exports = {
  listUsers,
  getUserById,
  createUser,
  getUsersByType,
  deleteById,
  updateUser
}