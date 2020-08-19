const mysql = require('mysql');
const credentials = require('../mysql.json');

var con;

function handleConnection() {
    con = mysql.createConnection({
        host: credentials.host,
        port: credentials.port,
        user: credentials.username,
        password: credentials.password,
        database: credentials.database
    })

    con.connect(async (err) => {
        if (err) {
            console.log(`
            Error whilst connecting to MySQL:
            ${err}
            `)

            setTimeout(handleConnection, 2000);
        } else {
            console.log(`\n-------[MYSQL]-------` +
                    `\n      CONNECTED      ` +
                    `\n-------[MYSQL]-------` +
                    `\n\nHOST: ${credentials.host}` +
                    `\nPORT: ${credentials.port}` +
                    `\nDATABASE: ${credentials.database}` +
                    `\n\n-------[MYSQL]-------`)
        }
    })

    con.on('error', async (err) => {
        console.log(`
        Database Error:
        ${err}
        `);

        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    })
}

module.exports.handleConnection = handleConnection;

async function importBan(incident, member, actor, reason) {

}

module.exports.importBan = importBan;

const fetchIncident = async (incident) => {
    return {
        member: "Hey there",
        actor: ""
    }
}

module.exports.fetchIncident = fetchIncident;