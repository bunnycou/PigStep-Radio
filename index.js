const { Client, Events, GatewayIntentBits, ActivityType } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection, createAudioResource, createAudioPlayer, AudioPlayerStatus, NoSubscriberBehavior, VoiceConnectionStatus } = require('@discordjs/voice');
const client = new Client({ intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const fs = require('fs');

const secret = require("./secret.json");

const startstatus = secret.prefix + " start";
const stopstatus = secret.prefix + " stop";

client.on(Events.ClientReady, c => {
    console.log(`${client.user.tag} is ready!`);
    c.user.setActivity({
        name: startstatus,
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
            setCusActivity(startstatus)
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
            setCusActivity(startstatus)
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
    let songorder = songFolderListRandom();
    let songnum = 0;
    player.on(AudioPlayerStatus.Idle, () => {
        if (status < 3) {
            status++;
            playSong(songorder[songnum++], player)
            if (songnum == songorder.length) {
                songnum = 0;
                songorder = songFolderListRandom();
            }
        } else {
            status = 0;
            playFromFolder("./bumpers", player);
        }
    });
}

function randomnum(max) {
    return Math.floor(Math.random() * max);
}

function songFolderListRandom() {
    let files = fs.readdirSync("./songs");
    let newfiles = Array(files.length);
    let i = 0;
    while (files.length != 0) {
        let r = randomnum(files.length)
        newfiles[i++] = files[r]
        files = removefromArray(files, r)
    }
    return newfiles;
}

function removefromArray(array, index) {
    let newarr = Array(array.length-1)
    let j = 0;
    for (let i = 0; i < array.length; i++) {
        if (i != index) {
            newarr[j++] = array[i];
        }
    }
    return newarr;
}

function playSong(song, player) {
    setCusActivity(song.substring(0, song.length-4))
    console.log(`Playing ${song}`)
    player.play(createAudioResource(`songs/${song}`))
}

function playFromFolder(folder, player) {
    let files = fs.readdirSync(folder);
    let file = files[Math.floor(Math.random() * files.length)]
    if (folder == "./songs") {
        setCusActivity(file.substring(0, file.length-4))
    } else {
        setCusActivity(stopstatus)
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