const Discord=require('discord.js');

module.exports.run = async (MAIN, message, args, prefix, city) => {

  // DECLARE VARIABLES
  let nickname = '', area_array = '', available_areas ='';

  MAIN.geofence.areas.forEach((area,index) => {
    if(city.name == area.city){
      area_array += area.name+',';
    }
  });

  // GET USER NICKNAME
  if(message.member.nickname){ nickname = message.member.nickname; } else{ nickname = message.member.user.username; }

  let requestAction = new Discord.RichEmbed()
    .setAuthor(nickname, message.member.user.displayAvatarURL)
    .setTitle('What would you like to do with your Area Subscriptions?')
    .setFooter('You can type \'view\', \'add\', or \'remove\'.');

  message.channel.send(requestAction).catch(console.error).then( msg => {

    // DEFINE COLLECTOR AND FILTER
    const filter = cMessage => cMessage.member.id==message.member.id;
    const collector = message.channel.createMessageCollector(filter, { time: 60000 });

    // FILTER COLLECT EVENT
    collector.on('collect', message => {
      switch(message.content.toLowerCase()){
        case 'add': collector.stop('add'); break;
        case 'remove': collector.stop('remove'); break;
        case 'view': collector.stop('view'); break;
        case 'cancel': collector.stop('cancel'); break;
        default: message.reply('`'+message.content+'` is not a valid option.').then(m => m.delete(5000)).catch(console.error);
      }
    });

    // COLLECTOR HAS BEEN ENDED
    collector.on('end', (collected,reason) => {

      // DELETE ORIGINAL MESSAGE
      msg.delete();
      switch(reason){
        case 'add': subscription_create(MAIN, message, nickname, prefix, area_array); break;
        case 'remove': subscription_remove(MAIN, message, nickname, area_array); break;
        case 'view': subscription_view(MAIN, message, nickname, area_array); break;
        default: return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error);
      }
    });
  });
}

// AREA VIEW FUNCTION
async function subscription_view(MAIN, message, nickname, prefix, area_array){
  MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ?", [message.member.id], function (error, user, fields) {

    // CREATE THE EMBED
    let area_subs = new Discord.RichEmbed()
      .setAuthor(nickname, message.member.user.displayAvatarURL)
      .setTitle('Area Subscriptions')
      .setDescription('Overall Status: `'+user[0].status+'`')
      .addField('Your Areas:', user[0].geofence.replace(/,/g,'\n'),false)
      .setFooter('You can type \'view\', \'add\', or \'remove\'.');

    // SEND THE EMBED
    message.channel.send(area_subs).catch(console.error).then( msg => {

      // DEFINE COLLECTOR AND FILTER
      const filter = cMessage => cMessage.member.id==message.member.id;
      const collector = message.channel.createMessageCollector(filter, { time: 30000 });

      // FILTER COLLECT EVENT
      collector.on('collect', message => {
        switch(message.content.toLowerCase()){
          case 'add': collector.stop('add'); break;
          case 'remove': collector.stop('remove'); break;
          case 'view': collector.stop('view'); break;
          case 'cancel': collector.stop('cancel'); break;
        }
      });
      // COLLECTOR HAS BEEN ENDED
      collector.on('end', (collected,reason) => {

        // DELETE ORIGINAL MESSAGE
        msg.delete();
        switch(reason){
          case 'cancel': return;
          case 'add': subscription_create(MAIN, message, nickname, prefix, area_array); break;
          case 'remove': subscription_remove(MAIN, message, nickname, prefix, area_array); break;
          case 'view': subscription_view(MAIN, message, nickname, prefix, area_array); break;
        }
      });
    });
  });
}

