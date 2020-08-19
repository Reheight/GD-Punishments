const Discord = require('discord.js');
const mysql = require('../util/mysql');

module.exports = {
    "name": "lookup",
    "description": "Lookup incident information.",
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
            
        } else {
            embed
            .setDescription("You do not have the correct permissions to perform this action!");
            
            return await channel.send(embed);
        }
    }
}