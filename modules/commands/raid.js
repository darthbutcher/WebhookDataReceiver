const fs = require('fs');
const ini = require('ini');
const path = require('path');
const MySQL = require('mysql');
const Fuzzy = require('fuzzy');
const Discord = require('discord.js');
const InsideGeojson = require('point-in-geopolygon');
const config = ini.parse(fs.readFileSync(path.join(__dirname, '../../config/config.ini'), 'utf-8'));

module.exports.run = async (MAIN, message, prefix, discord) => {

  // LOAD ALL GYMS WITHIN DISCORD GEOFENCE TO AN ARRAY FOR FUZZY
  let available_gyms = [], gym_collection = new Discord.Collection();
  await MAIN.gym_array.forEach((gym,index) => {
    if(InsideGeojson.polygon(discord.geofence, [gym.lon,gym.lat])){
      available_gyms.push(gym.name); gym_collection.set(gym.name, gym);
    }
  });

  // GET USER NICKNAME
  let nickname = '';
  if(message.member.nickname){ nickname = message.member.nickname; } else{ nickname = message.member.user.username; }

  let request_action = new Discord.RichEmbed()
    .setAuthor(nickname, message.member.user.displayAvatarURL)
    .setTitle('What would you like to do with your Raid Subscriptions?')
    .setDescription('`view`  »  View your Subscritions.\n'
                   +'`add`  »  Create a Simple Subscription.\n'
                   +'`remove`  »  Remove a Raid Subscription.\n'
                   +'`pause` or `resume`  »  Pause/Resume Raid Subscriptions Only.')
    .setFooter('Type the action, no command prefix required.');

  message.channel.send(request_action).catch(console.error).then( msg => {
      return initiate_collector(MAIN, 'start', message, msg, nickname, prefix, available_gyms, discord, gym_collection);
  });
}

// PAUSE OR RESUME POKEMON SUBSCRIPTIOONS
function subscription_status(MAIN, message, nickname, reason, prefix, available_gyms, discord, gym_collection){
  MAIN.pdb.query(`SELECT * FROM users WHERE user_id = ? AND discord_id = ?`, [message.member.id, message.guild.id], function (error, user, fields) {
    if(user[0].raids_status == 'ACTIVE' && reason == 'resume'){
      let already_active = new Discord.RichEmbed().setColor('ff0000')
        .setAuthor(nickname, message.member.user.displayAvatarURL)
        .setTitle('Your Raid subscriptions are already **Active**!')
        .setFooter('You can type \'view\', \'add\', or \'remove\'.');

      // SEND THE EMBED
      message.channel.send(already_paused).catch(console.error).then( msg => {
        return initiate_collector(MAIN, 'view', message, msg, nickname, prefix, available_gyms, discord, gym_collection);
      });
    }
    else if(user[0].raids_status == 'PAUSED' && reason == 'pause'){
      let already_paused = new Discord.RichEmbed().setColor('ff0000')
        .setAuthor(nickname, message.member.user.displayAvatarURL)
        .setTitle('Your Raid subscriptions are already **Paused**!')
        .setFooter('You can type \'view\', \'add\', or \'remove\'.');

      // SEND THE EMBED
      message.channel.send(already_paused).catch(console.error).then( msg => {
        return initiate_collector(MAIN, 'view', message, msg, nickname, prefix, available_gyms, discord, gym_collection);
      });
    }
    else{
      if(reason == 'pause'){ change = 'PAUSED'; }
      if(reason == 'resume'){ change = 'ACTIVE'; }
      MAIN.pdb.query('UPDATE users SET raids_status = ? WHERE user_id = ? AND discord_id = ?', [change, message.member.id, message.guild.id], function (error, user, fields) {
        if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(10000)).catch(console.error); }
        else{
          let subscription_success = new Discord.RichEmbed().setColor('00ff00')
            .setAuthor(nickname, message.member.user.displayAvatarURL)
            .setTitle('Your Raid subscriptions have been set to `'+change+'`!')
            .setFooter('Saved to the Pokébot Database.');
          return message.channel.send(subscription_success).then(m => m.delete(5000)).catch(console.error);
        }
      });
    }
  });
}

