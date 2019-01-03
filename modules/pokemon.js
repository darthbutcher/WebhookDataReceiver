const Discord = require('discord.js');
const Subscription = require('./subscriptions/pokemon.js');
const insideGeofence = require('point-in-polygon');
const insideGeojson = require('point-in-geopolygon');

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

module.exports.run = async (MAIN, sighting) => {

  // VARIABLES
  let time_now = new Date().getTime(), pokemon_name = MAIN.pokemon[sighting.pokemon_id].name;
  let internal_value = (sighting.individual_defense+sighting.individual_stamina+sighting.individual_attack)/45;
  internal_value = Math.floor(internal_value*1000)/10;

  // DISCORD AND AREA VARIABLES
  let main_area = '', sub_area = '', server = '', geofence_area = {}, embed_area = '';

  // DEFINE THE DISCORD THE OBJECT NEEDS TO BE SENT TO
  await MAIN.Discord.Servers.forEach((bot_discord,index) => {
    if(insideGeofence([sighting.latitude,sighting.longitude], bot_discord.geofence)){ server = bot_discord; }
  });

  // DEFINE THE GEOFENCE THE OBJECT IS WITHIN
  await MAIN.geofences.features.forEach((geofence,index) => {
    if(insideGeojson.polygon(geofence.geometry.coordinates, [sighting.longitude,sighting.latitude])){
      if(geofence.properties.sub_area != 'true'){ geofence_area.main = geofence.properties.name; }
      else if(geofence.properties.sub_area == 'false'){  geofence_area.sub = geofence.properties.name;  }
    }
  });

  // DEFINE AREA FOR EMBED
  if(area.sub){ embed_area = area.sub; sub_area = area.sub; }
  else if(area.main){ embed_area = area.main; main_area = area.main; }
  else{ embed_area = server.name; main_area = server.name; }

  // DEBUG
  if(MAIN.debug.Pokemon == 'ENABLED'){ console.info('[DEBUG] [pokemon.js] Saw an Pokemon. '+sighting.encounter_id); }

  if(sighting.cp > 0 && MAIN.config.POKEMON.Subscriptions == 'ENABLED'){
    Subscription.run(MAIN, internal_value, sighting, area, embed_area, server, time_now);
  }

  // CHECK ALL FILTERS
  MAIN.Pokemon_Channels.forEach((pokemon_channel,index) => {

    let geofences = pokemon_channel[1].geofences;
    let channel = MAIN.channels.get(pokemon_channel[0]);
    let filter = MAIN.Filters.get(pokemon_channel[1].filter);

    // THROW ERRORS FOR INVALID DATA
    if(!filter){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] The filter defined for'+pokemon_channel[0]+' does not appear to exist.'); }
    if(!channel){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] The channel '+pokemon_channel[0]+' does not appear to exist.'); }

    if(channel.guild.id == server.id){

      if(!filter){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] The filter defined for'+pokemon_channel[0]+' does not appear to exist.')}

      // CHECK FEED TYPE
      if(filter.Type == 'pokemon'){

        // AREA FILTER
        if(geofences.indexOf(server.name) >= 0 || geofences.indexOf(main_area) >= 0 || geofences.indexOf(sub_area) >= 0){

          // CHECK IF THE POKEMON NAME IS SET TO FALSE
          if(filter[pokemon_name] != 'False'){

            // CHECK IF POKEMON IS ENABLED OR SET TO A SPECIFIC IV
            if(filter[pokemon_name] == 'True'){

              // CHECK IF THE POKEMON HAS BEEN IV SCANNED
              if(sighting.cp > 0){

                // CHECK THE MIN AND MAX IV AND LEVEL SET FOR THE ENTIRE FEED
                if(filter.min_iv <= internal_value && filter.max_iv >= internal_value && filter.min_level <= sighting.pokemon_level && filter.max_level >= sighting.pokemon_level){
                    parse_Pokemon(MAIN, internal_value, sighting, embed_area, channel, time_now, server);
                }
                else{
                  // DEBUG
                  if(MAIN.debug.Pokemon == 'ENABLED'){ console.info('[DEBUG] [pokemon.js] Pokemon Did Not Pass Any Filters. '+sighting.encounter_id); }
                }
              }
              else if(filter.Post_Without_IV == true){
                send_without_iv(MAIN, sighting, embed_area, channel, time_now, server);
              }
            }
            else if(filter[pokemon_name].min_iv <= internal_value && filter.max_iv >= internal_value){

              // CHECK IF THE POKEMON HAS BEEN IV SCANNED OR TO POST WITHOUT IV
              if(sighting.cp > 0){
                parse_Pokemon(MAIN, internal_value, sighting, embed_area, channel, time_now, server);
              }
              else if(filter.Post_Without_IV == true){
                send_without_iv(MAIN, sighting, embed_area, channel, time, server);
              }
            }
            else{
              // DEBUG
              if(MAIN.debug.Pokemon=='ENABLED'){ console.info('[DEBUG] [pokemon.js] Pokemon Did Not Pass Any Filters. '+sighting.encounter_id); }
            } return;
          }
          else{
            // DEBUG
            if(MAIN.debug.Pokemon=='ENABLED'){ console.info('[DEBUG] [pokemon.js] Pokemon Set to False in the filter. '+sighting.encounter_id); }
          }
        }
        else{
          // DEBUG
          if(MAIN.debug.Pokemon=='ENABLED'){ console.info('[DEBUG] [pokemon.js] Pokemon Did Not Meet Any Area Filters. '+sighting.encounter_id); }
        }
      }
    }
    else{
      // DEBUG
      if(MAIN.debug.Pokemon=='ENABLED'){ console.info('[DEBUG] [pokemon.js] Discord ID\'s did not match between the Channel and the Discord config. '+sighting.encounter_id); }
    }
  });
}

