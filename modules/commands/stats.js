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
    .setTitle('What Pokémon do you want stats for?')
    .setFooter('Type the name of desired Poké, no command prefix required.');

  message.channel.send(requestAction).catch(console.error).then( msg => {
      return initiate_collector(MAIN, 'start', message, msg, nickname, prefix, discord);
  });

}

async function pokemon_view(MAIN, message, nickname, pokemon, prefix, discord){
  message.reply('Searching... this may take a minute. You\'ll get a DM').then(m => m.delete(5000)).catch(console.error);
  MAIN.pdb.query(`SELECT * FROM users WHERE user_id = ?`, [message.author.id], function (error, users, fields){
    users.forEach(async function(user) {
      MAIN.rdmdb.query(`SELECT * FROM pokemon WHERE pokemon_id = ? AND first_seen_timestamp >= UNIX_TIMESTAMP()-3600`, [pokemon], function (error, stats, fields) {
        let pokemon_count = 0;
        stats.forEach(function(stat) {
          pokemon_count += 1;
        });
        pokemon_name = MAIN.pokemon[pokemon].name;
        stat_message = 'There have been '+pokemon_count+' '+pokemon_name+' seen in the last hour.';
        return MAIN.Send_DM(user.discord_id, user.user_id,stat_message, user.bot);
      });
    })
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
       let cmd = MAIN.Commands.get('stats');
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