// SUBSCRIPTION REMOVE FUNCTION
async function subscription_view(MAIN, message, nickname, prefix, available_gyms, discord, gym_collection){
  MAIN.pdb.query(`SELECT * FROM users WHERE user_id = ? AND discord_id = ?`, [message.member.id, message.guild.id], function (error, user, fields) {

    // CHECK IF THE USER ALREADY HAS SUBSCRIPTIONS AND ADD
    if(!user[0].raids){
      let no_subscriptions = new Discord.RichEmbed().setColor('00ff00')
        .setAuthor(nickname, message.member.user.displayAvatarURL)
        .setTitle('You do not have any Raid Subscriptions!')
        .setFooter('You can type \'view\', \'add\', or \'remove\'.');

      // SEND THE EMBED
      message.channel.send(no_subscriptions).catch(console.error).then( msg => {
        return initiate_collector(MAIN, 'view', message, msg, nickname, prefix, available_gyms, discord, gym_collection);
      });
    }
    else{

      let raid = JSON.parse(user[0].raids), raid_levels = '';
      if(!raid.subscriptions[0]){

        // CREATE THE EMBED AND SEND
        let no_subscriptions = new Discord.RichEmbed().setColor('00ff00')
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('You do not have any Subscriptions!')
          .setFooter('You can type \'view\', \'add\', or \'remove\'.');
        message.channel.send(no_subscriptions).catch(console.error).then( msg => {
          return initiate_collector(MAIN, 'view', message, msg, nickname, prefix, available_gyms, discord, gym_collection);
        });
      }
      else{

        // CREATE THE EMBED
        let raid_subs = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('Raid Boss Subscriptions')
          .setDescription('Overall Status: `'+user[0].status+'`\nRaids Status: `'+user[0].raids_status+'`')
          .setFooter('You can type \'view\', \'add\', or \'remove\'.');

        // TURN EACH SUBSCRIPTION INTO A FIELD
        raid.subscriptions.forEach((sub,index) => {
          if(sub.gym != 'All' && sub.boss != 'All'){
            title = '#'+(index+1)+' '+sub.boss;
            body = 'Gym: '+sub.gym+'\nFiltered by Areas: `'+sub.areas+'`';
          } else if(sub.gym != 'All' && sub.boss == 'All' && sub.min_lvl == '1' && sub.ax_lvl == '5'){
            title = '#'+(index+1)+' '+sub.gym;
            body = 'All Levels`\nFiltered by Areas: `'+sub.areas+'`';
          } else if(sub.gym != 'All' && sub.boss == 'All'){
            title = '#'+(index+1)+' '+sub.gym;
            body = 'Min/Max Lvl: `'+sub.min_lvl+'/'+sub.max_lvl+'`\nFiltered by Areas: `'+sub.areas+'`';
          } else if(sub.gym == 'All' && sub.boss != 'All'){
            title = '#'+(index+1)+' '+sub.boss;
            body = 'All Gyms\nFiltered by Areas: `'+sub.areas+'`';
          } else if(sub.gym == 'All' && sub.boss == 'All'){
            if(sub.min_lvl == sub.max_lvl){
              title = '#'+(index+1)+' Level '+sub.max_lvl+' Raids';
            } else{
              title = '#'+(index+1)+' Level '+sub.min_lvl+' - '+sub.max_lvl+' Raids';
            } body = '**All Gyms**\nFiltered by Areas: `'+sub.areas+'`';
          } else{
            title = '#'+(index+1);
            body = 'Gym: `'+sub.gym+'`\nRaid Boss: `'+sub.boss+'`\nMin/Max Lvl: `'+sub.min_lvl+'/'+sub.max_lvl+'`\nFiltered by Areas: `'+sub.areas+'`';
          }

          raid_subs.addField( title, body, false);
        });

        // SEND THE EMBED
        message.channel.send(raid_subs).catch(console.error).then( msg => {
          return initiate_collector(MAIN, 'view', message, msg, nickname, prefix, available_gyms, discord, gym_collection);
        });
      }
    }
  });
}

