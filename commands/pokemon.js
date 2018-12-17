const Discord=require('discord.js');

module.exports.run = async (MAIN, message, args, prefix) => {
  switch(args[0]){

    // HELP COMMAND OR NO ARGS GIVEN
    case undefined:
    case 'help':
      let availableRewards = MAIN.qConfig.Quest_Rewards.toString().replace(/,/g,'\n');
      let pokemonHelp = new Discord.RichEmbed().setColor('00ff00')
        .addField('Pokémon Subscription Command:', '`'+prefix+'pokemon [Pokémon Name]`\nThis command begins the filter setting process.')
        .setFooter('Type \'Cancel\' to cancel the subscription process.');
      return message.channel.send(pokemonHelp).then(m => m.delete(60000)).catch(console.error);

    // PAUSE POKEMON SUBSCRIPTIONS
    case 'pause':
      MAIN.database.query("UPDATE pokebot.users SET pokemon_paused = ? WHERE user_id = ?", ['PAUSED',message.member.id], function (error, user, fields) {
        if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(5000)).catch(console.error); }
        else{ return message.reply('Your Pokémon subscriptions are now `PAUSED`.').then(m => m.delete(5000)).catch(console.error); }
      }); break;

    // RESUME POKEMON SUBSCRIPTIONS
    case 'resume':
      MAIN.database.query("UPDATE pokebot.users SET pokemon_paused = ? WHERE user_id = ?", ['ACTIVE',message.member.id], function (error, user, fields) {
        if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(5000)).catch(console.error); }
        else{ return message.reply('Your Pokémon subscriptions are now `ACTIVE`.').then(m => m.delete(5000)).catch(console.error); }
      }); break;

    // CHECK FOR POKEMON AND INITIATE COLLECTOR SEQUENCE
    default:
      for(let p=1;p<723;p++){
        if(args[0].toLowerCase() == MAIN.pokemon[p].name.toLowerCase()){
          createSubscription(MAIN, message, p); break;
        }
        else if(p==722){
          return message.reply('That doesn\'t appear to be a valid Pokémon name. Please check the spelling and try again.').then(m => m.delete(5000)).catch(console.error);
        }
      }
  }
}

async function createSubscription(MAIN, message, num){

  // DEFINE VARIABLES
  var pokemonName = MAIN.pokemon[num].name;

  let min_cp = await sub_collector('Minimum CP',message,pokemonName,'Please respond with a number greater than 0 or \'All\'.');
  let min_iv = await sub_collector('Minimum IV',message,pokemonName,'Please respond with a IV number between 0 and 100, specify minimum Atk/Def/Sta (15/14/13) Values or type \'All\'.');
  let min_lvl = await sub_collector('Minimum Level',message,pokemonName,'Please respond with a value between 0 and 35 or type \'All\'.');
  let max_lvl = await sub_collector('Maximum Level',message,pokemonName,'Please respond with a value between 0 and 35 or type \'All\'.');
  let gender = await sub_collector('Gender',message,pokemonName,'Please respond with \'Male\' or \'Female\' or type \'All\'.');



}

function sub_collector(type,message,pokemon,requirements){
  return new Promise(function(resolve, reject) {

    let timeout = true;

    // DEFINE COLLECTOR AND FILTER
    const filter = cMessage => cMessage.member.id==message.member.id;
    const collector = message.channel.createMessageCollector(filter, { time: 120000 });

    let initiateSub=new Discord.RichEmbed().setColor('00ff00')
      .setAuthor(MAIN.pokemon[p].name+' Subscription Setup Initiated for '+message.member.user.tag, message.member.user.displayAvatarURL)
      .setDescription(message.member+', what '+type+' would like you like to set for '+pokemon+' Notifications?')
      .setFooter(requirements);
    message.channel.send(initiateSub).catch(console.error).then( msg => {

      // FILTER COLLECT EVENT
      collector.on('collect', message => {
        switch(true){

          // CP CONFIGURATION
          case type.indexOf('CP')>=0:
            if(parseInt(message.content) > 0 || message.content.toLowerCase() == 'all'){
              message.reply('`'+type+'` setting for `'+pokemon+'` has been set to `'+message.content+'`.')
                .then(m => { m.delete(5000); resolve(message.content); collector.stop(); msg.delete(); }).catch(console.error);
              }
            else{ message.reply('Invalid Input. '+requirements).then(m => m.delete(5000)).catch(console.error); msg.delete(); } break;

          // MIN/MAX IV CONFIGURATION
          case type.indexOf('IV')>=0:
            if(parseInt(message.content) >= 0 && parseInt(message.content) <= 100){
              message.reply('`'+type+'` setting for `'+pokemon+'` has been set to `'+message.content+'`.')
                .then(m => { m.delete(5000); resolve(message.content); collector.stop(); msg.delete();  }).catch(console.error);
            }
            else if(message.content.length == 8 || message.content.toLowerCase() == 'all'){
              message.reply('`'+type+'` setting for `'+pokemon+'` has been set to `'+message.content+'`.')
                .then(m => { m.delete(5000); resolve(message.content); collector.stop(); msg.delete();  }).catch(console.error);
            }
            else{ message.reply('Invalid Input. '+requirements).then(m => m.delete(5000)).catch(console.error); msg.delete(); } break;

          // MIN/MAX LEVEL CONFIGURATION
          case type.indexOf('Level')>=0:
            if(parseInt(message.content) >= 0 && parseInt(message.content) <= 35){
              message.reply('`'+type+'` setting for `'+pokemon+'` has been set to `'+message.content+'`.')
                .then(m => { m.delete(5000); resolve(message.content); collector.stop(); msg.delete(); }).catch(console.error);
            }
            else if(message.content.toLowerCase() == 'all'){
              message.reply('`'+type+'` setting for `'+pokemon+'` has been set to `'+message.content+'`.')
                .then(m => { m.delete(5000); resolve(message.content); collector.stop(); msg.delete(); }).catch(console.error);
            }
            else{ message.reply('Invalid Input. '+requirements).then(m => m.delete(5000)).catch(console.error); msg.delete(); } break;


          // GENDER CONFIGURATION
          case type.indexOf('Gender')>=0:
          if(message.content.toLowerCase() == 'all' || message.content.toLowerCase() == 'male' || message.content.toLowerCase() == 'female'){
            message.reply('`'+type+'` setting for `'+pokemon+'` has been set to `'+message.content+'`.')
              .then(m => { m.delete(5000); resolve(message.content); collector.stop(); msg.delete();  }).catch(console.error);
          }
          else{ message.reply('Invalid Input. '+requirements).then(m => m.delete(5000)).catch(console.error); msg.delete(); } break;

          case message.content.toLowerCase == 'cancel':
            message.reply('Subscription has been cancelled. Nothing was saved to the database.')
              .then(m => { m.delete(5000); resolve(message.content); collector.stop(); msg.delete();  }).catch(console.error);
        }
      });

    });


  });
}
