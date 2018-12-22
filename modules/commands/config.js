const Discord=require('discord.js');

module.exports.run = async (MAIN, message, args, prefix) => {
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