// SUBSCRIPTION CREATE FUNCTION
async function subscription_create(MAIN, message, nickname, prefix, advanced, available_gyms, discord, gym_collection){

  // DEFINED THE SUBSCRIPTION OBJECT
  let sub = {}, got_name = false;

  // RETRIEVE GYM NAME FROM USER
  do {
    sub.gym = await sub_collector(MAIN, 'Gym', nickname, message, undefined, 'Respond with \'All\'  or a Gym name. Names are not case-sensitive.', sub, available_gyms, discord, gym_collection);
    if(sub.gym == 'cancel'){ return subscription_cancel(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection); }
    else if(sub.gym == 'time'){ return subscription_timedout(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection); }
    else{
      if(sub.gym == 'All'){ sub.gym = 'All'; got_name = true; }
      else if(!Array.isArray(sub.gym) && sub.gym.split(',')[0] == 'fuzzy'){
        console.log(sub.gym);
        console.log(sub.gym.split(',')[1]);
        let results = Fuzzy.filter(sub.gym.split(',')[1], available_gyms);
        let matches = results.map(function(el) { return el.string; });
        if(!matches[0]){
          message.reply('`'+sub.gym+'`, does not closely match any gym in the database.').then(m => m.delete(5000)).catch(console.error);
        } else{
          let user_choice = await match_collector(MAIN, 'Matches', nickname, message, matches, 'Type the number of the Correct Gym.', sub, available_gyms, discord, gym_collection);
          if(sub.gym == 'cancel'){ return subscription_cancel(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection); }
          else if(sub.gym == 'time'){ return subscription_timedout(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection); }
          else{
            let collection_match = gym_collection.get(matches[user_choice]);
            if(collection_match){
              sub.id = collection_match.id;
              sub.gym = collection_match.name;
              got_name = true;
            }
          }
        }
      }
      else if(sub.gym.length > 1){
        let user_choice = await match_collector(MAIN, 'Multiple', nickname, message, sub.gym, 'Type the number of the Correct Gym.', sub, available_gyms, discord, gym_collection);
        if(sub.gym == 'cancel'){ return subscription_cancel(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection); }
        else if(sub.gym == 'time'){ return subscription_timedout(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection); }
        else{
          sub.id = sub.gym[user_choice].id;
          sub.gym = sub.gym[user_choice].name;
          got_name = true;
        }
      } else{
        sub.id = sub.gym[0].id;
        sub.gym = sub.gym[0].name;
        got_name = true;
      }
    }
  } while(got_name == false);

  // RETRIEVE BOSS NAME FROM USER
  sub.boss = await sub_collector(MAIN,'Name',nickname,message, undefined,'Respond with \'All\'  or the Raid Boss\'s name. Names are not case-sensitive.', sub,available_gyms, discord, gym_collection);
  if(sub.boss == 'cancel'){ return subscription_cancel(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection); }
  else if(sub.boss == 'time'){ return subscription_timedout(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection); }

  if(sub.boss == 'All'){
    // RETRIEVE MIN LEVEL FROM USER
    sub.min_lvl = await sub_collector(MAIN,'Minimum Level',nickname,message,sub.boss,'Please respond with a value of 1 through 5 or type \'All\'. Type \'Cancel\' to Stop.', sub, available_gyms, discord, gym_collection);
    if(sub.min_lvl == 'cancel'){ return subscription_cancel(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection); }
    else if(sub.min_lvl == 'time'){ return subscription_timedout(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection); }

    // RETRIEVE MIN LEVEL FROM USER
    sub.max_lvl = await sub_collector(MAIN,'Maximum Level',nickname,message,sub.boss,'Please respond with a value of 1 through 5 or type \'All\'. Type \'Cancel\' to Stop.', sub, available_gyms, discord, gym_collection);
    if(sub.max_lvl == 'cancel'){ return subscription_cancel(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection); }
    else if(sub.max_lvl == 'time'){ return subscription_timedout(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection); }
  }
  else{ sub.min_lvl = 'Boss Specified'; sub.max_lvl = 'Boss Specified'; }

  // RETRIEVE AREA CONFIRMATION FROM USER IF NOT FOR A SPECIFIC GYM
  if(sub.gym == 'All'){
    sub.areas = await sub_collector(MAIN, 'Area Filter', nickname, message, sub.boss, 'Please respond with \'Yes\' or \'No\'', sub, available_gyms, discord, gym_collection);
    if(sub.areas == 'cancel'){ return subscription_cancel(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection); }
    else if(sub.areas == 'time'){ return subscription_timedout(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection); }
  }
  else{ sub.areas = 'Gym Specified'; }

  // RETRIEVE CONFIRMATION FROM USER
  let confirm = await sub_collector(MAIN, 'Confirm-Add', nickname, message, sub.boss, 'Type \'Yes\' or \'No\'. Subscription will be saved.', sub, available_gyms, discord, gym_collection);
  if(confirm == 'cancel' || confirm == 'no'){ return subscription_cancel(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection); }
  else if(confirm == 'time'){ return subscription_timedout(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection); }

  // PULL THE USER'S SUBSCRITIONS FROM THE USER TABLE
  MAIN.pdb.query(`SELECT * FROM users WHERE user_id = ? AND discord_id = ?`, [message.member.id, message.guild.id], async function (error, user, fields) {
    let raid = '';
    // CHECK IF THE USER ALREADY HAS SUBSCRIPTIONS AND ADD
    if(!user[0].raids){
      raid = {};
      raid.subscriptions = [];
      raid.subscriptions.push(sub);
    } else{
      raid = JSON.parse(user[0].raids);
      if(!raid.subscriptions[0]){ raid.subscriptions.push(sub); }
      else{
        // CONVERT TO OBJECT AND CHECK EACH SUBSCRIPTION
        raid = JSON.parse(user[0].raids);
        raid.subscriptions.forEach((subscription,index) => {

          // ADD OR OVERWRITE IF EXISTING
          if(subscription.boss == sub.boss && subscription.gym == sub.gym){
            raid.subscriptions[index] = sub;
          }
          else if(index == raid.subscriptions.length-1){ raid.subscriptions.push(sub); }
        });
      }
    }

    // STRINGIFY THE OBJECT
    let new_subs = JSON.stringify(raid);

    // UPDATE THE USER'S RECORD
    MAIN.pdb.query(`UPDATE users SET raids = ? WHERE user_id = ? AND discord_id = ?`, [new_subs, message.member.id, message.guild.id], function (error, user, fields) {
      if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(10000)).catch(console.error); }
      else{
        let subscription_success = new Discord.RichEmbed().setColor('00ff00')
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle(sub.boss+' Raid Subscription Complete!')
          .setDescription('Saved to the Pokébot Database.')
          .setFooter('You can type \'view\', \'add\', or \'remove\'.');
        message.channel.send(subscription_success).then( msg => {
          return initiate_collector(MAIN, 'create', message, msg, nickname, prefix, available_gyms, discord, gym_collection);
        });
      }
    });
  });
}

