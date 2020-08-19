const Discord = require('discord.js');
const UUID = require('../util/UUID');
const MYSQL = require('../util/mysql');

module.exports = {
    "name": "ban",
    "description": "Ban a user from the server.",
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
                .setDescription(`**You can not use this command to ban in this server!**
                *Try to right click the users name and select 'ban'*`)

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 });
                })
            }

            if (args.length <= 0) {
                embed
                .setTitle("__SYNTAX__")
                .addFields(
                    { name: "Command", value: `+ban`, inline: true },
                    { name: "Arguments", value: `tag/id, reason`, inline: true },
                    { name: "Example", value: `+ban 176425611949113344 Racism` }
                )

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 })
                })
            }

            const bMember = message.mentions.members.first() || guild.members.cache.get(args[0]);

            if (!bMember) {
                embed
                .setDescription(`**You provided an invalid member to ban!**
                *They may have left the Discord server*`)

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 });
                })
            }

            if (!args[1]) {
                embed
                .setDescription(`You must provide a valid reason!`)

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 });
                })
            }

            if ((guildMember.roles.highest.position <= bMember.roles.highest.position || bMember.user.id == guild.owner.id) && guildMember.id !== guild.owner.id) {
                embed
                .setDescription(`**You are not allowed to perform this action on this member!**`)

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 });
                })
            }

            if (guildMember == bMember) {
                embed
                .setDescription(`**You are not allowed to perform this action on yourself!**`)

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 });
                })
            }

            if (!bMember.bannable) {
                embed
                .setDescription(`**I am unable to ban that user!**
                *This is most likely due to Role Hierarchy*`)

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 });
                })
            }

            const incidentID = UUID.generateUUID(16);

            const banRecord = new Discord.MessageEmbed()
            .setTitle("Banned from Gaming Den")
            .setThumbnail(bMember.user.displayAvatarURL)
            .addFields(
                { name: "Member", value: `<@${bMember.user.id}>\n(${bMember.user.id})`, inline: true },
                { name: "Actor", value: `<@${guildMember.user.id}>\n(${guildMember.user.id})`, inline: true},
                { name: "Reason", value: `\`${Discord.Util.escapeMarkdown(args.slice(1).join(" "))}\``, inline: true},
                { name: "Incident", value: `\`${incidentID}\``, inline: true}
            )

            embed
            .setTitle("**Banned from Gaming Den**")
            .setDescription('You have been banned from `Gaming Den`, you may appeal your ban here: https://discord.gg/DyAhgY9')
            .addFields(
                { name: "Actor", value: `<@${guildMember.user.id}>\n(${guildMember.user.id})`},
                { name: "Reason", value: `\`${Discord.Util.escapeMarkdown(args.slice(1).join(" "))}\``, inline: true},
                { name: "Incident", value: `\`${incidentID}\``, inline: true}
            )
            
            await bMember.send(embed).catch(() => {
                console.log(`We were unable to PM ${bMember.user.tag} (${bMember.user.id}) about being banned!`)
            })

            await bMember.ban({ reason: args.slice(1).join(" ") }).then(async () => {
                await client.guilds.cache.get('744824625397235794').channels.cache.get('745319968752664725').send(banRecord) // Send to GD Ban Appeal
                await client.guilds.cache.get('745355697180639382').channels.cache.get('745359752837726349').send(banRecord) // Send to Gamers Den

                await MYSQL.importBan(incidentID, bMember.user.id, author.id, Discord.Util.escapeMarkdown(args.slice(1).join(" ")));
            }).catch(() => {
                console.log(`We were unable to ban ${bMember.user.tag} (${bMember.user.id})!`)
            })
            

        } else {
            embed
            .setDescription("You do not have the correct permissions to perform this action!");
            
            return await channel.send(embed);
        }
    }
}