function parse_Pokemon(MAIN, internal_value, sighting, embed_area, channel, time, server){

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
    let move_type_1 = await MAIN.Get_Detail('type',sighting.move_1);
    let move_name_2 = MAIN.moves[sighting.move_2].name;
    let move_type_2 = await MAIN.Get_Detail('type',sighting.move_2);

    // DETERMINE POKEMON NAME AND DETAILS
    let name = MAIN.pokemon[sighting.pokemon_id].name;
    let height = 'Height: '+Math.floor(sighting.height*100)/100+'m';
    let weight = 'Weight: '+Math.floor(sighting.weight*100)/100+'kg';

    // GET POKEMON TYPE(S) AND EMOTE
    let pokemon_type = '';
    MAIN.pokemon[sighting.pokemon_id].types.forEach((type) => {
      pokemon_type += type+' '+MAIN.emotes[type.toLowerCase()]+' / ';
    }); pokemon_type = pokemon_type.slice(0,-3);

    // GET SPRITE IMAGE
    let pokemon_url = await MAIN.Get_Sprite(sighting.form, sighting.pokemon_id);

    // GET GENDER
    let gender = '';
    switch(sighting.gender){
      case 1: gender = ' | ♂Male'; break;
      case 2: gender = ' | ♀Female'; break;
    }

    // GET WEATHER BOOST
    let weather_boost = '';
    switch(sighting.weather){
      case 1: weather_boost = ' '+MAIN.emotes.clear+' *Boosted*'; break;
      case 2: weather_boost = ' '+MAIN.emotes.rain+' *Boosted*'; break;
      case 3: weather_boost = ' '+MAIN.emotes.partlyCloudy+' *Boosted*'; break;
      case 4: weather_boost = ' '+MAIN.emotes.cloudy+' *Boosted*'; break;
      case 5: weather_boost = ' '+MAIN.emotes.windy+' *Boosted*'; break;
      case 6: weather_boost = ' '+MAIN.emotes.snow+' *Boosted*'; break;
      case 7: weather_boost = ' '+MAIN.emotes.fog+' *Boosted*'; break;
    }

    // CREATE AND SEND THE EMBED
    let pokemon_embed = new Discord.RichEmbed()
      .attachFile(attachment).setImage('attachment://Pokemon_Alert.png')
      .setColor('00ccff').setThumbnail(pokemon_url)
      .setTitle(name+' '+sighting.individual_attack+'/'+sighting.individual_defense+'/'+sighting.individual_stamina+' ('+internal_value+'%)'+weather_boost)
      .addField('Level '+sighting.pokemon_level+' | CP '+sighting.cp+gender, move_name_1+' '+move_type_1+' / '+move_name_2+' '+move_type_2, false)
      .addField('Disappears: '+hide_time+' (*'+hide_minutes+' Mins*)', height+' | '+weight+'\n'+pokemon_type, false)
      .addField(embed_area+' | Directions:','[Google Maps](https://www.google.com/maps?q='+sighting.latitude+','+sighting.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+sighting.latitude+','+sighting.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+sighting.latitude+','+sighting.longitude+'&navigate=yes)');

    // SEND EMBED TO FEEDS
    if(MAIN.config.POKEMON.Discord_Feeds == 'ENABLED'){
      if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Modules] Sent a Pokémon to '+channel.guild.name+' ('+channel.id+').'); }
      MAIN.Send_Embed(pokemon_embed, channel.id);
    }

    // END
    return;
  });
}

