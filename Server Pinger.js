const cluster = require('cluster');
const fs = require('fs');
const outputFile = 'server_info.json';
const outputFile2 = 'found_ips.json';
let mcpinger = require('mcpinger');


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
                console.log(`No network path to ${randomIP}`);
            }
            else if (error.code === 'ECONNREFUSED' || error.code === 'ENETUNREACH' || error.code === 'EADDRNOTAVAIL') {

                console.log(`Path to ${randomIP} found with no Minecraft server`);

                let existingIPS = []
                if (fs.existsSync(outputFile2)) {
                    existingIPS = JSON.parse(fs.readFileSync(outputFile2));
                }
                existingIPS.push(randomIP);
                fs.writeFileSync(outputFile2, JSON.stringify(existingIPS, null, 2));
            }
            else {
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
