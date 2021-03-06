const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const {
	sendWelcomeEmail,
	sendCancellationEmail,
} = require('../emails/account');
const router = new express.Router();

// USER API ENDPOINTS ------------------------------------

// TEST ENDPOINT

router.get('/', (req, res) => {
	try {
		res.send(
			JSON.stringify('You connected to the Task App API!')
		);
	} catch (e) {
		res.status(500).send(e);
	}
});
// CREATE USER
router.post('/users', async (req, res) => {
	const user = new User(req.body);

	try {
		await user.save();
		sendWelcomeEmail(user.email, user.name);
		const token = await user.generateAuthToken();
		// res.cookie('auth_token', token);
		res.status(201).send({ user, token });
	} catch (e) {
		res.status(400).send(e);
	}
});

// LOGIN EXISTING USER
router.post('/users/login', async (req, res) => {
	try {
		const user = await User.findByCredentials(
			req.body.email,
			req.body.password
		);
		const token = await user.generateAuthToken();
		// res.cookie('auth_token', token);
		res.send({ user, token });
	} catch (e) {
		res.status(400).send(e.message);
	}
});

// LOGOUT SINGLE SESSION
router.post('/users/logout', auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter(
			(token) => token.token !== req.token
		);
		await req.user.save();
		// res.clearCookie(token);
		res.status(200).send(JSON.stringify('You have successfully logged out'));
	} catch (e) {
		res.status(500).send(e);
	}
});

// LOGOUT ALL SESSIONS
router.post('/users/logoutAll', auth, async (req, res) => {
	try {
		req.user.tokens = [];
		await req.user.save();
		res.send();
	} catch (e) {
		res.status(500).send();
	}
});

// GET AUTHENTICATED USER PROFILE
router.get('/users/me', auth, async (req, res) => {
	res.send(req.user);
});

// UPDATE USER BY ID

router.patch('/users/me', auth, async (req, res) => {
	const updates = Object.keys(req.body);
	const allowedUpdates = ['name', 'email', 'password', 'age'];
	const isValidOperation = updates.every((update) =>
		allowedUpdates.includes(update)
	);

	if (!isValidOperation) {
		return res.status(400).send({ error: 'Invalid updates!' });
	}

	try {
		updates.forEach((update) => (req.user[update] = req.body[update]));

		await req.user.save();

		res.send(req.user);
	} catch (e) {
		res.status(400).send(e);
	}
});

// DELETE USER
router.delete('/users/me', auth, async (req, res) => {
	try {
		await req.user.remove();
		sendCancellationEmail(req.user.email, req.user.name);
		res.send(req.user);
	} catch (e) {
		res.status(500).send(e);
	}
});

// UPLOAD USER AVATAR

const upload = multer({
	limits: {
		fileSize: 3000000,
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
			return cb(new Error("Please upload an image"));
		}
		cb(undefined, true);
	},
});

router.post(
	'/users/me/avatar',
	auth,
	upload.single('avatar'),
	async (req, res) => {
		const buffer = await sharp(req.file.buffer)
			.resize({ width: 250, height: 250 })
			.png()
			.toBuffer();
		req.user.avatar = buffer;
		await req.user.save();
		res.send('Image uploaded');
	},
	(error, req, res, next) => {
		res.status(400).send(JSON.stringify(error.message));
	}
);

// DELETE USER AVATAR

router.delete('/users/me/avatar', auth, async (req, res) => {
	req.user.avatar = undefined;
	await req.user.save();
	res.send();
});

// GET USER AVATAR

router.get('/users/:id/avatar', async (req, res) => {
	try {
		const user = await User.findById(req.params.id);

		if (!user || !user.avatar) {
			throw new Error("User has not uploaded an image");
		}

		res.set('Content-Type', 'image/png');
    
		res.send(user.avatar);
	} catch (e) {
    
		res.status(404).send({error: e.message});
	}
});

module.exports = router;
