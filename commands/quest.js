const Discord=require('discord.js');

module.exports.run = async (MAIN, message, args, prefix) => {
  let rewardSub='', userSubs='';
  switch(args[0]){
    case undefined:
    case 'help':
      let availableRewards=MAIN.qConfig.Quest_Rewards.toString().replace(/,/g,'\n');
      let questHelp=new Discord.RichEmbed().setColor('00ff00')
        .addField('Reward Subscription Commands:', '`'+prefix+'quest add [REWARD]`\n`'+prefix+'quest remove [REWARD]`\n(Quest Rewards are NOT case sensitive.)')
        .addField('Available Rewards to Subscribe to:', availableRewards);
      return message.channel.send(questHelp).then(m => m.delete(60000)).catch(console.error);
    case 'pause':
      MAIN.database.query("UPDATE pokebot.users SET quests_paused = ? WHERE user_id = ?", ['PAUSED',message.member.id], function (error, user, fields) {
        if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(15000)).catch(console.error); }
        else{ return message.reply('Your Quest subscriptions are now `PAUSED`.').then(m => m.delete(15000)).catch(console.error); }
      }); break;
    case 'resume':
      MAIN.database.query("UPDATE pokebot.users SET quests_paused = ? WHERE user_id = ?", ['ACTIVE',message.member.id], function (error, user, fields) {
        if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(15000)).catch(console.error); }
        else{ return message.reply('Your Quest subscriptions are now `ACTIVE`.').then(m => m.delete(15000)).catch(console.error); }
      }); break;
    case 'add':
      if(!args[1]){ message.reply('You didn\'t not specify a reward to subscribe to.').then(m => m.delete(60000)).catch(console.error); }
      else{
        if(!args[2]){ rewardSub=args[1]; } else{ for(x=1; x<args.length; x++){ rewardSub+=args[x]+' '; } rewardSub=rewardSub.slice(0,-1); }
        rewardSub=rewardSub.toLowerCase();
        let rewardIndex=MAIN.qConfig.Quest_Rewards.toString().toLowerCase().split(','), qIndex=rewardIndex.indexOf(rewardSub);
        if(qIndex<0){ return message.reply('You didn\'t provide a valid reward to subscribe to. Type `'+prefix+'quest help` for available rewards.').then(m => m.delete(60000)).catch(console.error); }
        else{
          MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ?", [message.member.id], function (error, user, fields) {
            if(!user[0].quests){ userSubs=[]; userSubs.push(MAIN.qConfig.Quest_Rewards[qIndex]); }
            else{
              userSubs=user[0].quests.split(',');
              if(userSubs.indexOf(MAIN.qConfig.Quest_Rewards[qIndex])>=0){
                return message.reply('You are already subscribed to this quest reward.').then(m => m.delete(15000)).catch(console.error);
              }
              else{ userSubs.push(MAIN.qConfig.Quest_Rewards[qIndex]); }
            }
            userSubs=userSubs.toString();
            MAIN.database.query("UPDATE pokebot.users SET quests = ? WHERE user_id = ?", [userSubs,message.member.id], function (error, user, fields) {
              if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(15000)).catch(console.error); }
              else{ return message.reply('Success! You have successfully added `'+MAIN.qConfig.Quest_Rewards[qIndex]+'` to your quest subscriptions.').then(m => m.delete(15000)).catch(console.error); }
            });
          });
        }
      } break;
    case 'remove':
      if(!args[1]){ return message.reply('You didn\'t not specify a reward to remove.').then(m => m.delete(60000)).catch(console.error); }
      else{
        if(!args[2]){ rewardSub=args[1]; } else{ for(x=1; x<args.length; x++){ rewardSub+=args[x]+' '; } rewardSub=rewardSub.slice(0,-1); }
        rewardSub=rewardSub.toLowerCase();
        let rewardIndex=MAIN.qConfig.Quest_Rewards.toString().toLowerCase().split(','), qIndex=rewardIndex.indexOf(rewardSub);
        if(qIndex<0){ return message.reply('You didn\'t provide a valid reward to remove. Type `'+prefix+'quest help` for available rewards.').then(m => m.delete(60000)).catch(console.error); }
        else{
          MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ?", [message.member.id], function (error, user, fields) {
            if(!user[0].quests){ return message.reply('You are not currently subscribed to '+MAIN.qConfig.Quest_Rewards[qIndex]+'.').then(m => m.delete(60000)).catch(console.error); }
            else{
              userSubs=user[0].quests.split(','); let sIndex=userSubs.indexOf(MAIN.qConfig.Quest_Rewards[qIndex]); userSubs.splice(sIndex,1);
            }
            userSubs=userSubs.toString();
            MAIN.database.query("UPDATE pokebot.users SET quests = ? WHERE user_id = ?", [userSubs,message.member.id], function (error, user, fields) {
              if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(15000)).catch(console.error); }
              else{ return message.reply('Success! You have successfully removed `'+MAIN.qConfig.Quest_Rewards[qIndex]+'` from your quest subscriptions.').then(m => m.delete(15000)).catch(console.error); }
            });
          });
        }
      } break;
    default: return;
  }
}