// SUBSCRIPTION REMOVE FUNCTION
async function subscription_remove(MAIN, message, nickname, prefix, available_gyms, discord, gym_collection){

  // FETCH USER FROM THE USERS TABLE
  MAIN.pdb.query(`SELECT * FROM users WHERE user_id = ? AND discord_id = ?`, [message.member.id, message.guild.id], async function (error, user, fields) {

    // END IF USER HAS NO SUBSCRIPTIONS
    if(!user[0].raids){

      // CREATE THE RESPONSE EMBED
      let no_subscriptions = new Discord.RichEmbed().setColor('00ff00')
        .setAuthor(nickname, message.member.user.displayAvatarURL)
        .setTitle('You do not have any Raid Subscriptions!')
        .setFooter('You can type \'view\', \'add\', or \'remove\'.');

      // SEND THE EMBED
      message.channel.send(no_subscriptions).catch(console.error).then( msg => {
        return initiate_collector(MAIN, 'view', message, msg, nickname, prefix, available_gyms, discord, gym_collection);
      });
    }
    else {

      // PARSE THE STRING TO AN OBJECT
      let raids = JSON.parse(user[0].raids), found = false, embed_title = '';

      // FETCH NAME OF POKEMON TO BE REMOVED AND CHECK RETURNED STRING
      let remove_id = await sub_collector(MAIN,'Remove',nickname,message,raids,'Type the Number of the Subscription you want to remove.', undefined);

      switch(remove_id.toLowerCase()){
        case 'time': return subscription_cancel(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection);
        case 'cancel': return subscription_timedout(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection);
        case 'all':

          // CONFIRM THEY REALL MEANT TO REMOVE ALL
          let confirm = await sub_collector(MAIN, 'Confirm-Remove', nickname, message, remove_id, 'Type \'Yes\' or \'No\'. Subscription will be saved.', undefined);
          if(confirm.toLowerCase() == 'cancel' || confirm.toLowerCase() == 'no'){ return subscription_cancel(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection); }
          else if(confirm == 'time'){ return subscription_timedout(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection); }

          // MARK AS FOUND AND WIPE THE ARRAY
          raids.subscriptions = []; break;
          embed_title = 'All Subscriptions Removed!';

        default:
          // REMOVE THE SUBSCRIPTION
          raids.subscriptions.splice((remove_id-1),1);
          embed_title = 'Subscription #'+remove_id+' Removed!'
      }

      // STRINGIFY THE OBJECT
      let new_subs = JSON.stringify(raids);

      // UPDATE THE USER'S RECORD
      MAIN.pdb.query(`UPDATE users SET raids = ? WHERE user_id = ? AND discord_id = ?`, [new_subs, message.member.id, message.guild.id], function (error, user, fields) {
        if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(10000)).catch(console.error); }
        else{
          let subscription_success = new Discord.RichEmbed().setColor('00ff00')
            .setAuthor(nickname, message.member.user.displayAvatarURL)
            .setTitle(embed_title)
            .setDescription('Saved to the Pokébot Database.')
            .setFooter('You can type \'view\', \'add\', or \'remove\'.');
          return message.channel.send(subscription_success).then( msg => {
            return initiate_collector(MAIN, 'remove', message, msg, nickname, prefix, available_gyms, discord, gym_collection);
          });
        }
      });
    }
  });
}

