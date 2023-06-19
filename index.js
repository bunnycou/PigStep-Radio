const { Client, Events, GatewayIntentBits, ActivityType } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection, createAudioResource, createAudioPlayer, AudioPlayerStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const client = new Client({ intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const fs = require('fs');

const secret = require("./secret.json");

client.on(Events.ClientReady, c => {
    console.log(`${client.user.tag} is ready!`);
    c.user.setActivity({
        name: "!psr start|stop",
        type: ActivityType.Playing,
    });
});

client.on(Events.MessageCreate, async (message) => {
    if (message.content.startsWith("!psr")) {
        console.log("Command Executed")
        let arg = message.content.toLowerCase().split(" ")[1];
        if (arg == "start") {
            console.log("Type: Start");
            startRadio(message.member.voice.channelId, message.guildId, message.guild.voiceAdapterCreator)

        } else if (arg == "stop") {
            console.log("Type: Stop")
            const connection = getVoiceConnection(message.guildId);
            connection.destroy();
        }
    }
});

function startRadio(channel, guild, adapter) {
    const player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Pause,
        },
    });

    const connection = joinVoiceChannel({
        channelId: channel,
        guildId: guild,
        adapterCreator: adapter,
    });

    connection.subscribe(player)
    player.play(createAudioResource("./startup.mp3"))
    let status = 1;
    player.on(AudioPlayerStatus.Idle, () => {
        if (status < 3) {
            status++;
            playFromFolder("./songs", player)
        } else {
            status = 0;
            playFromFolder("./bumpers", player)
        }
    });
}

function playFromFolder(folder, player) {
    let files = fs.readdirSync(folder);
    let file = files[Math.floor(Math.random() * files.length)]
    console.log(`Playing ${file}`)
    player.play(createAudioResource(`${folder}/${file}`))
}

client.login(secret.token);