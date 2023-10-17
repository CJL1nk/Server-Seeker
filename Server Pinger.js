const cluster = require('cluster');
const fs = require('fs');
let mcpinger = require('mcpinger');
let path = require('path');

//########################################################

// FILE AND DIR NAMES
const mainOutputFile = 'server_info.json';
const dir = 'Server Data';

const intervalTime = 25;
const maxThreads = 200;

//########################################################


// READ THE FUNCTION NAME RETARD
function generateRandomIP() {
	const getRandomNumber = () => Math.floor(Math.random() * 256);
	const ipParts = Array.from({ length: 4 }, getRandomNumber);
	return ipParts.join('.');
}


// CODE FOR THE MAIN PROCESS
if (cluster.isMaster) {

	try {

		// IMPORTING THESE PACKAGES DOWN HERE TO IMPROVE PERFORMANCE
		const axios = require('axios');
		const mineflayer = require('mineflayer');

		// TOP 10 READABLE CODE
		process.env.currentOutputFile = (new Date()).toISOString().replace(/[-T:.]/g, '_').slice(0, -5) + '.json';

		// WEBHOOK URLS OBV
		const joinableWebhookURL = 'YOUR WEBHOOK URL';
		const unjoinableWebhookURL = 'YOUR WEBHOOK URL';

		const username = 'YOUR USERNAME';
		const password = 'YOUR PASSWORD';

		var currentThreads = 0;

		// CREATE FILES IF THEY DONT EXIST
		if (!fs.existsSync(dir)) {fs.mkdirSync(dir)}
		if (!fs.existsSync(path.join(dir, process.env.currentOutputFile))) {fs.writeFileSync(path.join(dir, process.env.currentOutputFile), '[]')}
		if (!fs.existsSync(mainOutputFile)) {fs.writeFileSync((mainOutputFile), '[]')}

		// DECREMENTS NUMBER OF PROCESSES WHEN IT FINISHES
		cluster.on('exit', (worker, code, signal) => {
			currentThreads--;
		});

		// SENDS DATA TO DISCORD WEBHOOK+
		cluster.on('message', (worker, message) => {

			console.log(message.ip);

			// CREATE BOT SESSION
			const bot = mineflayer.createBot({
				host: message.ip,
				port: 25565,
				username: username,
				password: password,
				auth: 'microsoft'
			});

			// SEND MESSAGE TO JOINABLE CHANNEL IF IT WORKS
			bot.on('spawn', () => {
				console.log('Server Works');
				axios.post(joinableWebhookURL,message);
				bot.end();
			});

			// SEND MESSAGE TO UNJOINABLE CHANNEL IF IT DOESN'T
			bot.on('kicked', (reason) => {
				console.log('Bot was kicked');
				axios.post(unjoinableWebhookURL,message);
				bot.end();
			});

			bot.on('error', (err) => {
				console.log('Bot encountered error while joining');
				axios.post(unjoinableWebhookURL,message);
				bot.end();
			});
		})

		// MAKES NEW PROCESS FORK EVERY {intervalTime} MS
		setInterval(() => {
			if (currentThreads < maxThreads) {
				const worker = cluster.fork();
				currentThreads++;
			}
		}, intervalTime);

		setInterval(() => {console.log('Process Forks:', currentThreads)}, 2000)
	}
	catch(error) {console.log(error)}
}

// CODE FOR THE PROCESS FORKS
else {

	const randomIP = generateRandomIP();

	mcpinger.java({ host: randomIP }).then((res) => {

		// DELETE USELESS DATA AND PUT IP IN
		delete res.favicon;
		res.ip = randomIP;

		console.log('Server found!')
		console.log(res);

		let currentExistingData = [];
		let totalExistingData = [];

		totalExistingData = JSON.parse(fs.readFileSync(mainOutputFile));
		totalExistingData.push(res);

		currentExistingData = JSON.parse(fs.readFileSync(path.join(dir, process.env.currentOutputFile)));
		currentExistingData.push(res);

		// WRITE TO BOTH FILES
		fs.writeFileSync(mainOutputFile, JSON.stringify(totalExistingData, null, 2));+
		fs.writeFileSync(path.join(dir, process.env.currentOutputFile), JSON.stringify(currentExistingData, null, 2));

		// SEND A MESSAGE BACK TO THE MASTER PROCESS WHICH HANDLES THE WEBHOOK
		process.send({content: 'React with :white_check_mark: if this server is joinable or :x: if it\'s not', embeds: [{
			title: 'Server Found',
			color: 0x007474,
			fields: [
			{
				name: 'IP: ',
				value: randomIP,
				inline: false,
			},
			{
				name: 'Version: ',
				value: res.version,
				inline: true,
			},
			{
				name: 'Max Players:',
				value: res.maxPlayerCount,
				inline: true,
			}
			]
		}], ip: randomIP});

	})
	.catch((error) => {

		// PRINT IF THE IP SENDS A NON MINECRAFT RESPONSE
		if (error.message != 'Socket timeout') {
			console.log(`Path to ${randomIP} found with no Minecraft server`);
		}
	})
	.finally(() => {process.exit()});
}