// SUB COLLECTOR FUNCTION
function sub_collector(MAIN, type, nickname, message, object, requirements, sub, available_gyms, discord, gym_collection){
  return new Promise(function(resolve, reject) {

    // DELCARE VARIABLES
    let timeout = true, instruction = '';

    // DEFINE COLLECTOR AND FILTER
    const filter = cMessage => cMessage.member.id == message.member.id;
    const collector = message.channel.createMessageCollector(filter, { time: 30000 });

    switch(type){

      // POKEMON NAME EMBED
      case 'Name':
        instruction = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('What Raid Boss would you like to Subscribe to?')
          .setFooter(requirements); break;

      // GYM NAME EMBED
      case 'Gym':
        instruction = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('What Gym would you like to Subscribe to?')
          .setFooter(requirements); break;

      // CONFIRMATION EMBED
      case 'Confirm-Add':
        if(object.min_lvl == 'Boss Specified'){ raid_levels = 'Boss Specified'; }
        else{ raid_levels = sub.min_lvl+'/'+sub.max_lvl; }
        instruction = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('Does all of this look correct?\nGym: `'+sub.gym+'`\nRaid Boss: `'+sub.boss+'`\nMin/Max Lvl: `'+raid_levels+'`\nFilter By Areas: `'+sub.areas+'`')
          .setFooter(requirements); break;

      case 'Confirm-Remove':
        instruction = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('Are you sure you want to Remove ALL of your subscriptions?')
          .setFooter(requirements); break;


      // REMOVEAL EMBED
      case 'Remove':
        instruction = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('Which Raid Subscription do you want to remove?')
          .setFooter(requirements);

        // TURN EACH SUBSCRIPTION INTO A FIELD
        object.subscriptions.forEach((raid,index) => {
          if(raid.min_lvl == 'Boss Specified'){ raid_levels = 'Boss Specified'; }
          else{ raid_levels = raid.min_lvl+'/'+raid.max_lvl; }
          instruction.addField('#'+(index+1), 'Gym: `'+raid.gym+'`\nRaid Boss: `'+raid.boss+'`\nMin/Max Lvl: `'+raid_levels+'`\nFiltered by Areas: '+raid.areas, false);
        }); break;

      // AREA EMBED
      case 'Area Filter':
        instruction = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('Do you want to get notifications for '+object+' Raids filtered by your subscribed Areas?')
          .setDescription('If you choose **Yes**, your notifications for this Raid Boss will be filtered based on your areas. If you choose **No**, you will get notifications for this pokemon in ALL areas for the city.')
          .setFooter(requirements); break;

      // DEFAULT EMBED
      default:
        instruction = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('What **'+type+'** would like you like to set for **'+object+'** Raid Notifications?')
          .setFooter(requirements);
    }

    message.channel.send(instruction).catch(console.error).then( msg => {

      // DEFINED VARIABLES
      let input = '';

      // FILTER COLLECT EVENT
      collector.on('collect', message => {
        switch(true){

          // CANCEL SUB
          case message.content.toLowerCase() == 'stop':
          case message.content.toLowerCase() == 'cancel': collector.stop('cancel'); break;

          // GYM NAME
          case type.indexOf('Gym') >= 0:
            if(message.content.toLowerCase() == 'all'){ collector.stop('All'); }
            else{
              MAIN.rdmdb.query(`SELECT * FROM gym WHERE name = ?`, [message.content], async function (error, gyms, fields) {
                if(!gyms){ return collector.stop('fuzzy,'+message.content); }
                else{
                  await gyms.forEach((gym,index) => {
                    if(!InsideGeojson.polygon(discord.geofence, [gym.lon,gym.lat])){ gyms.splice(index,1); }
                  });
                  if(gyms[0]){ return collector.stop(gyms); }
                  else{ return collector.stop('fuzzy,'+message.content); }
                }
              });
            } break;

          // GET CONFIRMATION
          case type.indexOf('Area Filter') >= 0:
          case type.indexOf('Confirm-Add') >= 0:
          case type.indexOf('Confirm-Remove') >= 0:
            if(message.content.toLowerCase() == 'yes'){ collector.stop('Yes'); }
            else if(message.content.toLowerCase() == 'no'){ collector.stop('No'); }
            else{ message.reply('`'+message.content+'` is an Invalid Input. '+requirements).then(m => m.delete(5000)).catch(console.error); } break;

          // POKEMON NAME
          case type.indexOf('Name') >= 0:
            switch(message.content.toLowerCase()){
              case 'all': collector.stop('All'); break;
              default:
                for(let p = 1; p < 723; p++){
                  if(p == 722){ message.reply('`'+message.content+'` doesn\'t appear to be a valid Raid Boss name. Please check the spelling and try again.').then(m => m.delete(5000)).catch(console.error); }
                  else if(message.content.toLowerCase() == MAIN.pokemon[p].name.toLowerCase()){ return collector.stop(MAIN.pokemon[p].name); }
                }
            } break;

          // SUBSCRIPTION NUMBER
          case type.indexOf('Remove') >= 0:
            if(message.content > 0 && message.content <= object.subscriptions.length){ collector.stop(message.content); }
            else{ message.reply('`'+message.content+'` is an Invalid Input. '+requirements).then(m => m.delete(5000)).catch(console.error); }
            break;

          // MIN/MAX LEVEL CONFIGURATION
          case type.indexOf('Level') >= 0:
            if(parseInt(message.content) >= 1 && parseInt(message.content) <= 5){ collector.stop(message.content); }
            else if(message.content.toLowerCase() == 'all'){ collector.stop('All'); }
            else{ message.reply('`'+message.content+'` is an Invalid Input. '+requirements).then(m => m.delete(5000)).catch(console.error); }
            break;
        }
      });

      // COLLECTOR ENDED
      collector.on('end', (collected,reason) => {
        msg.delete();
        return resolve(reason);
      });
    });
  });
}

