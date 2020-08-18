const { token, prefix } = require('./config.json');
const fs = require('fs');
const { Client } = require('discord.js');

//#region Defining Discord Client
const client = new Client();
//#endregion

//#region Bot Ready
client.on('ready', async () => {
    console.log(`${client.user.tag} is now online in ${client.guilds.cache.size} guild(s).`);

    //#region Setting Custom Activity
    client.user.setActivity("Gamers Den", { type: "WATCHING" })
    //#endregion
})
//#endregion

//#region Message Event
client.on('message', async (message) => {
    if (message.author.bot) return; // Ensure the message isn't from a bot
    if (message.channel.type === 'dm') return; // Ensure the message isn't in a DM

    const args = message.content.slice(prefix.length).trim().split(/ +/); // Getting message, removing the prefix, then splitting the message into an array.
    const command = args.shift().toLowerCase(); // Removing first argument from args array, making it all lowercase, then returning it.
    

})
//#endregion

//#region Starting Bot
client.login(token);
//#endregion