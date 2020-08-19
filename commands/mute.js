const Discord = require('discord.js');
const time = require('../util/time');
const mysql = require('../util/mysql');
const UUID = require('../util/UUID');
const MuteUtils = require('../events/muting');

module.exports = {
    "name": "mute",
    "description": "Mute a member.",
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

        if (roles.find(r => r.name === "Moderator" || r.name === "Administrator" || r.name === "Developer") || author.id === guild.owner.id) {
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
                    { name: "Command", value: `+mute`, inline: true },
                    { name: "Arguments", value: `tag/id, duration, reason`, inline: true },
                    { name: "Example", value: `+mute 176425611949113344 10w Racism` }
                )

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 })
                })
            }

            const mMember = message.mentions.members.first() || guild.members.cache.get(args[0]);

            if (!mMember) {
                embed
                .setDescription(`**You provided an invalid member to ban!**
                *They may have left the Discord server*`)

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 });
                })
            }

            if (!time.containsTimeConversion(args[1])) {
                embed
                .setDescription(`You must provide a valid duration!`)

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 });
                })
            }

            if (!args[2]) {
                embed
                .setDescription(`You must provide a valid reason!`)

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 });
                })
            }

            if ((guildMember.roles.highest.position <= mMember.roles.highest.position || mMember.user.id == guild.owner.id) && guildMember.id !== guild.owner.id) {
                embed
                .setDescription(`**You are not allowed to perform this action on this member!**`)

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 });
                })
            }

            if (guildMember == mMember) {
                embed
                .setDescription(`**You are not allowed to perform this action on yourself!**`)

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 });
                })
            }

            let now = new Date();
            let later = time.toDate(args[1]);
            const incidentID = UUID.generateUUID(16);

            await mysql.importMute(incidentID, mMember.user.id, guildMember.user.id, now, later, args.slice(2).join(" ")).then(async () => {
                const muteRecord = new Discord.MessageEmbed()
                .setTitle("Muted on Gaming Den")
                .setThumbnail(mMember.user.displayAvatarURL)
                .addFields(
                    { name: "Member", value: `<@${mMember.user.id}>\n(${mMember.user.id})`, inline: true },
                    { name: "Actor", value: `<@${guildMember.user.id}>\n(${guildMember.user.id})`, inline: true},
                    { name: "Reason", value: `\`${Discord.Util.escapeMarkdown(args.slice(2).join(" "))}\``, inline: true},
                    { name: "Expires", value: `\`${later.getDate()}/${later.getMonth() + 1}/${later.getFullYear()}\``, inline: true},
                    { name: "Incident", value: `\`${incidentID}\``, inline: true}
                )
    
                embed
                .setTitle("**Muted on Gaming Den**")
                .setDescription('You have been muted on `Gaming Den`, you may appeal your mute here: https://discord.gg/DyAhgY9')
                .addFields(
                    { name: "Actor", value: `<@${guildMember.user.id}>\n(${guildMember.user.id})`},
                    { name: "Reason", value: `\`${Discord.Util.escapeMarkdown(args.slice(2).join(" "))}\``, inline: true},
                    { name: "Expires", value: `\`${later.getDate()}/${later.getMonth() + 1}/${later.getFullYear()}\``, inline: true},
                    { name: "Incident", value: `\`${incidentID}\``, inline: true}
                )
                
                await mMember.send(embed).catch(() => {
                    console.log(`We were unable to PM ${mMember.user.tag} (${mMember.user.id}) about being muted!`)
                })

                await client.guilds.cache.get('744824625397235794').channels.cache.get('745319968752664725').send(muteRecord) // Send to GD Ban Appeal
                await client.guilds.cache.get('745355697180639382').channels.cache.get('745359752837726349').send(muteRecord) // Send to Gamers Den

                await mMember.roles.add(message.guild.roles.cache.find(r => r.name === "Muted"));

                await MuteUtils.processMute(mMember.user.id, later);
            }).catch((err) => {
                console.log(`We were unable to mute ${mMember.user.tag} (${mMember.user.id})!
                ${err}`)
            })
        } else {
            embed
            .setDescription("You do not have the correct permissions to perform this action!");
            
            return await channel.send(embed);
        }
    }
}