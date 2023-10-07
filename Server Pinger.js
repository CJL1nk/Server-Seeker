const cluster = require('cluster');
const fs = require('fs');
const outputFile = 'server_info.json';
let mcpinger = require('mcpinger');

function generateRandomIP() {
    const getRandomNumber = () => Math.floor(Math.random() * 256);
    const ipParts = Array.from({ length: 4 }, getRandomNumber);
    return ipParts.join('.');
}

function main() {

    const randomIP = generateRandomIP();

    mcpinger
        .java({ host: randomIP })
        .then((res) => {
            delete res.favicon;
            res.ip = randomIP;

            console.log(res);

            let existingData = [];
            if (fs.existsSync(outputFile)) {
                existingData = JSON.parse(fs.readFileSync(outputFile));
            }
            existingData.push(res);
            fs.writeFileSync(outputFile, JSON.stringify(existingData, null, 2));
        })
        .catch((error) => {
            if (error.message === 'Socket timeout') {
                console.log(`Could not establish connection to: ${randomIP}`);
            } else {
                console.error(error);
            }
        });
}

if (cluster.isMaster) {

    setInterval(() => {
        const worker = cluster.fork();
        worker.on('exit', (code, signal) => {
            console.log(`Worker ${worker.process.pid} exited with code ${code}`);
        });
    }, 1000);
}
else {
    main();
}
