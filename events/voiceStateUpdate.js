const { DiscordMusicBot } = require('../structures/DiscordMusicBot');
const { VoiceState } = require("discord.js");
/**
 *
 * @param {DiscordMusicBot} client
 * @param {VoiceState} oldState
 * @param {VoiceState} newState
 * @returns {Promise<void>}
 */
module.exports = async (client, oldState, newState) => {
    // skip bot users
    if (newState.member.user.bot) return;

    // get guild and player
    let guildId = newState.guild.id;
    const player = client.Manager.get(guildId);

    // check if the bot is active (playing, paused or empty does not matter (return otherwise)
    if (!player || player.state !== "CONNECTED") return;

    // prepreoces the data
    const stateChange = {};
    // get the state change
    if (oldState.channel === null && newState.channel !== null) stateChange.type = "JOIN";
    if (oldState.channel !== null && newState.channel === null) stateChange.type = "LEAVE";
    if (oldState.channel !== null && newState.channel !== null) stateChange.type = "MOVE";
    if (oldState.channel === null && newState.channel === null) return; // you never know, right

    // move check first as it changes type
    if (stateChange.type === "MOVE") {
        if (oldState.channel.id === player.voiceChannel) stateChange.type = "LEAVE";
        if (newState.channel.id === player.voiceChannel) stateChange.type = "JOIN";
    }
    // double triggered on purpose for MOVE events
    if (stateChange.type === "JOIN") stateChange.channel = newState.channel;
    if (stateChange.type === "LEAVE") stateChange.channel = oldState.channel;

    // check if the bot's voice channel is involved (return otherwise)
    if (!stateChange.channel || stateChange.channel.id !== player.voiceChannel) return;

    switch (stateChange.type) {
        case "JOIN":
            if (stateChange.channel.members.size === 2 && player.paused) {
                player.pause(false);
            }
            break;
        case "LEAVE":
            if (stateChange.channel.members.size === 1 && !player.paused && player.playing) {
                player.pause(true);
            }
            break;
    }
}