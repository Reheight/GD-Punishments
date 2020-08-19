const lt = require('long-timeout');
const mysql = require('../util/mysql');

function processMute(member, ending, client) {
    var currentTime = new Date();
    var remainingTime = ending - currentTime;

    mutePlayer(member, client);

    var timeout = lt.setTimeout(function() {
        unmutePlayer(member, client);
    }, remainingTime);
}

function mutePlayer(member, client) {
    client.guilds.cache.get('744824625397235794').member(member).roles.add(client.guilds.cache.get('744824625397235794').roles.cache.find(r => r.name === "Muted"));
}

async function unmutePlayer(member, client) {
    client.guilds.cache.get('744824625397235794').member(member).roles.remove(client.guilds.cache.get('744824625397235794').roles.cache.find(r => r.name === "Muted"));
    await mysql.setInactive(member).catch(async (err) => {
        console.log(`
        There was an issue while setting the active status!
        ${err}
        `)
    })
}

module.exports.processMute = processMute;