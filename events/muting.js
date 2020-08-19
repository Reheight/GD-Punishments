const lt = require('long-timeout');
const mute = require('../commands/mute');

function processMute(member, ending, client) {
    var currentTime = new Date();
    var remainingTime = ending - currentTime;

    mutePlayer(member, client);

    console.log(member)

    var timeout = lt.setTimeout(function() {
        unmutePlayer(member, client);
    }, remainingTime);
}

function mutePlayer(member, client) {
    client.guilds.cache.get('744824625397235794').member(member).roles.add(client.guilds.cache.get('744824625397235794').roles.cache.find(r => r.name === "Muted"));
}

function unmutePlayer(member, client) {
    client.guilds.cache.get('744824625397235794').member(member).roles.remove(client.guilds.cache.get('744824625397235794').roles.cache.find(r => r.name === "Muted"));
}

module.exports.processMute = processMute;