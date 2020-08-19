const Discord = require('discord.js');
const time = require('../util/time');
const mysql = require('../util/mysql');
const UUID = require('../util/UUID');

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
            let later = now.valueOf() + time.shortSinceToSeconds(args[1]);
            const incidentID = UUID.generateUUID(16);

            await mysql.importMute()
        } else {
            embed
            .setDescription("You do not have the correct permissions to perform this action!");
            
            return await channel.send(embed);
        }
    }
}