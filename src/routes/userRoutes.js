const express = require('express');
const userController = require('../controllers/userController')

const router = express.Router();
const patientLinkAttempts = new Map()

function limitPatientLinkAttempts(req, res, next) {
	if (String(req.body?.tipo_usuario).toLowerCase() !== 'paciente') return next()

	const now = Date.now()
	const windowMs = 15 * 60 * 1000
	const key = req.ip || req.socket.remoteAddress || 'unknown'
	const recentAttempts = (patientLinkAttempts.get(key) || []).filter((time) => now - time < windowMs)

	if (recentAttempts.length >= 10) {
		return res.status(429).json({ message: 'Muitas tentativas de vinculo. Tente novamente em alguns minutos.' })
	}

	recentAttempts.push(now)
	patientLinkAttempts.set(key, recentAttempts)
	return next()
}

console.log('opa: '+router);

router.get('/', userController.index);
router.get('/:id', userController.show);
router.get('/:tipo_usuario', userController.showByType);

router.post('/', limitPatientLinkAttempts, userController.create);
router.delete('/:id', userController.deleteById);
router.put('/:id', userController.update);

module.exports = router;