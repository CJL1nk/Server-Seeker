const cluster = require('cluster');
const fs = require('fs');
let mcpinger = require('mcpinger');

//########################################################

// SET TO TRUE IF YOU WANT TO LOG ALL IPS FOUND, EVEN IF NO MINECRAFT SERVER RESPONSE
let logIPS = false;

const outputFile = 'server_info.json';
const outputFile2 = 'found_ips.json';

const intervalTime = 100;
const maxThreads = 25;

var currentThreads = 0;

//########################################################


function generateRandomIP() {
    const getRandomNumber = () => Math.floor(Math.random() * 256);
    const ipParts = Array.from({ length: 4 }, getRandomNumber);
    return ipParts.join('.');
}


function main() {

    const randomIP = generateRandomIP();

    mcpinger.java({ host: randomIP }).then((res) => {

        delete res.favicon;
        res.ip = randomIP;

        console.log('Server found!')
        console.log(res);

        let existingData = [];
        if (fs.existsSync(outputFile)) {
            existingData = JSON.parse(fs.readFileSync(outputFile));
        }
        existingData.push(res);

        fs.writeFileSync(outputFile, JSON.stringify(existingData, null, 2));
        }).catch((error) => {

            if (error.message === 'Socket timeout') {
                console.log(`No network path to ${randomIP}`);
            }
            else if (error.code === 'ECONNREFUSED' || error.code === 'ENETUNREACH' || error.code === 'EADDRNOTAVAIL' || error.code === 'ECONNRESET') {

                console.log(`Path to ${randomIP} found with no Minecraft server`);

                if (logIPS) {

                    let existingIPS = []
                    if (fs.existsSync(outputFile2)) {
                        existingIPS = JSON.parse(fs.readFileSync(outputFile2));
                    }
                    existingIPS.push(randomIP);
                    fs.writeFileSync(outputFile2, JSON.stringify(existingIPS, null, 2));
                }
            }
            else {
                console.error(error);
            }
        }).finally(() => {
            process.send({ type: 'done' }); // Send a message to the master process.
        });
}


if (cluster.isMaster) {

    cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} exited with code ${code}`);
        currentThreads--;
        console.log(currentThreads);
    });

    setInterval(() => {

        if (currentThreads < maxThreads) {
            const worker = cluster.fork();
            currentThreads++;
            console.log(currentThreads);
        }
    }, intervalTime);

    cluster.on('message', (worker, message) => {

        if (message.type === 'done') {
            currentThreads--;
            console.log(currentThreads);
        }
    });
}
else {
    main();
}
