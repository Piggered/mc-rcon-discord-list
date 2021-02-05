require('dotenv').config();

const Cron = require('node-cron');
const Discord = require('discord.js');
const Rcon = require('rcon-client').Rcon;

const {
    CRON_JOB,
    DISCORD_BOT_TOKEN,
    DISCORD_EMOJI_GUILD,
    DISCORD_POST_CHANNEL,
    DISCORD_POST_GUILD,
    DISCORD_POST_MESSAGE,
    RCON_HOSTNAME,
    RCON_PASSWORD
} = process.env;

const rcon = new Rcon({
    host: RCON_HOSTNAME,
    password: RCON_PASSWORD
});

const client = new Discord.Client();

client.on('ready', async () => {
    const emojiGuild = client.guilds.cache.get(DISCORD_EMOJI_GUILD);
    const postGuild = client.guilds.cache.get(DISCORD_POST_GUILD);

    const emojis = emojiGuild.emojis;
    const channel = postGuild.channels.cache.get(DISCORD_POST_CHANNEL);
    const message = await channel.messages.fetch(DISCORD_POST_MESSAGE);
    const unknown = emojis.cache.find(e => e.name === 'Unknown');

    Cron.schedule(CRON_JOB, async () => {
        const response = await rcon.send('list');
        const players = response.split(':')[1].split(', ');

        let description = '';
        let playerCount;

        if (players[0] !== '') {
            for (const player of players) {
                const emoji = emojis.cache.find(e => e.name === player) ?? unknown;
    
                description += `${emoji} ${player}\n`;
            }

            playerCount = players.length;
        } else {
            description = '*It\'s lonely over there...* 😢';
            playerCount = 0;
        }

        const embed = {
            color: 0x43B581,
            title: 'Online Players',
            footer: { text: `${playerCount} player${playerCount === 1 ? '' : 's'} online` },
            timestamp: new Date(),
            description
        };

        message.edit({ embed });
    });
});

(async () => {
    await rcon.connect();
    await client.login(DISCORD_BOT_TOKEN);
})();