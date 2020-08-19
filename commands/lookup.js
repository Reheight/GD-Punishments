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

        if (roles.find(r => r.name === "Moderator" || r.name === "Administrator" || r.name === "Developer") || author.id === guild.owner.id) {
            if (isNaN(args[0])) {
                embed
                .setDescription(`You provided an invalid identifier: \`${args[0]}\``);

                return await channel.send(embed);
            }

            if (args[0].length !== 16) {
                embed
                .setDescription(`You provided an invalid identifier: \`${args[0]}\``);

                return await channel.send(embed);
            }
            
            await mysql.fetchIncident(args[0]).then(async (result) => {
                embed
                .setTitle("**INCIDENT**")
                .setDescription(`*${args[0]}*`)
                .addFields(
                    { name: "TYPE", value: `\`${result.TYPE}\``, inline: true },
                    { name: "MEMBER", value: `<@${result.MEMBER}>`, inline: true },
                    { name: "ACTOR", value: `<@${result.ACTOR}>`, inline: true },
                    { name: "REASON", value: `\`${result.REASON}>\``, inline: true },
                    { name: "APPEAL STATUS", value: `\`${result.STATUS}\``, inline: true},
                    { name: "DATE", value: `\`${result.EXECUTED}\``, inline: false }
                )

                return await channel.send(embed).then(async (msg) => {
                    await msg.delete({ timeout: 30000 });
                })
            }).catch(async (err) => {
                if (err == "INCIDENT_DOES_NOT_EXIST") {
                    embed
                    .setDescription(`We couldn't find the incident!`)
                    .addField("Provided Identifier", `\`${args[0]}\``, true);
    
                    return await channel.send(embed)
                } 

                console.log(`
                There was an error while fetching the incident!
                ${err}
                `)
            })
        } else {
            embed
            .setDescription("You do not have the correct permissions to perform this action!");
            
            return await channel.send(embed);
        }
    }
}