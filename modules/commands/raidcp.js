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
    .setTitle('What Pokémon do you want a CP seatch string for?')
    .setFooter('Type the name of desired Poké, no command prefix required.');

  message.channel.send(requestAction).catch(console.error).then( msg => {
      initiate_collector(MAIN, 'start', message, msg, nickname, prefix, discord);
      if(MAIN.config.Tidy_Channel == 'ENABLED' && discord.command_channels.indexOf(message.channel.id) < 0 && discord.spam_channels.indexOf(message.channel.id) < 0){ return message.delete(); } else {
        return;
      }
  });

}

async function pokemon_view(MAIN, message, nickname, pokemon, prefix, discord){
  let guild = MAIN.guilds.get(message.guild.id);

  let result_string = '```', role_id = '';
  let pokemon_name = MAIN.pokemon[pokemon].name;
  let pokemon_color = '', form = '', level = 20;
  let pokemon_type = '', weaknesses = '';
  for(var atk = 15; atk >= 13; atk--) {
    for(var def = 15; def >= 13; def--) {
      for(var sta = 15; sta >= 13; sta--) {
        iv_percent = Math.round((atk + def + sta) / 45 * 100);
        result_string += atk+','+def+','+sta+'  '+MAIN.CalculateCP(pokemon,form,atk,def,sta,level)+' CP  '+iv_percent+'%\n';
      }
    }
  }
  result_string += '```';
  MAIN.pokemon[pokemon].types.forEach((type) => {
    pokemon_type += MAIN.emotes[type.toLowerCase()]+' '+type+' / ';
    MAIN.types[type.toLowerCase()].weaknesses.forEach((weakness,index) => {
      if(weaknesses.indexOf(MAIN.emotes[weakness.toLowerCase()]) < 0){
        weaknesses += MAIN.emotes[weakness.toLowerCase()]+' ';
      }
    });
    pokemon_color = MAIN.Get_Color(type, pokemon_color);
  });
  pokemon_type = pokemon_type.slice(0,-3);
  weaknesses = weaknesses.slice(0,-1);

  let sprite = await MAIN.Get_Sprite(form, pokemon);
  let chart_embed = new Discord.RichEmbed()
  .setColor(pokemon_color)
  .setThumbnail(sprite)
  .setTitle('**'+pokemon_name+'** '+pokemon_type)
  .setDescription('**(ATK,DEF,STA)\t\t LvL'+level+' CP\t\t%**'+result_string);

  if(discord.spam_channels.indexOf(message.channel.id) >= 0){
    return MAIN.Send_Embed('chart', 0, discord, role_id, chart_embed, message.channel.id);
  } else {
    guild.fetchMember(message.author.id).then( TARGET => {
      return TARGET.send(chart_embed).catch(console.error);
    });
  }
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
       break;
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
