const Discord = require('discord.js');
const Subscription = require('./subscriptions/pokemon.js');

//#############################################################//
//#############################################################//
//#####   _____   ____  _  ________ __  __  ____  _   _   #####//
//#####  |  __ \ / __ \| |/ /  ____|  \/  |/ __ \| \ | |  #####//
//#####  | |__) | |  | | ' /| |__  | \  / | |  | |  \| |  #####//
//#####  |  ___/| |  | |  < |  __| | |\/| | |  | | . ` |  #####//
//#####  | |    | |__| | . \| |____| |  | | |__| | |\  |  #####//
//#####  |_|     \____/|_|\_\______|_|  |_|\____/|_| \_|  #####//
//#####                  POKEMON FEEDS                    #####//
//#############################################################//
//#############################################################//

module.exports.run = async (MAIN, sighting, city) => {

  // DEBUG
  if(MAIN.debug.Pokemon == 'ENABLED'){ console.info('[DEBUG] [pokemon.js] Saw an Pokemon. '+sighting.encounter_id); }

  // EStABLISH SIGHTING VARIABLES
  let timeNow = new Date().getTime(), pokemon_name = MAIN.pokemon[sighting.pokemon_id].name;
  let internal_value = (sighting.individual_defense+sighting.individual_stamina+sighting.individual_attack)/45;
  internal_value = Math.floor(internal_value*1000)/10;

  if(sighting.cp > 0 && MAIN.p_config.Subscriptions == 'ENABLED'){
    Subscription.run(MAIN, internal_value, sighting, city, timeNow);
  }

  // CHECK ALL FILTERS
  MAIN.feeds.forEach((feed,index) => {

    if(MAIN.config.Cities.length == 1 || city.name == feed.City){
      if(feed.Type == 'pokemon'){
        if(feed.Channel_ID && feed[pokemon_name] != 'False'){

          // CHECK IF POKEMON IS ENABLED OR SET TO A SPECIFIC IV
          if(feed[pokemon_name] == 'True'){

            // CHECK IF THE POKEMON HAS BEEN IV SCANNED
            if(sighting.cp > 0){
              // CHECK THE MIN AND MAX IV AND LEVEL SET FOR THE ENTIRE FEED
              if(feed.min_iv <= internal_value && feed.max_iv >= internal_value && feed.min_level <= sighting.pokemon_level && feed.max_level >= sighting.pokemon_level){
                parse_Pokemon(MAIN, internal_value ,sighting, feed.Channel_ID, timeNow, city);
              }
              else{
                // DEBUG
                if(MAIN.debug.Pokemon == 'ENABLED'){ console.info('[DEBUG] [pokemon.js] Pokemon Did Not Pass Any Filters. '+sighting.encounter_id); }
              }
            }
            else if(feed.Post_Without_IV == true){

              // POST WITHOUT IVS IF OVERRIDDEN BY THE USER
              send_Without_IV(MAIN, sighting, feed.Channel_ID, timeNow, city);
            }
          }
          else if(feed[pokemon_name].min_iv <= internal_value && feed.max_iv >= internal_value){

            // CHECK IF THE POKEMON HAS BEEN IV SCANNED OR TO POST WITHOUT IV
            if(sighting.cp > 0){
              parse_Pokemon(MAIN, internal_value, sighting, feed.Channel_ID, timeNow, city);
            }
            else if(feed.Post_Without_IV == true){

              // POST WITHOUT IVS IF OVERRIDDEN BY THE USER
              sendWithoutIV(MAIN, sighting, feed.Channel_ID, time, city);
            }
          }
          else{
            // DEBUG
            if(MAIN.debug.Pokemon=='ENABLED'){ console.info('[DEBUG] [pokemon.js] Pokemon Did Not Pass Any Filters. '+sighting.encounter_id); }
          } return;
        }
        else{
          // DEBUG
          if(MAIN.debug.Pokemon=='ENABLED'){ console.info('[DEBUG] [pokemon.js] Pokemon Set to False or No Channel_ID in the Feed json. '+sighting.encounter_id); }
        }
      }
    }
    else{
      // DEBUG
      if(MAIN.debug.Pokemon=='ENABLED'){ console.info('[DEBUG] [pokemon.js] Pokemon Did Not Pass City Check. '+sighting.encounter_id); }
    }
  });
}