function subscription_cancel(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection){
  let subscription_cancel = new Discord.RichEmbed().setColor('00ff00')
    .setAuthor(nickname, message.member.user.displayAvatarURL)
    .setTitle('Subscription Cancelled.')
    .setDescription('Nothing has been Saved.')
    .setFooter('You can type \'view\', \'add\', or \'remove\'.');
  message.channel.send(subscription_cancel).then( msg => {
    return initiate_collector(MAIN, 'cancel', message, msg, nickname, prefix, available_gyms, discord, gym_collection);
  });
}

function subscription_timedout(MAIN, nickname, message, prefix, available_gyms, discord, gym_collection){
  let subscription_cancel = new Discord.RichEmbed().setColor('00ff00')
    .setAuthor(nickname, message.member.user.displayAvatarURL)
    .setTitle('Subscription Timed Out.')
    .setDescription('Nothing has been Saved.')
    .setFooter('You can type \'view\', \'add\', or \'remove\'.');
  message.channel.send(subscription_cancel).then( msg => {
    return initiate_collector(MAIN, 'time', message, msg, nickname, prefix, available_gyms, discord, gym_collection);
  });
}

function initiate_collector(MAIN, source, message, msg, nickname, prefix, available_gyms, discord, gym_collection){
  // DEFINE COLLECTOR AND FILTER
  const filter = cMessage => cMessage.member.id == message.member.id;
  const collector = message.channel.createMessageCollector(filter, { time: 60000 });

  // FILTER COLLECT EVENT
  collector.on('collect', message => {
    switch(message.content.toLowerCase()){
      case 'add advanced':
      case 'add': collector.stop('add'); break;
      case 'remove': collector.stop('remove'); break;
      case 'view': collector.stop('view'); break;
      case 'pause': collector.stop('pause'); break;
      case 'resume': collector.stop('resume'); break;
      default: collector.stop('end');
    }
  });

  // COLLECTOR HAS BEEN ENDED
  collector.on('end', (collected,reason) => {

    // DELETE ORIGINAL MESSAGE
    msg.delete();
    switch(reason){
      case 'cancel': resolve('cancel'); break;
      case 'add': subscription_create(MAIN, message, nickname, prefix, false, available_gyms, discord, gym_collection); break;
      case 'remove': subscription_remove(MAIN, message, nickname, prefix, available_gyms, discord, gym_collection); break;
      case 'view': subscription_view(MAIN, message, nickname, prefix, available_gyms, discord, gym_collection); break;
      case 'resume':
      case 'pause': subscription_status(MAIN, message, nickname, reason, prefix, available_gyms, discord, gym_collection); break;
      default:
        if(source == 'start'){
          message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error);
        }
    } return;
  });
}

