const GeoTz = require('geo-tz');
const Discord = require('discord.js');
const Send_Dex = require('../embeds/dex.js');

module.exports.run = async (MAIN, message, prefix, discord) => {
  // DECLARE VARIABLES
  let nickname = '', park = '';

  // GET USER NICKNAME
  if(message.member.nickname){ nickname = message.member.nickname; } else{ nickname = message.member.user.username; }

  let requestAction = new Discord.RichEmbed()
    .setAuthor(nickname, message.member.user.displayAvatarURL)
    .setTitle('What Pokémon do you want to find out more about?')
    .setFooter('Type the name of desired Poké or Park, no command prefix required.');

  message.channel.send(requestAction).catch(console.error).then( msg => {
      initiate_collector(MAIN, 'start', message, msg, nickname, prefix, discord);
      if(MAIN.config.Tidy_Channel == 'ENABLED' && discord.command_channels.indexOf(message.channel.id) < 0 && discord.spam_channels.indexOf(message.channel.id) < 0){ return message.delete(); } else {
        return;
      }
  });

}

function pokemon_view(MAIN, message, nickname, pokemon, prefix, discord){
  new Promise(async function(resolve, reject) {
    Send_Dex.run(MAIN, message, pokemon, discord);
    return message.reply('Entry sent, check your inbox if not in the channel.')
    .then(m => m.delete(5000)).catch(console.error);
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
   if (pokemon != 'NaN' && pokemon < 809) {
     collector.stop(pokemon);
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
       let cmd = MAIN.Commands.get('dex');
       if(cmd){ return cmd.run(MAIN, message, prefix, discord); }
      break;
      default:
        return pokemon_view(MAIN, message, nickname, reason, prefix, discord);
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
