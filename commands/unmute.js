const Discord = require('discord.js');
const mysql = require('../util/mysql');
const MuteUtil = require('../events/muting');

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

            await MuteUtil.unmutePlayer(uMember.user.id, client).catch(async (err) => {
                
            }).then(async () => {
                const unmuteRecord = new Discord.MessageEmbed()
                .setTitle("Unmuted on Gaming Den")
                .setThumbnail(uMember.user.displayAvatarURL)
                .addFields(
                    { name: "Member", value: `<@${uMember.user.id}>\n(${uMember.user.id})`, inline: true },
                    { name: "Actor", value: `<@${guildMember.user.id}>\n(${guildMember.user.id})`, inline: true}
                )
    
                embed
                .setTitle("**Unmuted on Gaming Den**")
                .setDescription('You have been unmuted on `Gaming Den`')
                .addFields(
                    { name: "Actor", value: `<@${guildMember.user.id}>\n(${guildMember.user.id})`}
                )
                
                await uMember.send(embed).catch(() => {
                    console.log(`We were unable to PM ${uMember.user.tag} (${uMember.user.id}) about being unmuted!`)
                })

                await client.guilds.cache.get('744824625397235794').channels.cache.get('745319968752664725').send(unmuteRecord) // Send to GD Ban Appeal
                await client.guilds.cache.get('745355697180639382').channels.cache.get('745359752837726349').send(unmuteRecord) // Send to Gamers Den
            })
        } else {
            embed
            .setDescription("You do not have the correct permissions to perform this action!");
            
            return await channel.send(embed);
        }
    }
}