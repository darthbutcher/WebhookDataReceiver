const Discord=require('discord.js');

module.exports.run = async (MAIN, message, prefix, discord) => {
  MAIN.database.query("UPDATE pokebot.users SET status = ? WHERE user_id = ? AND discord_id = ?", ['ACTIVE', message.member.id, message.guild.id], function (error, user, fields) {
    if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(15000)).catch(console.error); }
    else{ return message.reply('All of your subscriptions are now `ACTIVE`.').then(m => m.delete(15000)).catch(console.error); }
  });
}
