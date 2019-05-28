const GeoTz = require('geo-tz');
const Discord = require('discord.js');
const Send_Nest = require('../embeds/nests.js');
const InsideGeojson = require('point-in-geopolygon');

module.exports.run = async (MAIN, message, prefix, discord) => {

  // DECLARE VARIABLES
  let nickname = '';

  // GET USER NICKNAME
  if(message.member.nickname){ nickname = message.member.nickname; } else{ nickname = message.member.user.username; }

  let requestAction = new Discord.RichEmbed()
    .setAuthor(nickname, message.member.user.displayAvatarURL)
    .setTitle('What Pokémon do you want a CP search string for?')
    .setFooter('Type the name of desired Poké, no command prefix required.');

  message.channel.send(requestAction).catch(console.error).then( msg => {
      initiate_collector(MAIN, 'start', message, msg, nickname, prefix, discord);
      if(MAIN.config.Tidy_Channel == 'ENABLED' && discord.command_channels.indexOf(message.channel.id) < 0 && discord.spam_channels.indexOf(message.channel.id) < 0){ return message.delete(); } else {
        return;
      }
  });
}

async function pokemon_view(MAIN, message, nickname, pokemon_w_form, prefix, discord){
  let guild = MAIN.guilds.get(message.guild.id);
  let pokemon_id = pokemon_w_form[0], form_id = pokemon_w_form[1];

  if(!form_id || form_id == 'NaN'){
    if(!MAIN.pokemon[pokemon_id].default_form){
      form_id = 0;
    } else{
      form_id = MAIN.pokemon[pokemon_id].default_form;
    }
  }

  let search_string = pokemon_id+'&', role_id = '';
  for(var level = 1; level <= 40; level++) {
    search_string += 'cp'+MAIN.CalculateCP(pokemon_id,form_id,15,15,15,level)+',';
  }
  search_string = search_string.slice(0,-1);
  if(discord.spam_channels.indexOf(message.channel.id) >= 0){
    return MAIN.Send_Embed('cp', 0, discord, search_string, role_id, message.channel.id);
  } else {
    guild.fetchMember(message.author.id).then( TARGET => {
      return TARGET.send(search_string).catch(console.error);
    });
  }
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
   if(MAIN.config.Tidy_Channel == 'ENABLED' && discord.command_channels.indexOf(message.channel.id) < 0 && discord.spam_channels.indexOf(message.channel.id) < 0){ message.delete(); }
   let pokemon_w_form = [], form = '';
   pokemon = capitalize(message.content);
   split = pokemon.split(' ');

   if (pokemon != 'NaN' && pokemon < 809) {
     collector.stop(pokemon);
   }
   for (key in MAIN.pokemon) {
      if (MAIN.pokemon[key].name === split[0]) {
        if (split[1]){
          form = capitalize(split[1]);
          if (split[2]){ form += ' '+capitalize(split[2]); }
          Object.keys(MAIN.pokemon[key].forms).forEach(function(name){
            if(MAIN.pokemon[key].forms[name].name == form){
              form = name;
            }
          });
        }
        pokemon_w_form[0] = key;
        pokemon_w_form[1] = form;
        collector.stop(pokemon_w_form);
        break;
      }
    }
    if (pokemon.toLowerCase() === 'cancel' || pokemon.toLowerCase() === 'time'){
      collector.stop(pokemon);
    } else { collector.stop('retry'); }
  });

  // COLLECTOR HAS BEEN ENDED
  collector.on('end', (collected,reason) => {

    // DELETE ORIGINAL MESSAGE
    msg.delete();
    switch(reason){
      case 'cancel': break;
      case 'time': if(source == 'start'){
        message.reply('Your subscription has timed out.').then(m => m.delete(5000)).catch(console.error);
      }
      case 'retry':
       message.reply('Please check your spelling, and retry.').then(m => m.delete(5000)).catch(console.error);
       let cmd = MAIN.Commands.get('cp');
       if(cmd){ return cmd.run(MAIN, message, prefix, discord); }
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
