const Discord=require('discord.js');

module.exports.run = async (MAIN, message, args, prefix) => {
  MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ?", [message.member.id], function (error, user, fields) {
    let qSubs='', rSubs='', pSubs='', aSubs='', uName='', status='', time='';
    if(message.member.nickname){ uName=message.member.nickname; } else{ uName=message.member.user.username; }
    if(user[0].paused=='YES'){ status='PAUSED'; } else{ status='ACTIVE'; }
    if(user[0].alert_time){ time=user[0].alert_time; }
    if(user[0].quests){ qSubs=user[0].quests.replace(/,/g,'\n'); } else{ qSubs='None.'; }
    if(user[0].geofence){ aSubs=user[0].geofence.replace(/,/g,'\n'); } else{ aSubs='None.'; }
    pSubs='Feature Not Enabled Yet.'; // if(user[0].pokemon){ pSubs=''; } else { pSubs='None.'; }
    rSubs='Feature Not Enabled Yet.'; // if(user[0].raids){ rSubs=''; } else{ rSubs='None.'; }
    let userSubscriptions=new Discord.RichEmbed().setColor('00ff00')
      .setAuthor(uName+'\'s Subscriptions', message.member.user.displayAvatarURL)
      .setDescription('Status is `'+status+'`\nQuest DM delivery time set to `'+time+'` AM')
      .addField('Quest Subscriptions:','```'+qSubs+'```')
      .addField('Pokemon Subscriptions:','```'+pSubs+'```')
      .addField('Raid Subscriptions:','```'+rSubs+'```')
      .addField('Subscription Areas:','```'+aSubs+'```')
      .setFooter('If your status is PAUSED at the time your Quest DMs are supposed to be delivered, you will not receive any quest subscriptions for that day.');
    message.channel.send(userSubscriptions).then(m => m.delete(30000)).catch(console.error);
  });
}
