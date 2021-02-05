require('dotenv').config();

const Discord = require('discord.js');

const {
    DISCORD_BOT_TOKEN,
    DISCORD_POST_CHANNEL,
    DISCORD_POST_GUILD,
} = process.env;

const client = new Discord.Client();

client.on('ready', async () => {
    const guild = client.guilds.cache.get(DISCORD_POST_GUILD);
    const channel = guild.channels.cache.get(DISCORD_POST_CHANNEL);

    await channel.send({ embed: { title: 'Placeholder Embed' } });

    process.exit();
});

client.login(DISCORD_BOT_TOKEN);