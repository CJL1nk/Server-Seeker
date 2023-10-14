const cluster = require('cluster');
const fs = require('fs');
let mcpinger = require('mcpinger');
let path = require('path');

//########################################################

// SET TO TRUE IF YOU WANT TO LOG ALL IPS FOUND, EVEN IF NO MINECRAFT SERVER RESPONSE
let logIPS = false;

// FILE AND DIR NAMES
const mainOutputFile = 'server_info.json';
const dir = 'Server Data';

const intervalTime = 25;
const maxThreads = 200;

var currentThreads = 0;

//########################################################

// CREATE FILES IF THEY DONT EXIST
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

if (!fs.existsSync(mainOutputFile)) {
    fs.writeFileSync((mainOutputFile), '[]');
}


function generateRandomIP() {
    const getRandomNumber = () => Math.floor(Math.random() * 256);
    const ipParts = Array.from({ length: 4 }, getRandomNumber);
    return ipParts.join('.');
}


function main(currentOutputFile) {

    const randomIP = generateRandomIP();

    mcpinger.java({ host: randomIP }).then((res) => {

        // DELETE USELESS DATA AND PUT IP IN
        delete res.favicon;
        res.ip = randomIP;

        console.log('Server found!')
        console.log(res);

        let currentExistingData = [];
        let totalExistingData = [];

        // CREATE MAIN OUTPUT FILE IF IT DOESNT EXIST
        if (fs.existsSync(mainOutputFile)) {

            totalExistingData = JSON.parse(fs.readFileSync(mainOutputFile));
            totalExistingData.push(res);
        }

        // CREATE CURRENT OUTPUT FILE IF IT DOESNT EXIST IN FOLDER
        if (fs.existsSync(path.join(dir, currentOutputFile))) {

            currentExistingData = JSON.parse(fs.readFileSync(path.join(dir, currentOutputFile)));
            console.log(currentExistingData)
            currentExistingData.push(res);
        }

        // WRITE TO BOTH FILES
        fs.writeFileSync(mainOutputFile, JSON.stringify(totalExistingData, null, 2));+
        fs.writeFileSync(path.join(dir, currentOutputFile), JSON.stringify(currentExistingData, null, 2));

        }).catch((error) => {

            if (error.message === 'Socket timeout') {
                console.log(`No network path to ${randomIP}`);
            }
            else if (error.code === 'ECONNREFUSED' || error.code === 'ENETUNREACH' || error.code === 'EADDRNOTAVAIL' || error.code === 'ECONNRESET') {

                console.log(`Path to ${randomIP} found with no Minecraft server`);
            }
            else {
                console.error(error);
            }
        }).finally(() => {
            process.exit()
        });
}


if (cluster.isMaster) {

    try {

        process.env.currentOutputFile = (new Date()).toISOString().replace(/[-T:.]/g, '_').slice(0, -5) + '.json';

        // also create file if folder doesn't exist
        if (!fs.existsSync(path.join(dir, process.env.currentOutputFile))) {
            fs.writeFileSync(path.join(dir, process.env.currentOutputFile), '[]');
        }

        cluster.on('exit', (worker, code, signal) => {
            //console.log(`Worker ${worker.process.pid} exited with code ${code}`);
            currentThreads--;
            //console.log(currentThreads);
        });

        setInterval(() => {

            if (currentThreads < maxThreads) {
                const worker = cluster.fork();
                currentThreads++;
                console.log('Threads:', currentThreads);
            }
        }, intervalTime);
    }
    catch(error) {
        console.log('Unknown error occurred.');
    }
}
else {
    main(process.env.currentOutputFile);
}
