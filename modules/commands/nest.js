const GeoTz = require('geo-tz');
const Discord = require('discord.js');
const Send_Nest = require('../embeds/nests.js');

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
      initiate_collector(MAIN, 'start', message, msg, nickname, prefix, discord);
      if(MAIN.config.Tidy_Channel == 'ENABLED' && discord.command_channels.indexOf(message.channel.id) < 0 && discord.spam_channels.indexOf(message.channel.id) < 0){ return message.delete(); } else {
        return;
      }
  });
}

function pokemon_view(MAIN, message, nickname, name, search_area, prefix, discord){
  new Promise(async function(resolve, reject) {
    MAIN.pmsf.query(`SELECT * FROM nests WHERE pokemon_id = ?`, [name],function (error, nests, fields) {
          let nest_found = false;
          asyncForEach(nests, async (nest) => {
            let timezone = GeoTz(discord.geofence[0][1][1], discord.geofence[0][1][0])[0]; discord_match = true;
            area = await MAIN.Get_Area(MAIN, nest.lat,nest.lon, discord).catch(console.log);
            if (area){
              if (search_area == area.embed_area || search_area == 'ALL') {
                Send_Nest.run(MAIN, message, nest, discord, area.embed_area, timezone);
                message.reply('Nest sent as a message, check your inbox.')
                .then(m => m.delete(5000)).catch(console.error);
                nest_found = true;
              }
            }
          }).then( not => { if (nest_found === false) {
            message.reply('No known nest, please retry.')
            .then(m => m.delete(5000)).catch(console.error)
          } })
          return;
    })
  });
}

function park_view(MAIN, message, nickname, name, search_area, prefix, discord){
  new Promise(async function(resolve, reject) {
    MAIN.pmsf.query(`SELECT * FROM nests WHERE name LIKE ?`, [name],function (error, nests, fields) {
      MAIN.pdb.query(`SELECT * FROM users WHERE user_id = ?`, [message.author.id],async function (error, users, fields){
        if(!users || !users[0]){ users.push({bot: '0'}); await MAIN.Save_Sub(message,discord); }
        users.forEach(async function(user) {
          let nest_found = false;
          message.author.bot = user.bot;
          asyncForEach(nests, async (nest) => {
            let timezone = GeoTz(discord.geofence[0][1][1], discord.geofence[0][1][0])[0]; discord_match = true;
            area = await MAIN.Get_Area(MAIN, nest.lat,nest.lon, discord).catch(console.log);
            if (area){
              if (search_area == area.embed_area || search_area == 'ALL') {
                Send_Nest.run(MAIN, message, nest, discord, area.embed_area, timezone);
                message.reply('Nest sent, check your inbox if not in the channel.')
                .then(m => m.delete(5000)).catch(console.error);
                nest_found = true;
              }
            }
          }).then( not => { if (nest_found === false) {
            message.reply('No known nest, please retry.')
            .then(m => m.delete(5000)).catch(console.error)
          } })
        });
        return;
      });
    })
  });
}

async function initiate_collector(MAIN, source, message, msg, nickname, prefix, discord){
  // DEFINE COLLECTOR AND FILTER
  const filter = cMessage => cMessage.member.id == message.member.id;
  const collector = message.channel.createMessageCollector(filter, { time: 60000 });
  let msg_count = 0;

  // FILTER COLLECT EVENT
  await collector.on('collect', message => {
   if(MAIN.config.Tidy_Channel == 'ENABLED' && discord.command_channels.indexOf(message.channel.id) < 0 && discord.spam_channels.indexOf(message.channel.id) < 0){ message.delete(); }
   pokemon = capitalize(message.content);
   park = message.content.toLowerCase();
   if (pokemon != 'NaN' && pokemon < 809) {
     collector.stop(pokemon);
   }
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
    if (pokemon.toLowerCase() === 'cancel' || pokemon.toLowerCase() === 'time'){
      collector.stop(pokemon);
    } else { collector.stop('retry'); }
  });

  // COLLECTOR HAS BEEN ENDED
  collector.on('end', async (collected,reason) => {

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
        return park_view(MAIN, message, nickname, park, 'ALL', prefix, discord);
      break;
      default:
        return pokemon_view(MAIN, message, nickname, reason, 'ALL',prefix, discord);
    }
    return;
  });
}

const capitalize = (s) => {
 if (typeof s !== 'string') {return '';}
 s = s.toLowerCase();
 return s.charAt(0).toUpperCase() + s.slice(1)
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
