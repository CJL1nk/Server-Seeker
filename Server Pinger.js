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


function generateRandomIP() {
	const getRandomNumber = () => Math.floor(Math.random() * 256);
	const ipParts = Array.from({ length: 4 }, getRandomNumber);
	return ipParts.join('.');
}


// CODE FOR THE MAIN PROCESS
if (cluster.isMaster) {

	try {

		// TOP 10 READABLE CODE
		process.env.currentOutputFile = (new Date()).toISOString().replace(/[-T:.]/g, '_').slice(0, -5) + '.json';
		var currentThreads = 0;

		// CREATE FILES IF THEY DONT EXIST
		if (!fs.existsSync(dir)) {fs.mkdirSync(dir)}
		if (!fs.existsSync(path.join(dir, process.env.currentOutputFile))) {fs.writeFileSync(path.join(dir, process.env.currentOutputFile), '[]')}
		if (!fs.existsSync(mainOutputFile)) {fs.writeFileSync((mainOutputFile), '[]')}

		// DECREMENTS NUMBER OF PROCESSES WHEN IT FINISHES
		cluster.on('exit', (worker, code, signal) => {
			currentThreads--;
		});

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

	})
	.catch((error) => {

		// PRINT IF THE IP SENDS A NON MINECRAFT RESPONSE
		if (error.message != 'Socket timeout') {
			console.log(`Path to ${randomIP} found with no Minecraft server`);
		}
	})
	.finally(() => {process.exit()});
}
