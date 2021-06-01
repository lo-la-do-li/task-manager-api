const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: 'lola@task-app-by-lola',
		subject: 'Thanks for joining in!',
		text: `Welcome to the my Task App, ${name}. Let me know how it goes!`,
	});
};

const sendCancellationEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: 'lola@task-app-by-lola',
		subject: 'Sorry to see you go!',
		text: `Goodbye, ${name}. I hope to see you back sometime soon.`,
	});
};

module.exports = {
	sendWelcomeEmail,
	sendCancellationEmail,
};
