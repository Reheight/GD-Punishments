const { token, prefix } = require('./config.json');
const fs = require('fs');
const { Client, Collection } = require('discord.js');
const { handleConnection } = require('./util/mysql');

//#region Defining Discord Client
const client = new Client();
//#endregion

//#region initiating commands collection.
client.commands = new Collection();
//#endregion

//#region Bot Ready
client.on('ready', async () => {
    console.log(`${client.user.tag} is now online in ${client.guilds.cache.size} guild(s).`);

    //#region Setting Custom Activity
    client.user.setActivity("Gamers Den", { type: "WATCHING" })
    //#endregion

    //#region Open MySQL connection
    await handleConnection();
    //#endregion
})
//#endregion

//#region Command Handling
const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);

    console.log(`We have added '${prefix}${command.name}' to the commands!`);
}
//#endregion

//#region Message Event
client.on('message', async (message) => {
    if (message.author.bot) return; // Ensure the message isn't from a bot
    if (message.channel.type === 'dm') return; // Ensure the message isn't in a DM

    const author = message.author;
    const args = message.content.slice(prefix.length).trim().split(/ +/); // Getting message, removing the prefix, then splitting the message into an array.
    const command = args.shift().toLowerCase(); // Removing first argument from args array, making it all lowercase, then returning it.
    
    //#region Checking if command exists
    if (!client.commands.has(command)) return;

    client.commands.get(command).execute(author, message, args, client);
    //#endregion
})
//#endregion

//#region Starting Bot
client.login(token);
//#endregion