const GeoTz = require('geo-tz');
const Discord = require('discord.js');
const Send_Nest = require('../embeds/nests.js');
const InsideGeojson = require('point-in-geopolygon');

module.exports.run = async (MAIN, message, prefix, discord) => {

  // DECLARE VARIABLES
  let nickname = '', park = '';

  // GET USER NICKNAME
  if(message.member.nickname){ nickname = message.member.nickname; } else{ nickname = message.member.user.username; }

  let requestAction = new Discord.RichEmbed()
    .setAuthor(nickname, message.member.user.displayAvatarURL)
    .setTitle('What Pokémon or Park do you want to find a nest for?')
    .setFooter('Type the name of desired Poké or Park, no command prefix required.');

  message.channel.send(requestAction).catch(console.error).then( msg => {
      return initiate_collector(MAIN, 'start', message, msg, nickname, prefix, discord);
  });

}

async function pokemon_view(MAIN, message, nickname, pokemon, prefix, discord){
  MAIN.pmsf.query(`SELECT * FROM nests WHERE pokemon_id = ?`, [pokemon], function (error, nests, fields) {
      let nest_found = false;
      nests.forEach(function(nest) {
        let timezone = GeoTz(discord.geofence[0][1][1], discord.geofence[0][1][0])[0]; discord_match = true;
        Send_Nest.run(MAIN, message, nest, discord, timezone);
        message.reply('Nest sent as a message, check your inbox.')
        .then(m => m.delete(5000)).catch(console.error);
        nest_found = true;
      });
      if (nest_found === false) {
        message.reply('No known nest, please retry.')
        .then(m => m.delete(5000)).catch(console.error);
      }
      return;
  });
}

async function park_view(MAIN, message, nickname, park, prefix, discord){
  MAIN.pmsf.query(`SELECT * FROM nests WHERE name LIKE ?`, [park], function (error, nests, fields) {
      let nest_found = false;
      nests.forEach(function(nest) {
        let timezone = GeoTz(discord.geofence[0][1][1], discord.geofence[0][1][0])[0]; discord_match = true;
        Send_Nest.run(MAIN, message, nest, discord, timezone);
        message.reply('Nest sent as a message, check your inbox.')
        .then(m => m.delete(5000)).catch(console.error);
        nest_found = true;
      });
      if (nest_found === false) {
        message.reply('No known nest, please retry.')
        .then(m => m.delete(5000)).catch(console.error);
      }
      return;
  });
}

function subscription_timedout(MAIN, nickname, message, prefix){
  let subscription_cancel = new Discord.RichEmbed().setColor('00ff00')
    .setAuthor(nickname, message.member.user.displayAvatarURL)
    .setTitle('Your Subscription Has Timed Out.')
    .setFooter('You can type \'view\', \'add\', \'add adv\', \'remove\', or \'edit\'.');
  message.channel.send(subscription_cancel).then( msg => {
    return initiate_collector(MAIN, 'time', message, msg, nickname, prefix, discord);
  });
}

async function initiate_collector(MAIN, source, message, msg, nickname, prefix, discord){
  // DEFINE COLLECTOR AND FILTER
  const filter = cMessage => cMessage.member.id == message.member.id;
  const collector = message.channel.createMessageCollector(filter, { time: 60000 });
  let msg_count = 0;

  // FILTER COLLECT EVENT
  await collector.on('collect', message => {
   pokemon = capitalize(message.content);
   park = message.content.toLowerCase();

   for (key in MAIN.park_array) {
      if (MAIN.park_array[key].name.toLowerCase() === park) {
        collector.stop('park');
        break;
      }
    }
   for (key in MAIN.pokemon) {
      if (MAIN.pokemon[key].name === pokemon) {
        pokemon = key;
        collector.stop(pokemon);
        break;
      }
    }
    collector.stop('retry');
  });

  // COLLECTOR HAS BEEN ENDED
  collector.on('end', (collected,reason) => {

    // DELETE ORIGINAL MESSAGE
    msg.delete();
    switch(reason){
      case 'cancel': resolve('cancel'); break;
      case 'time': if(source == 'start'){
        message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error);
      }
      case 'retry':
       message.reply('Please check your spelling, and retry.').then(m => m.delete(5000)).catch(console.error);
       let cmd = MAIN.Commands.get('nest');
       if(cmd){ return cmd.run(MAIN, message, prefix, discord); }
      break;
      case 'park':
        park_view(MAIN, message, nickname, park, prefix, discord);
      break;
      default:
        pokemon_view(MAIN, message, nickname, reason, prefix, discord);
    } return;
  });
}
const capitalize = (s) => {
 if (typeof s !== 'string') {return '';}
 s = s.toLowerCase();
 return s.charAt(0).toUpperCase() + s.slice(1)
}
