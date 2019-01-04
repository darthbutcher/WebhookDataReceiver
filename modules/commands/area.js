const Discord = require('discord.js');
const insideGeofence = require('point-in-polygon');
const insideGeojson = require('point-in-geopolygon');

module.exports.run = async (MAIN, message, args, prefix, server) => {

  // DECLARE VARIABLES
  let nickname = '', area_array = '', available_areas ='';

  await MAIN.geofences.features.forEach((geofence,index) => {
    if(insideGeofence([geofence.geometry.coordinates[0][0][1],geofence.geometry.coordinates[0][0][0]], discord.geofence)){
      if(geofence.properties.name){ area_array += geofence.properties.name+','; }
    }
  }); area_array = area_array.slice(0,-1);

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
        case 'remove': subscription_remove(MAIN, message, nickname, prefix, area_array); break;
        case 'view': subscription_view(MAIN, message, nickname, prefix, area_array); break;
        default: return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error);
      }
    });
  });
}

// AREA VIEW FUNCTION
async function subscription_view(MAIN, message, nickname, prefix, area_array){
  MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ? AND discord_id = ?", [message.member.id, message.guild.id], function (error, user, fields) {

    let area_list = '';
    if(!user[0].geofence){ area_list = 'None'; }
    else{ area_list = user[0].geofence.replace(/,/g,'\n'); }

    // CREATE THE EMBED
    let area_subs = new Discord.RichEmbed()
      .setAuthor(nickname, message.member.user.displayAvatarURL)
      .setTitle('Area Subscriptions')
      .setDescription('Overall Status: `'+user[0].status+'`')
      .addField('Your Areas:', '**'+area_list+'**', false)
      .setFooter('You can type \'view\', \'add\', or \'remove\'.');

    // SEND THE EMBED
    message.channel.send(area_subs).catch(console.error).then( msg => {

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
          default: collector.stop('end');
        }
      });

      // COLLECTOR HAS BEEN ENDED
      collector.on('end', (collected,reason) => {

        // DELETE ORIGINAL MESSAGE
        msg.delete();

        switch(reason){
          case 'add': subscription_create(MAIN, message, nickname, prefix, area_array); break;
          case 'remove': subscription_remove(MAIN, message, nickname, prefix, area_array); break;
          case 'view': subscription_view(MAIN, message, nickname, prefix, area_array); break;
          case 'end': return;
        }
      });
    });
  });
}