// SUBSCRIPTION CREATE FUNCTION
async function subscription_create(MAIN, message, nickname, prefix, area_array){

  console.log(area_array)

  // PULL THE USER'S SUBSCRITIONS FROM THE USER TABLE
  MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ?", [message.member.id], async function (error, user, fields) {

    // RETRIEVE POKEMON NAME FROM USER
    let sub = await sub_collector(MAIN, 'Name', nickname, message, 'Names are not case-sensitive. The Check denotes you are already subscribed to that Reward.', user[0].geofence, area_array);
    if(sub.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error); }
    else if(sub == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

    console.log('SUB: '+sub)

    // DEFINED VARIABLES
    let areas = user[0].geofence.split(',');
    let area_index = areas.indexOf(sub);

    // CHECK IF USER IS ALREADY SUBSCRIBED TO THE AREA OR NOT AND ADD
    if(area_index >= 0){ return message.reply('You are already subscribed to this Area.').then(m => m.delete(10000)).catch(console.error); }
    else{
      if(sub == 'ALL'){ areas = 'ALL'; }
      else if(user[0].geofence == 'ALL'){
        areas = [];
        areas.push(sub);
      }
      else{ areas.push(sub); }
    }

    // CONVERT TO STRING
    areas = areas.toString();

    console.log(areas);

    // UPDATE THE USER'S RECORD
    MAIN.database.query("UPDATE pokebot.users SET geofence = ? WHERE user_id = ?", [areas,message.member.id], function (error, user, fields) {
      if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(5000)).catch(console.error); }
      else{
        let subscription_success = new Discord.RichEmbed().setColor('00ff00')
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle(sub+' Subscription Complete!')
          .setDescription('Saved to the Pokébot Database.')
          .setFooter('You can type \'view\', \'add\', or \'remove\'.');
        return message.channel.send(subscription_success).then( msg => {

          // DEFINE COLLECTOR AND FILTER
          const filter = cMessage => cMessage.member.id==message.member.id;
          const collector = message.channel.createMessageCollector(filter, { time: 30000 });

          // FILTER COLLECT EVENT
          collector.on('collect', message => {
            switch(message.content.toLowerCase()){
              case 'add': collector.stop('add'); break;
              case 'remove': collector.stop('remove'); break;
              case 'view': collector.stop('view'); break;
              case 'cancel': collector.stop('cancel'); break;
            }
          });
          // COLLECTOR HAS BEEN ENDED
          collector.on('end', (collected,reason) => {

            // DELETE ORIGINAL MESSAGE
            msg.delete();
            switch(reason){
              case 'cancel': return;
              case 'add': subscription_create(MAIN, message, nickname, prefix, area_array); break;
              case 'remove': subscription_remove(MAIN, message, nickname, prefix, area_array); break;
              case 'view': subscription_view(MAIN, message, nickname, prefix, area_array); break;
            }
          });
        });
      }
    });
  });
}

