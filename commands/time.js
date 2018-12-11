const Discord=require('discord.js');

module.exports.run = async (MAIN, message, args, prefix) => {
  let alertTimes=[ '6:00','6:15','6:30','6:45','7:00','7:15','7:30','7:45','8:00','8:15','8:30','8:45','9:00','9:15','9:30','9:45','10:00','10:15','10:30','10:45','11:00']
  switch(args[0]){
    case undefined:
    case 'help':
      let areaHelp=new Discord.RichEmbed().setColor('00ff00')
        .addField('Alert Time Set Command:', '`'+prefix+'time [TIME]`\n`'+prefix+'time 7:45`\nAlerts must be in increments of :15 and between the hours of 6:00 and 11:00 (AM).')
        .addField('Available times to receive alerts:', alertTimes);
      return message.channel.send(areaHelp).then(m => m.delete(60000)).catch(console.error);
    default:
      if(args[0].length<=5 && args[0].length>=4 && alertTimes.indexOf(args[0])>=0){
        MAIN.database.query("UPDATE pokebot.users SET alert_time = ? WHERE user_id = ?", [args[0],message.member.id], function (error, user, fields) {
          if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(15000)).catch(console.error); }
          else{ return message.reply('Your quest DM delivery time has been set to `'+args[0]+'`. This change will not take effect until Midnight tonight.').then(m => m.delete(15000)).catch(console.error); }
        });
      }
      else{ return message.reply('Invalid time. Must be 0:00 hour format, in increments of :15, and between 6:00 and 11:00. Examples: 6:00, 7:30, 8:45, 10:15.').catch(console.error); }
  }
}