async function send_without_iv(MAIN, sighting, embed_area, channel, time, server){

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
    }); pokemon_type = pokemon_type.slice(0,-3);

    // GET SPRITE IMAGE
    let pokemon_url = await MAIN.Get_Sprite(sighting.form, sighting.pokemon_id);

    // GET GENDER
    let gender = '';
    switch(sighting.gender){
      case 1: gender = ' | ♂Male'; break;
      case 2: gender = ' | ♀Female'; break;
    }

    // GET WEATHER BOOST
    // GET WEATHER BOOST
    let weather_boost = '';
    switch(sighting.weather){
      case 1: weather_boost = ' '+MAIN.emotes.clear+' *Boosted*'; break;
      case 2: weather_boost = ' '+MAIN.emotes.rain+' *Boosted*'; break;
      case 3: weather_boost = ' '+MAIN.emotes.partlyCloudy+' *Boosted*'; break;
      case 4: weather_boost = ' '+MAIN.emotes.cloudy+' *Boosted*'; break;
      case 5: weather_boost = ' '+MAIN.emotes.windy+' *Boosted*'; break;
      case 6: weather_boost = ' '+MAIN.emotes.snow+' *Boosted*'; break;
      case 7: weather_boost = ' '+MAIN.emotes.fog+' *Boosted*'; break;
    }

    // CREATE AND SEND THE EMBED
    let pokemon_embed = new Discord.RichEmbed()
      .attachFile(attachment).setImage('attachment://Pokemon_Alert.png')
      .setColor('00ccff').setThumbnail(pokemon_url)
      .setTitle('A Wild **'+name+'** has Appeared!')
      .addField('Disappears: '+hide_time+' (*'+hide_minutes+' Mins*)', embed_area+weather_boost+'\n'+pokemon_type, false)
      .addField('Directions:','[Google Maps](https://www.google.com/maps?q='+sighting.latitude+','+sighting.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+sighting.latitude+','+sighting.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+sighting.latitude+','+sighting.longitude+'&navigate=yes)');

    // SEND EMBED TO FEEDS
    if(MAIN.config.POKEMON.Discord_Feeds == 'ENABLED'){
      if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Modules] Sent a Non-IV\'d Pokémon for '+channel.guild.name+' ('+channel.id+').'); }
      MAIN.Send_Embed(pokemon_embed, channel.id);
    }

    // END
    return;
  });
}
