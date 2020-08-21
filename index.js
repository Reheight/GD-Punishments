const { token, prefix } = require('./config.json');
const fs = require('fs');
const { Client, Collection, MessageEmbed } = require('discord.js');
const { handleConnection, invokeMutes, fetchIncident } = require('./util/mysql');
const { resolve } = require('path');

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

//#region Reacting to Messages

var openAppeals = [];
client.on('messageReactionAdd', async (reaction, user) => {
    const message = reaction.message;
    const channel = message.channel;
    const guild = message.guild;

    if (user.bot) return;
    //if (reaction.message.channel.type == "dm") return;

    if (message.channel.type !== "dm") {
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

                                            await messageSent.react('✅').catch((err) => {
                                                console.log(err);
                                            })

                                            await messageSent.react('❎').catch((err) => {
                                                console.log(err);
                                            })

                                            const filter = (reaction, user) => !user.bot && reaction.emoji.name === '✅' || reaction.emoji.name === '❎';
                                            const collector = messageSent.createReactionCollector(filter, { time: 30000 });

                                            await collector.on('collect', async r => {
                                                const DMChannel = messageSent.channel;
                                                switch (r.emoji.name) {
                                                    case '✅':
                                                        let incidentID = new Promise(async (resolve, reject) => {
                                                            await user.send("**Provide the incident ID attributed to your punishment:**").then(async (a) => {
                                                                await a.channel.awaitMessages((a) => a !== undefined, { max: 1 }).then(async (c) => {
                                                                    if (c.first().content.length !== 16 || isNaN(c.first().content)) {
                                                                        return reject("INVALID_IDENTIFIER");
                                                                    } else {
                                                                        return resolve(c.first().content);
                                                                    }
                                                                })
                                                            })
                                                        })

                                                        await incidentID.then(async (incident) => {
                                                            await fetchIncident(incident).then(async (x) => {
                                                                console.log(x);
                                                            }).catch(async (err) => {
                                                                await user.send("**There was an error while getting information on this incident, open another appeal and try again!**");
                                                                openAppeals = openAppeals.filter(u => u !== user.id);
                                                            })
                                                        }).catch(async (err) => {
                                                            if (err === "INVALID_IDENTIFIER") {
                                                                await user.send("**You provided an invalid incident ID, open another appeal and try again!**");
                                                                openAppeals = openAppeals.filter(u => u !== user.id);
                                                            }
                                                        })

                                                        break;
                                                    case '❎':
                                                        await DMChannel.send("**You have closed your appeal.**").then(async () => {
                                                            openAppeals = openAppeals.filter(u => u !== user.id);
                                                        }).catch(err => {
                                                            console.log(err);
                                                        })
                                                        break;
                                                    default:
                                                        break;
                                                }
                                            })
                                        }).catch(async (err) => {
                                            await channel.send(`<@${user.id}> you must allow server members to directly message you!`).then(async (msg) => {
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
    }
});
//#endregion

//#region Starting Bot
client.login(token);
//#endregion