// SUBSCRIPTION CREATE FUNCTION
async function subscription_create(MAIN, message, nickname, prefix, area_array){

  // PULL THE USER'S SUBSCRITIONS FROM THE USER TABLE
  MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ? AND discord_id = ?", [message.member.id, message.guild.id], async function (error, user, fields) {

    // RETRIEVE AREA NAME FROM USER
    let sub = await sub_collector(MAIN, 'Name', nickname, message, 'Names are not case-sensitive. The Check denotes you are already subscribed to that Area.', user[0].geofence, area_array);
    if(sub.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'area` to restart.').then(m => m.delete(5000)).catch(console.error); }
    else if(sub == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

    // DEFINED VARIABLES
    let areas = user[0].geofence.split(',');
    let area_index = areas.indexOf(sub);

    // CHECK IF USER IS ALREADY SUBSCRIBED TO THE AREA OR NOT AND ADD
    if(area_index >= 0){ return message.reply('You are already subscribed to this Area.').then(m => m.delete(10000)).catch(console.error); }
    else{
      if(sub == 'all'){ areas = server.default_geofence; }
      else if(user[0].geofence == server.default_geofence || user[0].geofence == 'None'){
        areas = []; areas.push(sub);
      }
      else{ areas.push(sub); }
    }

    // CONVERT TO STRING
    areas = areas.toString();

    // UPDATE THE USER'S RECORD
    MAIN.database.query("UPDATE pokebot.users SET geofence = ? WHERE user_id = ? AND discord_id = ?", [areas, message.member.id, message.guild.id], function (error, user, fields) {
      if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(5000)).catch(console.error); }
      else{
        let subscription_success = new Discord.RichEmbed().setColor('00ff00')
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle(sub+' Area Added!')
          .setDescription('Saved to the Pokébot Database.')
          .setFooter('You can type \'view\', \'add\', or \'remove\'.');
        return message.channel.send(subscription_success).then( msg => {

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
              default: collector.stop('end');
            }
          });

          // COLLECTOR HAS BEEN ENDED
          collector.on('end', (collected,reason) => {

            // DELETE ORIGINAL MESSAGE
            msg.delete();
            switch(reason){
              case 'add': subscription_create(MAIN, message, nickname, prefix, area_array); break;
              case 'remove': subscription_remove(MAIN, message, nickname, prefix, area_array); break;
              case 'view': subscription_view(MAIN, message, nickname, prefix, area_array); break;
              case 'end': return;
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
  MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ? AND discord_id = ?", [message.member.id, message.guild.id], async function (error, user, fields) {

    // RETRIEVE AREA NAME FROM USER
    let sub = await sub_collector(MAIN, 'Name', nickname, message, 'Names are not case-sensitive. The Check denotes you are already subscribed to that Area.', user[0].geofence, area_array);
    if(sub.toLowerCase() == 'cancel'){ return message.reply('Subscription cancelled. Type `'+prefix+'area` to restart.').then(m => m.delete(5000)).catch(console.error); }
    else if(sub == 'time'){ return message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error); }

    // DEFINED VARIABLES
    let areas = user[0].geofence.split(',');
    let area_index = areas.indexOf(sub);

    // CHECK IF USER IS ALREADY SUBSCRIBED TO THE AREA OR NOT AND ADD
    if(area_index < 0){ return message.reply('You are not subscribed to this Area.').then(m => m.delete(10000)).catch(console.error); }
    else{ areas.splice(area_index,1); }

    if(areas.length == 0){ areas = 'None'; }
    else{ areas = areas.toString(); }

    // UPDATE THE USER'S RECORD
    MAIN.database.query(`UPDATE pokebot.users SET geofence = ? WHERE user_id = ? AND discord_id = ?`, [areas, message.member.id, message.guild.id], function (error, user, fields) {
      if(error){ console.error(error); return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(10000)).catch(console.error); }
      else{
        let subscription_success = new Discord.RichEmbed().setColor('00ff00')
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle(sub+' Area Removed!')
          .setFooter('Saved to the Pokébot Database.');
        return message.channel.send(subscription_success).then( msg => {

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
              default: collector.stop('end');
            }
          });

          // COLLECTOR HAS BEEN ENDED
          collector.on('end', (collected,reason) => {

            // DELETE ORIGINAL MESSAGE
            msg.delete();
            switch(reason){
              case 'add': subscription_create(MAIN, message, nickname, prefix, area_array); break;
              case 'remove': subscription_remove(MAIN, message, nickname, prefix, area_array); break;
              case 'view': subscription_view(MAIN, message, nickname, prefix, area_array); break;
              case 'end': return;
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

    let user_areas = sub.split(','), area_list = '';
    area_array = area_array.split(',');
    // CREATE REWARD LIST AND ADD CHECK FOR SUBSCRIBED REWARDS
    area_array.forEach((area,index) => {
      if(user_areas.indexOf(area) >= 0){
        area_list += area+' '+MAIN.emotes.checkYes+'\n';
      }
      else{ area_list += area+'\n'; }
    });

    switch(type){

      // AREA NAME EMBED
      case 'Name':
        instruction = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('What Area would you like to Subscribe to?')
          .addField('Available Areas:', '**'+area_list+'**', false)
          .setFooter(requirements); break;

      // REMOVEAL EMBED
      case 'Remove':
        instruction = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('What Area do you want to remove?')
          .addField('Your Areas:', '**'+area_list+'**', false)
          .setFooter(requirements); break;
    }

    message.channel.send(instruction).catch(console.error).then( msg => {

      // FILTER COLLECT EVENT
      collector.on('collect', message => {
        switch(true){
          case message.content.toLowerCase() == 'cancel': collector.stop('cancel'); break;

          // AREA NAME
          case type.indexOf('Name')>=0:
          case type.indexOf('Remove')>=0:
            if(message.content.toLowerCase() == 'all'){ collector.stop('all'); break; }
            for(let a = 0; a < area_array.length+1; a++){
              if(a == area_array.length){ message.reply('`'+message.content+'` doesn\'t appear to be a valid Area. Please check the spelling and try again.').then(m => m.delete(5000)).catch(console.error); break; }
              else if(message.content.toLowerCase() == area_array[a].toLowerCase()){ collector.stop(area_array[a]); break; }
            } break;
        }
      });

      // COLLECTOR ENDED
      collector.on('end', (collected,reason) => {
        msg.delete();
        resolve(reason);
      });
    });
  });
}
