const Discord = require('discord.js');

module.exports = {
    "name": "unban",
    "description": "Unban a user from the server.",
    async execute(author, message, args, client) {
        message.delete();

        const channel = message.channel;
        const guild = message.guild;
        const guildMember = guild.member(author);
        const roles = guildMember.roles.cache;

        const embed = new Discord.MessageEmbed()
        .setAuthor(guild.name, guild.iconURL())
        .setColor("#5af297")
        .setTimestamp();

        if (roles.find(r => r.name === "Administrator" || r.name === "Developer") || author.id === guild.owner.id) {
            if (guild.id !== '744824625397235794') {
                embed
                .setDescription(`**You can not use this command to unban in this server!**
                *You must unban them the original way!*`)

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 });
                })
            }

            if (!args[0]) {
                embed
                .setTitle("__SYNTAX__")
                .addFields(
                    { name: "Command", value: `+unban`, inline: true },
                    { name: "Arguments", value: `id`, inline: true },
                    { name: "Example", value: `+unban 176425611949113344` }
                )

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 })
                })
            }
            
            await guild.members.unban(args[0]).then(async () => {
                embed
                .setDescription(`The member has been unbanned!`)

                const unbanRecord = new Discord.MessageEmbed()
                .setTitle("Unbanned from Gaming Den")
                .addFields(
                    { name: "Member", value: `<@${args[0]}>\n(${args[0]})` },
                    { name: "Actor", value: `<@${guildMember.user.id}>\n(${guildMember.user.id})`}
                )
                
                await client.guilds.cache.get('744824625397235794').channels.cache.get('745319968752664725').send(unbanRecord)
                await client.guilds.cache.get('745355697180639382').channels.cache.get('745359752837726349').send(unbanRecord)

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 }) 
                })
            }).catch(async () => {
                embed
                .setDescription(`**We were unable to unban the member, try again!**
                *The member may not be banned!*`)

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 })
                })
            })
        } else {
            embed
            .setDescription("You do not have the correct permissions to perform this action!");
            
            return await channel.send(embed);
        }
    }
}