async function match_collector(MAIN, type, nickname, message, object, requirements, sub, available_gyms, discord, gym_collection){
  return new Promise(async function(resolve, reject) {
    let options = '';
    switch(type){

      // REMOVEAL EMBED
      case 'Matches':
        let match_desc = '';
        object.forEach((match,index) => {
          match_desc += (index+1)+'. '+match+'\n';
        });
        options = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('Possible matches for \''+sub.gym.split(',')[1]+'\' were found.')
          .setDescription(match_desc)
          .setFooter('Type the number of the gym you wish to select or type \'cancel\'.'); break;

      // REMOVEAL EMBED
      case 'Multiple':
        let description = await get_objects(MAIN,object,discord);
        options = new Discord.RichEmbed()
          .setAuthor(nickname, message.member.user.displayAvatarURL)
          .setTitle('Multiple Matches were found.').setDescription(description)
          .setFooter('Type the number of the gym you wish to select or type \'cancel\'.'); break;
    }

    // DEFINE COLLECTOR AND FILTER
    const filter = cMessage => cMessage.member.id == message.member.id;
    const collector = message.channel.createMessageCollector(filter, { time: 30000 });

    message.channel.send(options).catch(console.error).then( msg => {

      // FILTER COLLECT EVENT
      collector.on('collect', message => {
        if(parseInt(message.content) >= 1 && parseInt(message.content) <= object.length){
          collector.stop(parseInt(message.content)-1);
        }
        else if(message.content.toLowerCase() == 'cancel'){ collector.stop('cancel'); }
        else{ message.reply('`'+message.content+'` is not a valid selection.').then(m => m.delete(5000)).catch(console.error); }
      });

      collector.on('end', (collected,reason) => {
        msg.delete();
        return resolve(reason);
      });
    });
  });
}

function get_objects(MAIN, objects, discord){
  return new Promise(function(resolve, reject) {
    let selections = '';
    objects.forEach((match,index) => {
      let main_area = '', sub_area = '';
      if(discord.geojson_file){
        let geofence = MAIN.Geofences.get(discord.geojson_file);
        geofence.features.forEach((geo,index) => {
          if(InsideGeojson.polygon(geo.geometry.coordinates, [match.lon,match.lat])){
            if(geo.properties.sub_area != 'true'){ main_area = geo.properties.name; }
            else if(geo.properties.sub_area == 'false'){  sub_area = geo.properties.name; }
          }
        });
        if(sub_area){ selections += (index+1)+'. '+match.name+' | '+sub_area+'\n'; }
        else if(main_area){ selections += (index+1)+'. '+match.name+' | '+main_area+'\n'; }
        else{ selections += (index+1)+'. '+match.name; }
      }
      else{ selections += (index+1)+'. '+match.name; }
    });
    return resolve(selections);
  });
}
