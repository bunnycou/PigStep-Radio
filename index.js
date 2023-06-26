const { Client, Events, GatewayIntentBits, ActivityType } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection, createAudioResource, createAudioPlayer, AudioPlayerStatus, NoSubscriberBehavior, VoiceConnectionStatus } = require('@discordjs/voice');
const client = new Client({ intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const fs = require('fs');

const secret = require("./secret.json");

client.on(Events.ClientReady, c => {
    console.log(`${client.user.tag} is ready!`);
    c.user.setActivity({
        name: "!psr start",
        type: ActivityType.Playing,
    });
});

client.on(Events.MessageCreate, async (message) => {
    if (message.content.startsWith(secret.prefix)) {
        console.log("Command Executed");
        let arg = message.content.toLowerCase().split(" ")[1];
        if (arg == "start") {
            console.log("Type: Start");
            startRadio(message.member.voice.channelId, message.guildId, message.guild.voiceAdapterCreator)

        } else if (arg == "stop") {
            console.log("Type: Stop");
            const connection = getVoiceConnection(message.guildId);
            if (connection != null) connection.destroy();
            setCusActivity("!psr start")
        }
    }
});

client.on(Events.VoiceStateUpdate, async (oldVS, newVS) => {
    if (oldVS.channelId == null) return; // joined vc
    const id = oldVS.user;
    if (id == secret.id) return; // self update
    const members = await oldVS.channel.members.size;
    if (members <= 1) { // only bot in channel (or noone? if that somehow happens?)
        const connection = getVoiceConnection(oldVS.guild.id);
        if (connection != null) {
            connection.destroy();
            setCusActivity("!psr start")
            console.log(`left empty channel: (${oldVS.channel.name})`);
        }
    }
})

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

    connection.on(VoiceConnectionStatus.Destroyed, (e) => {
        player.stop();
    });

    connection.subscribe(player);
    player.play(createAudioResource("./startup.mp3"));
    let status = 0;
    player.on(AudioPlayerStatus.Idle, () => {
        if (status < 3) {
            status++;
            playFromFolder("./songs", player);
        } else {
            status = 0;
            playFromFolder("./bumpers", player);
        }
    });
}

function playFromFolder(folder, player) {
    let files = fs.readdirSync(folder);
    let file = files[Math.floor(Math.random() * files.length)]
    if (folder == "./songs") {
        setCusActivity(file.substring(0, file.length-4))
    } else {
        setCusActivity("!psr stop")
    }
    
    console.log(`Playing ${file}`);
    player.play(createAudioResource(`${folder}/${file}`));
}

function setCusActivity(status) {
    client.user.setActivity({
        name: status,
        type: ActivityType.Playing,
    });
}

client.login(secret.token);