const mysql = require('mysql');
const credentials = require('../mysql.json');

var con = mysql.createConnection({
    host: credentials.host,
    port: credentials.port,
    user: credentials.username,
    password: credentials.password,
    database: credentials.database
});

function handleConnection() {
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
    var sql = "INSERT INTO incidents (TYPE, IDENTIFIER, MEMBER, ACTOR, REASON) VALUES (?, ?, ?, ?, ?)";

    return new Promise((resolve, reject) => {
        con.query(sql, [1, incident, member, actor, reason], (err, result) => {
            if (err) {
                reject(err);

                throw err;
            }

            resolve();
        })
    })
}

module.exports.importBan = importBan;

const fetchIncident = async (incident) => {
    var sql = "SELECT TYPE, MEMBER, ACTOR, REASON, EXECUTED, EXPIRES, STATUS FROM incidents WHERE IDENTIFIER = ?";

    return new Promise((resolve, reject) => {
        con.query(sql, incident, (err, result) => {
            if (err) {
                return reject(err);
                throw err;
            }

            if (result.length <= 0) {
                return reject("INCIDENT_DOES_NOT_EXIST");
            }

            switch (result[0].TYPE) {
                case 1:
                    console.log("T")
                    switch (result[0].STATUS) {
                        case 0:
                            return resolve({
                                TYPE: "BAN",
                                MEMBER: result[0].MEMBER,
                                ACTOR: result[0].ACTOR,
                                REASON: result[0].REASON,
                                EXECUTED: result[0].EXECUTED,
                                STATUS: "Unopened"
                            });
                        case 1:
                            return resolve({
                                TYPE: "BAN",
                                MEMBER: result[0].MEMBER,
                                ACTOR: result[0].ACTOR,
                                REASON: result[0].REASON,
                                EXECUTED: result[0].EXECUTED,
                                STATUS: "Pending"
                            });
                        case 2:
                            return resolve({
                                TYPE: "BAN",
                                MEMBER: result[0].MEMBER,
                                ACTOR: result[0].ACTOR,
                                REASON: result[0].REASON,
                                EXECUTED: result[0].EXECUTED,
                                STATUS: "Accepted"
                            });
                        case 3:
                            return resolve({
                                TYPE: "BAN",
                                MEMBER: result[0].MEMBER,
                                ACTOR: result[0].ACTOR,
                                REASON: result[0].REASON,
                                EXECUTED: result[0].EXECUTED,
                                STATUS: "Denied"
                            });
                    }
                    break;
                default:
                    return resolve(result[0].TYPE)
            }
        })
    })
}

module.exports.fetchIncident = fetchIncident;