// SUBSCRIPTION REMOVE FUNCTION
async function subscription_remove(MAIN, message, nickname, prefix, area_array){

  // PULL THE USER'S SUBSCRITIONS FROM THE USER TABLE
  MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ?", [message.member.id], async function (error, user, fields) {

    // RETRIEVE POKEMON NAME FROM USER
    let sub = await sub_collector(MAIN, 'Remove', nickname, message, 'Names are not case-sensitive.', user[0].geofence, area_array);
    if(sub.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'pokemon` to restart.').then(m => m.delete(5000)).catch(console.error); }
    else if(sub == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

    // DEFINED VARIABLES
    let index = quests.indexOf(sub);
    let quests = user[0].quests.split(',');
    let rewards = MAIN.q_config.Quest_Rewards.toString().toLowerCase().split(',');
    let reward_index = rewards.indexOf(sub.toLowerCase());

    // CHECK IF THE USER ALREADY HAS SUBSCRIPTIONS AND ADD
    if(!user[0].quests){
      return message.reply('You are not subscribed to any Quests.').then(m => m.delete(10000)).catch(console.error);
    }
    else{
      if(index < 0){ return message.reply('You are not subscribed to this Quest.').then(m => m.delete(10000)).catch(console.error); }
      else{ quests.splice(index,1); }
    }

    quests = quests.toString();

    // UPDATE THE USER'S RECORD
    MAIN.database.query("UPDATE pokebot.users SET quests = ? WHERE user_id = ?", [quests,message.member.id], function (error, user, fields) {
      if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(10000)).catch(console.error); }
      else{
        let subscription_success = new Discord.RichEmbed().setColor('00ff00')
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle(sub+' Subscription Removed!')
          .setFooter('Saved to the Pokébot Database.');
        return message.channel.send(subscription_success).then( msg => {

          // DEFINE COLLECTOR AND FILTER
          const filter = cMessage => cMessage.member.id==message.member.id;
          const collector = message.channel.createMessageCollector(filter, { time: 30000 });

          // FILTER COLLECT EVENT
          collector.on('collect', message => {
            switch(message.content.toLowerCase()){
              case 'add': collector.stop('add'); break;
              case 'remove': collector.stop('remove'); break;
              case 'view': collector.stop('view'); break;
              case 'cancel': collector.stop('cancel'); break;
            }
          });
          // COLLECTOR HAS BEEN ENDED
          collector.on('end', (collected,reason) => {

            // DELETE ORIGINAL MESSAGE
            msg.delete();
            switch(reason){
              case 'cancel': return;
              case 'add': subscription_create(MAIN, message, nickname, prefix, area_array); break;
              case 'remove': subscription_remove(MAIN, message, nickname, prefix, area_array); break;
              case 'view': subscription_view(MAIN, message, nickname, prefix, area_array); break;
            }
          });
        });
      }
    });
  });
}

// SUB COLLECTOR FUNCTION
function sub_collector(MAIN, type, nickname, message, requirements, sub, area_array){
  return new Promise(function(resolve, reject) {


    // DELCARE VARIABLES
    let timeout = true, instruction = '';

    // DEFINE COLLECTOR AND FILTER
    const filter = cMessage => cMessage.member.id == message.member.id;
    const collector = message.channel.createMessageCollector(filter, { time: 120000 });

    switch(type){

      // POKEMON NAME EMBED
      case 'Name':
        let user_areas = sub.split(','), area_list = '';
        area_array = area_array.split(',');

        console.log(area_array)


        // CREATE REWARD LIST AND ADD CHECK FOR SUBSCRIBED REWARDS

          area_array.forEach((area,index) => {
            if(user_areas.indexOf(area) >= 0){
              area_list += area+' '+MAIN.emotes.checkYes+'\n';
            }
            else{ area_list += area+'\n'; }
          });

        instruction = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('What Area would you like to Subscribe to?')
          .addField('Available Areas:', area_list, false)
          .setFooter(requirements); break;

      // REMOVEAL EMBED
      case 'Remove':
        instruction = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('What Area do you want to remove?')
          .addField('Your Quests:', user_quests, false)
          .setFooter(requirements); break;
    }

    message.channel.send(instruction).catch(console.error).then( msg => {

      // FILTER COLLECT EVENT
      collector.on('collect', message => {
        switch(true){
          case message.content.toLowerCase() == 'cancel': collector.stop('cancel'); break;

          // POKEMON NAME
          case type.indexOf('Name')>=0:
          case type.indexOf('Remove')>=0:
            if(message.content.toLowerCase() == 'all'){ collector.stop('ALL'); break; }
            for(let a = 0; a < area_array.length+1; a++){
              if(a == area_array.length+1){ message.reply('`'+message.content+'` doesn\'t appear to be a valid Area. Please check the spelling and try again.').then(m => m.delete(5000)).catch(console.error); break; }
              else if(message.content.toLowerCase() == area_array[a].toLowerCase()){ collector.stop(area_array[a]); break; }
            } break;
        }
      });

      // COLLECTOR ENDED
      collector.on('end', (collected,reason) => {
        msg.delete(); resolve(reason);
      });
    });
  });
}
