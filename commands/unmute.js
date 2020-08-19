const Discord = require('discord.js');
const mysql = require('../util/mysql');

module.exports = {
    "name": "unmute",
    "description": "Unmute a member.",
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
                .setDescription(`**You can not use this command to mute in this server!**
                *Try to right click the users name and select 'mute'*`)

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 });
                })
            }

            if (args.length !== 1) {
                embed
                .setDescription(`**You must specify a member to unmute!**`)

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 });
                })
            }

            const uMember = message.mentions.members.first() || guild.members.cache.get(args[0]);

            if (!uMember) {
                embed
                .setDescription(`**You provided an invalid member to mute!**
                *They may have left the Discord server*`)

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 });
                })
            }

            const isMuted = await mysql.isMuted(uMember.user.id).catch(async (err) => {
                console.log(`
                There was an error while checking if the member was muted!
                ${err}
                `)
            });

            if (!isMuted) {
                embed
                .setDescription(`**You are attempting to unmute a member that is not muted!**`)

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 });
                })
            }

            await uMember.roles.remove(message.guild.roles.cache.find(r => r.name === "Muted"));
        } else {
            embed
            .setDescription("You do not have the correct permissions to perform this action!");
            
            return await channel.send(embed);
        }
    }
}