function parse_Pokemon(MAIN, internal_value, sighting, channelID, time, city){

  // DEBUG ACK
  if(MAIN.debug.Pokemon == 'ENABLED'){ console.info('[DEBUG] [pokemon.js] Encounter Received to Send to Discord. '+sighting.encounter_id); }

  // FETCH THE MAP TILE
  MAIN.Static_Map_Tile(sighting.latitude,sighting.longitude,'pokemon').then(async function(img_url){

    // DEFINE VARIABLES
    let hide_time = await MAIN.Bot_Time(sighting.disappear_time,'1');
    let hide_minutes = Math.floor((sighting.disappear_time-(time/1000))/60);

    // ATTACH THE MAP TILE
    let attachment = new Discord.Attachment(img_url, 'Pokemon_Alert.png');

    // DETERMINE MOVE NAMES AND TYPES
    let move_name_1 = MAIN.moves[sighting.move_1].name;
    let move_type_1 = await MAIN.Get_Move_Type(sighting.move_1);
    let move_name_2 = MAIN.moves[sighting.move_2].name;
    let move_type_2 = await MAIN.Get_Move_Type(sighting.move_2);

    // DETERMINE POKEMON NAME AND DETAILS
    let name = MAIN.pokemon[sighting.pokemon_id].name;
    let height = 'Height: '+Math.floor(sighting.height*100)/100+'m';
    let weight = 'Weight: '+Math.floor(sighting.weight*100)/100+'kg';

    // GET POKEMON TYPE(S) AND EMOTE
    let pokemon_type = '';
    MAIN.pokemon[sighting.pokemon_id].types.forEach((type) => {
      pokemon_type += type+' '+MAIN.emotes[type.toLowerCase()]+' / ';
    });
    pokemon_type = pokemon_type.slice(0,-3);

    // GET SPRITE IMAGE
    let pokemon_url = await MAIN.Get_Sprite(sighting.form, sighting.pokemon_id);

    // GET THE GENERAL AREA
    let pokemon_area = await MAIN.Get_Area(sighting.latitude,sighting.longitude);

    // GET GENDER
    let gender = await MAIN.Get_Gender(sighting.gender);

    // GET WEATHER BOOST
    let weather_boost = await MAIN.Get_Weather(sighting.weather);

    // CREATE AND SEND THE EMBED
    let pokemon_embed = new Discord.RichEmbed()
      .attachFile(attachment).setImage('attachment://Pokemon_Alert.png')
      .setColor('00ccff').setThumbnail(pokemon_url)
      .setTitle(name+' '+sighting.individual_attack+'/'+sighting.individual_defense+'/'+sighting.individual_stamina+' ('+internal_value+'%)'+weather_boost)
      .addField('Level '+sighting.pokemon_level+' | CP '+sighting.cp+gender, move_name_1+' '+move_type_1+' / '+move_name_2+' '+move_type_2, false)
      .addField('Disappears: '+hide_time+' (*'+hide_minutes+' Mins*)', height+' | '+weight+'\n'+pokemon_type, false)
      .addField(pokemon_area.name+' | Directions:','[Google Maps](https://www.google.com/maps?q='+sighting.latitude+','+sighting.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+sighting.latitude+','+sighting.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+sighting.latitude+','+sighting.longitude+'&navigate=yes)');

    // SEND EMBED TO FEEDS
    if(MAIN.p_config.Discord_Feeds == 'ENABLED'){
      if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Modules] Sent a Pokémon for '+city.name+'.'); }
      MAIN.Send_Embed(pokemon_embed, channelID);
    }

    // END
    return;
  });
}

async function send_Without_IV(MAIN, sighting, channelID, time, city){

  // FETCH THE MAP TILE
  MAIN.Static_Map_Tile(sighting.latitude,sighting.longitude,'pokemon').then(async function(img_url){

    // DEFINE VARIABLES
    let hide_time = await MAIN.Bot_Time(sighting.disappear_time,'1');
    let hide_minutes = Math.floor((sighting.disappear_time-(time/1000))/60);

    // ATTACH THE MAP TILE
    let attachment = new Discord.Attachment(img_url, 'Pokemon_Alert.png');

    // DETERMINE POKEMON NAME
    let name = MAIN.pokemon[sighting.pokemon_id].name;

    // GET POKEMON TYPE(S) AND EMOTE
    let pokemon_type = '';
    MAIN.pokemon[sighting.pokemon_id].types.forEach((type) => {
      pokemon_type += type+' '+MAIN.emotes[type.toLowerCase()]+' / ';
    });
    pokemon_type = pokemon_type.slice(0,-3);

    // GET SPRITE IMAGE
    let pokemon_url = await MAIN.Get_Sprite(sighting.form, sighting.pokemon_id);

    // GET THE GENERAL AREA
    let pokemon_area = await MAIN.Get_Area(sighting.latitude,sighting.longitude);

    // GET GENDER
    let gender = await MAIN.Get_Gender(sighting.gender);

    // GET WEATHER BOOST
    let weather_boost = await MAIN.Get_Weather(sighting.weather);

    // CREATE AND SEND THE EMBED
    let pokemon_embed = new Discord.RichEmbed()
      .attachFile(attachment).setImage('attachment://Pokemon_Alert.png')
      .setColor('00ccff').setThumbnail(pokemon_url)
      .setTitle('A Wild **'+name+'** has Appeared!')
      .addField('Disappears: '+hide_time+' (*'+hide_minutes+' Mins*)', pokemon_area.name+weather_boost+'\n'+pokemon_type, false)
      .addField('Directions:','[Google Maps](https://www.google.com/maps?q='+sighting.latitude+','+sighting.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+sighting.latitude+','+sighting.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+sighting.latitude+','+sighting.longitude+'&navigate=yes)');

    // SEND EMBED TO FEEDS
    if(MAIN.p_config.Discord_Feeds == 'ENABLED'){
      if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Modules] Sent a Pokémon for '+city.name+'.'); }
      MAIN.Send_Embed(pokemon_embed, channelID);
    }

    // END
    return;
  });
}
