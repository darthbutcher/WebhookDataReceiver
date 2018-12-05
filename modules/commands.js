const Discord=require('discord.js');
const fs=require('fs');
const config=require('../config/pokebot_config.json');

//#############################################################//
//#############################################################//
//    _____ ____  __  __ __  __          _   _ _____   _____   //
//   / ____/ __ \|  \/  |  \/  |   /\   | \ | |  __ \ / ____|  //
//  | |   | |  | | \  / | \  / |  /  \  |  \| | |  | | (___    //
//  | |   | |  | | |\/| | |\/| | / /\ \ | . ` | |  | |\___ \   //
//  | |___| |__| | |  | | |  | |/ ____ \| |\  | |__| |____) |  //
//   \_____\____/|_|  |_|_|  |_/_/    \_\_| \_|_____/|_____/   //
//       SUBSCRIPTIONS AND BOT ADMINISTRATION COMMANDS         //
//#############################################################//
//#############################################################//

module.exports.run = async (MAIN, message) => {
  let userSubs='', userAreas='', iv='', level='';
  if(message.content=='.quests'){ questStatus(message); }
  else if(message.channel.id!=config.Sub_Channel){ return; }
  else if(message.author.bot==true){ return; }
  else if(!message.content.startsWith(config.PREFIX)){ return message.reply('All commands in this channel must start with `'+config.PREFIX+'`. Type `'+config.PREFIX+'help` for assistance.').then(m => m.delete(60000)).catch(console.error); }
  else{
    console.log(message.author.bot);
    if(!message.author.bot){ message.delete(); }
    let args=message.content.toLowerCase().split(' ').slice(1);
    MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ?", [message.member.id], function (error, user, fields) {
      // CHECK IF THE USER HAS AN EXISTING RECORD IN THE USER TABLE
      if(!user || !user[0]){ MAIN.Save_Sub(message); }
      else{
        // let command=message.content.toLowerCase().split(' ')[0].slice(config.PREFIX.length);
        // let cmd=MAIN.commands.get(command);
        // if(cmd){ return cmd.run(BOT, message, config); }

        // HELP COMMAND
        if(message.content.startsWith(config.PREFIX+'subhelp') || message.content.startsWith(config.PREFIX+'help')){
          if(args[0]=='admin'){
            let questHelp=new Discord.RichEmbed().setColor('00ff00')
              .setAuthor('Admin Commands:')
              .addField('`'+config.PREFIX+'config quest add [QUEST]`', 'Adds a quest that can be subscribed to.', false)
              .addField('`'+config.PREFIX+'config quest remove [QUEST]`', 'Removes a quest from being subscribed to', false);
            return message.channel.send(questHelp).then(m => m.delete(30000)).catch(console.error);
          }
          else{
            let questHelp=new Discord.RichEmbed().setColor('00ff00')
              .setAuthor('Available Subscription Commands:')
              .addField('`'+config.PREFIX+'mysubs`', 'Shows your current subscriptions and settings.', false);
            if(MAIN.qConfig.Subscriptions=='ENABLED'){ questHelp.addField('`'+config.PREFIX+'quest help`', 'Shows **Quest** subscription options.', false); }
            if(MAIN.pConfig.Subscriptions=='ENABLED'){ questHelp.addField('`'+config.PREFIX+'pokemon help` | NOT YET ACTIVE', 'Shows **Pokémon** subscription options.', false); }
            if(MAIN.rConfig.Subscriptions=='ENABLED'){ questHelp.addField('`'+config.PREFIX+'raid help` | NOT YET ACTIVE', 'Shows **Raid** subscription options.', false); }
            questHelp.addField('`'+config.PREFIX+'area help`', 'Shows **Area** subscription options.', false)
              .addField('`'+config.PREFIX+'time help`', 'Shows **Quest** subscription delivery time options.', false)
              .addField('`'+config.PREFIX+'pause` | `'+config.PREFIX+'resume`', 'Pause or Resume your subscription alerts.', false);
            return message.channel.send(questHelp).then(m => m.delete(30000)).catch(console.error);
          }
        }

        // SUBSCRIPTION SUMMARY COMMAND
        if(message.content.startsWith(config.PREFIX+'mysubs')){
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

        // SUBSCRIBE TO A QUEST COMMAND
        if(message.content.startsWith(config.PREFIX+'quest')){
          let rewardSub='', userSubs='';
          switch(args[0]){
            case undefined:
            case 'help':
              let availableRewards=MAIN.qConfig.Quest_Rewards.toString().replace(/,/g,'\n');
              let questHelp=new Discord.RichEmbed().setColor('00ff00')
                .addField('Reward Subscription Commands:', '`'+config.PREFIX+'quest add [REWARD]`\n`'+config.PREFIX+'quest remove [REWARD]`\n(Quest Rewards are NOT case sensitive.)')
                .addField('Available Rewards to Subscribe to:', availableRewards);
              return message.channel.send(questHelp).then(m => m.delete(60000)).catch(console.error);
            case 'add':
              if(!args[1]){ message.reply('You didn\'t not specify a reward to subscribe to.').then(m => m.delete(60000)).catch(console.error); }
              else{
                if(!args[2]){ rewardSub=args[1]; } else{ for(x=1; x<args.length; x++){ rewardSub+=args[x]+' '; } rewardSub=rewardSub.slice(0,-1); }
                rewardSub=rewardSub.toLowerCase();
                let rewardIndex=MAIN.qConfig.Quest_Rewards.toString().toLowerCase().split(','), qIndex=rewardIndex.indexOf(rewardSub);
                if(qIndex<0){ return message.reply('You didn\'t provide a valid reward to subscribe to. Type `'+config.PREFIX+'quest help` for available rewards.').then(m => m.delete(60000)).catch(console.error); }
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
                if(qIndex<0){ return message.reply('You didn\'t provide a valid reward to remove. Type ``'+config.PREFIX+'quest help` for available rewards.').then(m => m.delete(60000)).catch(console.error); }
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

        // SET AREAS COMMAND
        if(message.content.startsWith(config.PREFIX+'area')){
          var availableAreas='', subArea='', areaArray='';
          for(let gf=0; gf<MAIN.geofence.areas.length; gf++){
            availableAreas+=MAIN.geofence.areas[gf].name+'\n';
            areaArray+=MAIN.geofence.areas[gf].name+',';
          }
          areaArray=areaArray.split(',');
          switch(args[0]){
            case undefined:
            case 'help':
              let areaHelp=new Discord.RichEmbed().setColor('00ff00')
                .addField('Area Subscription Commands:', '`'+config.PREFIX+'area add [AREA]`\n`'+config.PREFIX+'area remove [AREA]`')
                .addField('Available Areas to Subscribe to:', availableAreas);
              return message.channel.send(areaHelp).then(m => m.delete(60000)).catch(console.error);
            case 'add':
              if(!args[1]){ message.reply('You didn\'t not specify an area to subscribe to.').then(m => m.delete(15000)).catch(console.error); }
              else{
                if(!args[2]){ subArea=args[1]; } else{ for(x=1; x<args.length; x++){ subArea+=args[x]+' '; } subArea=subArea.slice(0,-1); }
                subArea=subArea.toLowerCase();
                let subIndex=areaArray.toString().toLowerCase().split(','), sIndex=subIndex.indexOf(subArea);
                if(sIndex<0){ return message.reply('You didn\'t provide a valid area to subscribe to. Type ``'+config.PREFIX+'area help` for available areas.').then(m => m.delete(60000)).catch(console.error); }
                else{
                  MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ?", [message.member.id], function (error, user, fields) {
                    if(!user[0].geofence || user[0].geofence=='ALL'){ userAreas=[]; userAreas.push(areaArray[sIndex]); }
                    else if(areaArray[sIndex]=='ALL'){ userAreas='ALL'; }
                    else{
                      userAreas=user[0].geofence.split(',');
                      if(userAreas.indexOf(areaArray[sIndex])>=0){
                        return message.reply('You are already subscribed to this area.').then(m => m.delete(15000)).catch(console.error);
                      }
                      else{ userAreas.push(areaArray[sIndex]); }
                    }
                    userAreas=userAreas.toString();
                    MAIN.database.query("UPDATE pokebot.users SET geofence = ? WHERE user_id = ?", [userAreas,message.member.id], function (error, user, fields) {
                      if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(15000)).catch(console.error); }
                      else{ return message.reply('Success! You have successfully added `'+areaArray[sIndex]+'` to your areas to receive subscriptions.').then(m => m.delete(15000)).catch(console.error); }
                    });
                  });
                }
              } break;
            case 'remove':
              if(!args[1]){ message.reply('You didn\'t not specify an area to remove.').then(m => m.delete(15000)).catch(console.error); }
              else{
                // GET ALL ARGUMENTS TO COMBINE INTO THE AREA NAME STRING
                if(!args[2]){ subArea=args[1]; } else{ for(x=1; x<args.length; x++){ subArea+=args[x]+' '; } subArea=subArea.slice(0,-1); }

                // CHECK THE AREA ARRAY FOR THE AREA NAME
                subArea=subArea.toLowerCase();
                let subIndex=areaArray.toString().toLowerCase().split(','), sIndex=subIndex.indexOf(subArea);
                if(sIndex<0){ message.reply('You didn\'t provide a valid area to remove. Type ``'+config.PREFIX+'area help` for available areas.').then(m => m.delete(60000)).catch(console.error); }
                else{
                  MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ?", [message.member.id], function (error, user, fields) {
                    if(!user[0].geofence){ return message.reply('You are not currently subscribed to any areas.').then(m => m.delete(15000)).catch(console.error); }
                    else{
                      userAreas=user[0].geofence.split(',');
                      if(userAreas.indexOf(areaArray[sIndex])<0){ return message.reply('You are not subscribed to that area.').then(m => m.delete(15000)).catch(console.error); }
                      else{  userAreas=userAreas.splice(sIndex,1); }
                      userAreas=userAreas.toString();
                      MAIN.database.query("UPDATE pokebot.users SET geofence = ? WHERE user_id = ?", [userAreas,message.member.id], function (error, user, fields) {
                        if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(15000)).catch(console.error); }
                        else{ return message.reply('Success! You have successfully removed `'+areaArray[sIndex]+'` from your area subscriptions.').then(m => m.delete(15000)).catch(console.error); }
                      });
                    }
                  });
                }
              } break;
            default: return;
          }
        }

        // NOTIFICATION TIME
        if(message.content.startsWith(config.PREFIX+'time')){
          let alertTimes=[ '6:00','6:15','6:30','6:45','7:00','7:15','7:30','7:45','8:00','8:15','8:30','8:45','9:00','9:15','9:30','9:45','10:00','10:15','10:30','10:45','11:00']
          switch(args[0]){
            case undefined:
            case 'help':
              let areaHelp=new Discord.RichEmbed().setColor('00ff00')
                .addField('Alert Time Set Command:', '`'+config.PREFIX+'time [TIME]`\n`'+config.PREFIX+'time 7:45`\nAlerts must be in increments of :15 and between the hours of 6:00 and 11:00 (AM).')
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

        // ADD A QUEST TO THE CONFIG
        if(message.content.startsWith(config.PREFIX+'config')){
          if(message.member.hasPermission('ADMINISTRATOR')){
            switch(args[0]){
              case 'quest':
                let newConfig=MAIN.qConfig; args=message.content.split(' ').slice(1);
                let newQuest=''; if(!args[3]){ newQuest=args[2]; } else{ for(x=2; x<args.length; x++){ newQuest+=args[x]+' '; } newQuest=newQuest.slice(0,-1); }
                switch(args[1]){
                  case 'add':
                    newConfig.Quest_Rewards.push(newQuest); MAIN.qConfig=newConfig;
                    fs.writeFile("./config/quest_config.json",JSON.stringify(newConfig,null,4),"utf8",function(err){if(err)throw err;});
                    return message.reply(newQuest+' has been added to Quest_Rewards in the config.').then(m => {
                      setTimeout(function() {
                        MAIN.qConfig=newConfig;
                        m.delete(); fs.writeFile("./config/quest_config.json",JSON.stringify(newConfig,null,4),"utf8",function(err){if(err)throw err;});
                      }, 15000);
                    }).catch(console.error);
                  case 'remove':
                    let qIndex=newConfig.Quest_Rewards.indexOf(newQuest); newConfig.Quest_Rewards.splice(qIndex,1); MAIN.qConfig=newConfig;
                    return message.reply(newQuest+' has been removed from Quest_Rewards in the config.').then(m => {
                      setTimeout(function() {
                        m.delete(); fs.writeFile("./config/quest_config.json",JSON.stringify(newConfig,null,4),"utf8",function(err){if(err)throw err;});
                      }, 15000);
                    }).catch(console.error);
                  default: return;
                }
              case 'pokemon':
              case 'raids':
              default: return;
            }
          }
          else{ return message.reply('You do not have permission to use that command.').then(m => m.delete(15000)).catch(console.error); }
        }

        // PAUSE SUBSCRIPTIONS COMMAND
        if(message.content==config.PREFIX+'pause'){
          MAIN.database.query("UPDATE pokebot.users SET paused = ? WHERE user_id = ?", ['YES',message.member.id], function (error, user, fields) {
            if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(15000)).catch(console.error); }
            else{ return message.reply('All of your subscriptions are now `PAUSED`.').then(m => m.delete(15000)).catch(console.error); }
          });
        }

        // RESUME SUBSCRIPTIONS COMMAND
        if(message.content==config.PREFIX+'resume'){
          MAIN.database.query("UPDATE pokebot.users SET paused = ? WHERE user_id = ?", ['NO',message.member.id], function (error, user, fields) {
            if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(15000)).catch(console.error); }
            else{ return message.reply('All of your subscriptions are now `ACTIVE`.').then(m => m.delete(15000)).catch(console.error); }
          });
        }

        // RESTART THE BOT
        if(message.content==config.PREFIX+'r'){ process.exit(1).catch(console.error); }
      }
    });
  } return;
}

// SEND STATUS
function sendStatus(bot, delay, message, THEBOT){
	setTimeout(function() {
		if(bot=='ALL SYSTEMS ARE GO'){
			let botStatus=new Discord.RichEmbed().setColor('00ff00')
				.setAuthor(bot);
			message.channel.send(botStatus).catch( error => { console.error('[LINE575]',error); });
		}
		else{
			let botStatus=new Discord.RichEmbed().setColor('00ccff')
				.setAuthor('Pokébot '+bot+', Standing By.')
			message.channel.send(botStatus).catch( error => { console.error('[LINE580]',error); });
		}
	}, delay);
}
