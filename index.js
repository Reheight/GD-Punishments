const { token, prefix } = require('./config.json');
const fs = require('fs');
const { Client, Collection, MessageEmbed } = require('discord.js');
const { handleConnection, invokeMutes } = require('./util/mysql');

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

    //#region handle mute invoke
    await invokeMutes(client);
    //#endregion

    //#region Caching Message
    await cacheMessages();
    //#endregion
})
//#endregion

//#region Caching Messages
async function cacheMessages() {
    await client.guilds.cache.get('745355697180639382').channels.cache.get('745367973002477579').messages.fetch('746311763854884894');
}
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

/* //#region Reacting to Messages

const openAppeals = [];
client.on('messageReactionAdd', async (reaction, user) => {
    const message = reaction.message;
    const channel = message.channel;
    const guild = message.guild;

    switch (guild.id) {
        case '745355697180639382':
            switch (channel.id) {
                case '745367973002477579':
                    switch (message.id) {
                        case '746311763854884894':
                            switch (reaction.emoji.id) {
                                case '746307326641700965':
                                    message.reactions.resolve('746307326641700965').users.remove(user).catch((err) => {
                                        console.log(err);
                                    })

                                    if (openAppeals.includes(user.id)) {
                                        return;
                                    }

                                    await user.send("**Do you wish to appeal your punishment?**").then(async (messageSent) => {
                                        openAppeals.push(user.id);

                                        messageSent.react('✅').catch((err) => {
                                            console.log(err);
                                        })

                                        messageSent.react('❎').catch((err) => {
                                            console.log(err);
                                        })

                                        const filter = (reaction, user) => !user.bot && reaction.emoji.name === '✅' || reaction.emoji.name === '❎';
                                        const collector = messageSent.createReactionCollector(filter, { time: 30000 });

                                        collector.on('collect', async r => {
                                            const DMChannel = messageSent.channel;
                                            switch (r.emoji.name) {
                                                case '✅':
                                                    break;
                                                case '❎':
                                                    await DMChannel.send("**You have closed your appeal.**").then(async () => {
                                                        //openAppeals = openAppeals.filter(u => u === user.id);

                                                        //console.log(openAppeals);
                                                    }).catch(err => {
                                                        console.log(err);
                                                    })
                                                    break;
                                                default:
                                                    break;
                                            }
                                        })
                                    }).catch((err) => {
                                        channel.send(`<@${user.id}> you must allow server members to directly message you!`).then(async (msg) => {
                                            await msg.delete({ timeout: 30000 })
                                        })
                                    })
                                    break;
                                default:
                                    message.reactions.resolve(reaction).users.remove(user);
                            }
                            break;
                    }
                    break;
            }
            break;
    }
});
//#endregion */

//#region Starting Bot
client.login(token);
//#endregion