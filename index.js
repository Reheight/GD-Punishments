const { token, prefix } = require('./config.json');
const fs = require('fs');
const { Client, Collection, MessageEmbed, Util } = require('discord.js');
const { handleConnection, invokeMutes, fetchIncident, setPending, setDenied, setAccepted } = require('./util/mysql');
const MuteUtil = require('./events/muting');

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
                                                                if (x.MEMBER !== user.id) {
                                                                    await user.send("**You can not appeal a punishment that does not belong to you!**");
                                                                    openAppeals = openAppeals.filter(u => u !== user.id);
                                                                } else {
                                                                    if (x.STATUS !== "Unopened") {
                                                                        await user.send("**This punishment is no longer able to be appealed!**");
                                                                        openAppeals = openAppeals.filter(u => u !== user.id);
                                                                    } else {
                                                                        switch (x.TYPE) {
                                                                            case "BAN":
                                                                                await user.send(`**Were you banned by <@${x.ACTOR}> for \`${x.REASON}\`?**`).then(async (messageSent) => {
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
                                                                                        switch (r.emoji.name) {
                                                                                            case '✅':
                                                                                                await user.send("**Why do you think you should be unbanned?**").then(async (a) => {
                                                                                                    await a.channel.awaitMessages((a) => a !== undefined, { max: 1 }).then(async (c) => {
                                                                                                        if (c.first().content.length < 20) {
                                                                                                            await user.send("**Your appeal reason was not long enough, open another appeal and try again!**");
                                                                                                            openAppeals = openAppeals.filter(u => u !== user.id);
                                                                                                        } else {
                                                                                                            const appealMessage = new MessageEmbed()
                                                                                                            .setTitle(`__BAN APPEAL__`)
                                                                                                            .setDescription(`
                                                                                                            **Appeal Reason:**
                                                                                                            ${Util.escapeMarkdown(c.first().content)}
                                                                                                            `)
                                                                                                            .addFields(
                                                                                                                { name: "Incident", value: incident, inline: true },
                                                                                                                { name: "Member", value: `<@${x.MEMBER}>`, inline: true },
                                                                                                                { name: "Actor", value: `<@${x.ACTOR}>`, inline: true}
                                                                                                            )
                                                                                                            .setTimestamp()

                                                                                                            await user.send(`**Do you wish to submit this appeal, remember that this is final and cannot be edited!**`).then(async (messageSent) => {
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
                                                                                                                    switch (r.emoji.name) {
                                                                                                                        case '✅':
                                                                                                                            client.guilds.cache.get('745355697180639382').channels.create(`${incident}`, { type: "text" }).then(async (channel) => {
                                                                                                                                await user.send("**You have submitted your appeal!**");

                                                                                                                                await channel.setParent('746385820868542616');
                                                                                                                                channel.send(appealMessage).then(async (appeal) => {
                                                                                                                                    await setPending(incident);
                                                                                                                                    await appeal.react('✅').catch((err) => {
                                                                                                                                        console.log(err);
                                                                                                                                    })
                                                                                        
                                                                                                                                    await appeal.react('❎').catch((err) => {
                                                                                                                                        console.log(err);
                                                                                                                                    })

                                                                                                                                    const filter = (reaction, user) => !user.bot && reaction.emoji.name === '✅' || reaction.emoji.name === '❎';
                                                                                                                                    const collector = appeal.createReactionCollector(filter, { time: 30000 });
                                                                                                                                    
                                                                                                                                    await collector.on('collect', async (r, u) => {
                                                                                                                                        switch (r.emoji.name) {
                                                                                                                                            case '✅':
                                                                                                                                                await client.guilds.cache.get('744824625397235794').members.unban(x.MEMBER).then(async () => {
                                                                                                                                                    const unbanRecord = new MessageEmbed()
                                                                                                                                                    .setTitle("Unbanned from Gaming Den")
                                                                                                                                                    .addFields(
                                                                                                                                                        { name: "Member", value: `<@${x.MEMBER}>\n(${x.MEMBER})` },
                                                                                                                                                        { name: "Actor", value: `<@${u.id}>\n(${u.id})`}
                                                                                                                                                    )
                                                                                                                                                    
                                                                                                                                                    await client.guilds.cache.get('744824625397235794').channels.cache.get('745319968752664725').send(unbanRecord)
                                                                                                                                                    await client.guilds.cache.get('745355697180639382').channels.cache.get('745359752837726349').send(unbanRecord)
                                                                                                                                                        
                                                                                                                                                    const embed = new MessageEmbed()
                                                                                                                                                    .setTitle("__APPEAL ACCEPTED__")
                                                                                                                                                    .setDescription(`Your appeal was accepted, you may join our server back by cicking this link: https://discord.gg/stUe6D6`)
                                                                                                                                                    .addFields(
                                                                                                                                                        { name: 'Actor', value: `<@${u.id}>`}
                                                                                                                                                    )
                                                                                                                                                    .setTimestamp()

                                                                                                                                                    await setAccepted(incident);

                                                                                                                                                    await user.send(embed);

                                                                                                                                                    return channel.delete();
                                                                                                                                                }).catch(async () => {
                                                                                                                                                    
                                                                                                                                                })
                                                                                                                                                break;
                                                                                                                                            case '❎':
                                                                                                                                                const embed = new MessageEmbed()
                                                                                                                                                .setTitle("__APPEAL DENIED__")
                                                                                                                                                .setDescription(`Your appeal was denied!`)
                                                                                                                                                .addFields(
                                                                                                                                                    { name: 'Actor', value: `<@${u.id}>`}
                                                                                                                                                )
                                                                                                                                                .setTimestamp()

                                                                                                                                                await setDenied(incident);

                                                                                                                                                await user.send(embed);

                                                                                                                                                return channel.delete();
                                                                                                                                                break;
                                                                                                                                        }
                                                                                                                                    })
                                                                                                                                })
                                                                                                                            })
                                                                                                                            openAppeals = openAppeals.filter(u => u !== user.id);
                                                                                                                            break;
                                                                                                                        case '❎':
                                                                                                                            await user.send("**Your appeal has been cancelled, you may open another appeal at any time!**");
                                                                                                                            openAppeals = openAppeals.filter(u => u !== user.id);
                                                                                                                            break;
                                                                                                                    }
                                                                                                                })
                                                                                                            })
                                                                                                        }
                                                                                                    })
                                                                                                })
                                                                                                break;
                                                                                            case '❎':
                                                                                                await user.send("**It looks like there must have been a mistake, open another appeal and ensure you're using the richt incident ID!**");
                                                                                                openAppeals = openAppeals.filter(u => u !== user.id);
                                                                                                break;
                                                                                        }
                                                                                    })
                                                                                })
                                                                                
                                                                                break;
                                                                            case "MUTE":
                                                                                if (x.EXPIRES < new Date()) {
                                                                                    openAppeals = openAppeals.filter(u => u !== user.id);
                                                                                    return await user.send('**Your mute has already expired!**');
                                                                                }
                                                                                await user.send(`**Were you muted by <@${x.ACTOR}> for \`${x.REASON}\`?**`).then(async (messageSent) => {
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
                                                                                        switch (r.emoji.name) {
                                                                                            case '✅':
                                                                                                await user.send("**Why do you think you should be unmuted?**").then(async (a) => {
                                                                                                    await a.channel.awaitMessages((a) => a !== undefined, { max: 1 }).then(async (c) => {
                                                                                                        if (c.first().content.length < 20) {
                                                                                                            await user.send("**Your appeal reason was not long enough, open another appeal and try again!**");
                                                                                                            openAppeals = openAppeals.filter(u => u !== user.id);
                                                                                                        } else {
                                                                                                            const appealMessage = new MessageEmbed()
                                                                                                            .setTitle(`__MUTE APPEAL__`)
                                                                                                            .setDescription(`
                                                                                                            **Appeal Reason:**
                                                                                                            ${Util.escapeMarkdown(c.first().content)}
                                                                                                            `)
                                                                                                            .addFields(
                                                                                                                { name: "Incident", value: incident, inline: true },
                                                                                                                { name: "Member", value: `<@${x.MEMBER}>`, inline: true },
                                                                                                                { name: "Actor", value: `<@${x.ACTOR}>`, inline: true}
                                                                                                            )
                                                                                                            .setTimestamp()

                                                                                                            await user.send(`**Do you wish to submit this appeal, remember that this is final and cannot be edited!**`).then(async (messageSent) => {
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
                                                                                                                    switch (r.emoji.name) {
                                                                                                                        case '✅':
                                                                                                                            client.guilds.cache.get('745355697180639382').channels.create(`${incident}`, { type: "text" }).then(async (channel) => {
                                                                                                                                await user.send("**You have submitted your appeal!**");

                                                                                                                                await channel.setParent('746385910307881040');
                                                                                                                                channel.send(appealMessage).then(async (appeal) => {
                                                                                                                                    await setPending(incident);
                                                                                                                                    await appeal.react('✅').catch((err) => {
                                                                                                                                        console.log(err);
                                                                                                                                    })
                                                                                        
                                                                                                                                    await appeal.react('❎').catch((err) => {
                                                                                                                                        console.log(err);
                                                                                                                                    })

                                                                                                                                    const filter = (reaction, user) => !user.bot && reaction.emoji.name === '✅' || reaction.emoji.name === '❎';
                                                                                                                                    const collector = appeal.createReactionCollector(filter, { time: 30000 });
                                                                                                                                    
                                                                                                                                    await collector.on('collect', async (r, u) => {
                                                                                                                                        switch (r.emoji.name) {
                                                                                                                                            case '✅':
                                                                                                                                                await MuteUtil.unmutePlayer(x.MEMBER, client).catch(async (err) => {
                                                                                                                                    
                                                                                                                                                    return await channel.send("**We were unable to unmute the player!**");
                                                                                                                                                }).then(async () => {
                                                                                                                                                    const unmuteRecord = new MessageEmbed()
                                                                                                                                                    .setTitle("Unmuted on Gaming Den")
                                                                                                                                                    .addFields(
                                                                                                                                                        { name: "Member", value: `<@${x.MEMBER}>\n(${x.MEMBER})`, inline: true },
                                                                                                                                                        { name: "Actor", value: `<@${x.ACTOR}>\n(${x.ACTOR})`, inline: true}
                                                                                                                                                    )
                                                                                                                                        
                                                                                                                                                    const embed = new MessageEmbed()
                                                                                                                                                    .setTitle("**Unmuted on Gaming Den**")
                                                                                                                                                    .setDescription('You have been unmuted on `Gaming Den`')
                                                                                                                                                    .addFields(
                                                                                                                                                        { name: "Actor", value: `<@${x.ACTOR}>\n(${x.ACTOR})`}
                                                                                                                                                    )
                                                                                                                                                    
                                                                                                                                                    await user.send(embed).catch(() => {
                                                                                                                                                        console.log(`We were unable to PM ${user.tag} (${user.id}) about being unmuted!`)
                                                                                                                                                    })

                                                                                                                                                    await setDenied(incident)
                                                                                                                                    
                                                                                                                                                    await client.guilds.cache.get('744824625397235794').channels.cache.get('745319968752664725').send(unmuteRecord) // Send to GD Ban Appeal
                                                                                                                                                    await client.guilds.cache.get('745355697180639382').channels.cache.get('745359752837726349').send(unmuteRecord) // Send to Gamers Den

                                                                                                                                                    return channel.delete();
                                                                                                                                                })
                                                                                                                                                break;
                                                                                                                                            case '❎':
                                                                                                                                                const embed = new MessageEmbed()
                                                                                                                                                .setTitle("__APPEAL DENIED__")
                                                                                                                                                .setDescription(`Your appeal was denied!`)
                                                                                                                                                .addFields(
                                                                                                                                                    { name: 'Actor', value: `<@${u.id}>`}
                                                                                                                                                )
                                                                                                                                                .setTimestamp()

                                                                                                                                                await setDenied(incident);

                                                                                                                                                await user.send(embed);

                                                                                                                                                return channel.delete();
                                                                                                                                                break;
                                                                                                                                        }
                                                                                                                                    })
                                                                                                                                })
                                                                                                                            })
                                                                                                                            openAppeals = openAppeals.filter(u => u !== user.id);
                                                                                                                            break;
                                                                                                                        case '❎':
                                                                                                                            await user.send("**Your appeal has been cancelled, you may open another appeal at any time!**");
                                                                                                                            openAppeals = openAppeals.filter(u => u !== user.id);
                                                                                                                            break;
                                                                                                                    }
                                                                                                                })
                                                                                                            })
                                                                                                        }
                                                                                                    })
                                                                                                })
                                                                                                break;
                                                                                            case '❎':
                                                                                                await user.send("**It looks like there must have been a mistake, open another appeal and ensure you're using the richt incident ID!**");
                                                                                                openAppeals = openAppeals.filter(u => u !== user.id);
                                                                                                break;
                                                                                        }
                                                                                    })
                                                                                })
                                                                                
                                                                                break;
                                                                        }
                                                                    }
                                                                }
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