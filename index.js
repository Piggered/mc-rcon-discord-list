require('dotenv').config();
require('console-stamp')(console, { pattern: 'yyyy-mm-dd HH:MM:ss' });

const CronJob = require('cron').CronJob;
const Discord = require('discord.js');
const Rcon = require('rcon-client').Rcon;

const {
    CRON_JOB,
    DISCORD_BOT_TOKEN,
    DISCORD_EMOJI_GUILD,
    DISCORD_POST_CHANNEL,
    DISCORD_POST_GUILD,
    DISCORD_POST_MESSAGE,
    RCON_HOST,
    RCON_PORT,
    RCON_PASSWORD
} = process.env;

const rconOptions = {
    host: RCON_HOST,
    port: RCON_PORT,
    password: RCON_PASSWORD
};

const rcon = new Rcon(rconOptions);
const client = new Discord.Client();

let connected = false;

async function connectRcon() {
    connected = false;

    while (!connected) {
        try {
            await rcon.connect();
            connected = true;

            console.log('Connected to server RCON!');
        } catch {
            console.error('Connection to server RCON failed, retrying in 5...');

            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

client.on('ready', async () => {
    const emojiGuild = client.guilds.cache.get(DISCORD_EMOJI_GUILD);
    const postGuild = client.guilds.cache.get(DISCORD_POST_GUILD);

    const emojis = emojiGuild.emojis;
    const channel = postGuild.channels.cache.get(DISCORD_POST_CHANNEL);
    const message = await channel.messages.fetch(DISCORD_POST_MESSAGE);
    const unknown = emojis.cache.find(e => e.name === 'Unknown');

    const onTick = async () => {
        if (!connected) { 
            return;
        }

        console.log('Fetching player list...');

        const response = await rcon.send('list');
        const players = response.split(':')[1].split(', ');

        let description = '';
        let playerCount;

        if (players[0] !== '') {
            playerCount = players.length;

            console.log(`List yielded ${playerCount} user(s): ${players.join(', ')}`);

            for (const player of players) {
                const emoji = emojis.cache.find(e => e.name === player) ?? unknown;
    
                description += `${emoji} ${player.replace(/_/g, '\\_')}\n`;
            }
        } else {
            description = '*It\'s lonely over there...* 😢';
            playerCount = 0;

            console.log('List yielded 0 user(s)');
        }

        const embed = {
            color: 0x43B581,
            title: 'Online Players',
            footer: { text: `${playerCount} player${playerCount === 1 ? '' : 's'} online` },
            timestamp: new Date(),
            description
        };

        message.edit({ embed });
    };

    new CronJob({
        cronTime: CRON_JOB,
        runOnInit: true,
        start: true,
        onTick
    });
});

rcon.on('end', async () => {
    console.error('Lost connection to server RCON, reconnecting in 5...');

    await new Promise(r => setTimeout(r, 5000));
    connectRcon();
});

console.log('Logging into Discord...');

client.login(DISCORD_BOT_TOKEN).then(() => {
    console.log('Connecting to server RCON...');

    connectRcon();
});