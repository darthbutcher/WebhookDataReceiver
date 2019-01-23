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

const Discord = require('discord.js');
const Subscription = require('./subscriptions/pokemon.js');
const insideGeofence = require('point-in-polygon');
const insideGeojson = require('point-in-geopolygon');

module.exports.run = async (MAIN, sighting, main_area, sub_area, embed_area, server) => {

  // VARIABLES
  let internal_value = (sighting.individual_defense+sighting.individual_stamina+sighting.individual_attack)/45;
  let time_now = new Date().getTime(); internal_value = Math.floor(internal_value*1000)/10;

  // CHECK SUBSCRIPTION CONFIG
  if(MAIN.config.POKEMON.Subscriptions == 'ENABLED' && sighting.cp > 0){
    Subscription.run(MAIN, internal_value, sighting, time_now, main_area, sub_area, embed_area, server);
  }

  // CHECK ALL FILTERS
  MAIN.Pokemon_Channels.forEach((pokemon_channel,index) => {

    // DEFINE FILTER VARIABLES
    let geofences = pokemon_channel[1].geofences.split(',');
    let channel = MAIN.channels.get(pokemon_channel[0]);
    let filter = MAIN.Filters.get(pokemon_channel[1].filter);

    // THROW ERRORS FOR INVALID DATA
    if(!filter){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] The filter defined for'+pokemon_channel[0]+' does not appear to exist.'); }
    else if(!channel){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] The channel '+pokemon_channel[0]+' does not appear to exist.'); }

    // CHECK FILTER TYPE
    else if(filter.Type == 'pokemon'){

      // AREA FILTER
      if(geofences.indexOf(server.name)>=0 || geofences.indexOf(main_area)>=0 || geofences.indexOf(sub_area)>=0){

        // CHECK IF THE POKEMON NAME IS SET TO FALSE
        if(filter[MAIN.pokemon[sighting.pokemon_id].name] != 'False'){

          // CHECK IF POKEMON IS ENABLED OR SET TO A SPECIFIC IV
          if(filter[MAIN.pokemon[sighting.pokemon_id].name] == 'True'){

            // CHECK IF THE POKEMON HAS BEEN IV SCANNED OR TO POST WITHOUT IV
            if(filter.Post_Without_IV == true){
              send_without_iv(MAIN, sighting, channel, time_now, main_area, sub_area, embed_area, server);
            }
            else if(sighting.cp > 0){
              // CHECK THE MIN AND MAX IV
              if(filter.min_iv <= internal_value && filter.max_iv >= internal_value){

                // CHECK MIN AND MAX LEVEL
                if(filter.min_level <= sighting.pokemon_level && filter.max_level >= sighting.pokemon_level){

                  // CHECK MIN AND MAX CP
                  if(filter.min_cp <= sighting.cp && filter.max_cp >= sighting.cp){

                    // SEND POKEMON TO DISCORD
                    send_pokemon(MAIN, internal_value, sighting, channel, time_now, main_area, sub_area, embed_area, server);
                  }
                  else{
                    // DEBUG
                    if(MAIN.debug.Pokemon == 'ENABLED'){ console.info('[DEBUG] [pokemon.js] Pokemon Did Not Pass CP Filters. '+sighting.encounter_id); }
                  }
                }
                else{
                  // DEBUG
                  if(MAIN.debug.Pokemon == 'ENABLED'){ console.info('[DEBUG] [pokemon.js] Pokemon Did Not Pass Level Filters. '+sighting.encounter_id); }
                }
              }
              else{
                // DEBUG
                if(MAIN.debug.Pokemon == 'ENABLED'){ console.info('[DEBUG] [pokemon.js] Pokemon Did Not Pass IV Filters. '+sighting.encounter_id); }
              }
            }
          }
          else if(filter[MAIN.pokemon[sighting.pokemon_id].name] && filter[MAIN.pokemon[sighting.pokemon_id].name].min_iv <= internal_value && filter.max_iv >= internal_value){

            // CHECK IF THE POKEMON HAS BEEN IV SCANNED OR TO POST WITHOUT IV
            if(filter.Post_Without_IV == true){
              send_without_iv(MAIN, sighting, channel, time_now, main_area, sub_area, embed_area, server);
            }
            else if(sighting.cp > 0){
              send_pokemon(MAIN, internal_value, sighting, channel, time_now, main_area, sub_area, embed_area, server);
            }
          }
          else{
            // DEBUG
            if(MAIN.debug.Pokemon=='ENABLED'){ console.info('[DEBUG] [pokemon.js] Pokemon Did Not Pass Any Filters.'); }
          }
        }
        else{
          // DEBUG
          if(MAIN.debug.Pokemon == 'ENABLED'){ console.info('[DEBUG] [pokemon.js] Pokemon Set to False in the filter.'); }
        }
      }
      else{
        // DEBUG
        if(MAIN.debug.Pokemon == 'ENABLED') { console.info('[DEBUG] [pokemon.js] Pokemon Did Not Meet Any Area Filters. '+pokemon_channel[0]+' | Saw: '+server.name+','+main_area+','+sub_area+' | Expected: '+pokemon_channel[1].geofences); }
      }
    }
  }); return;
}

function send_pokemon(MAIN, internal_value, sighting, channel, time_now, main_area, sub_area, embed_area, server){

  // FETCH THE MAP TILE
  MAIN.Static_Map_Tile(sighting.latitude,sighting.longitude,'pokemon','feed').then(async function(img_url){

    // DEFINE VARIABLES
    let hide_time = await MAIN.Bot_Time(sighting.disappear_time, '1', server.hour_offset);
    let hide_minutes = Math.floor((sighting.disappear_time-(time_now/1000))/60);

    // DETERMINE MOVE NAMES AND TYPES
    let move_name_1 = MAIN.moves[sighting.move_1].name;
    let move_type_1 = await MAIN.Get_Type(sighting.move_1);
    let move_name_2 = MAIN.moves[sighting.move_2].name;
    let move_type_2 = await MAIN.Get_Type(sighting.move_2);

    // DETERMINE POKEMON NAME AND DETAILS
    let pokemon_name = MAIN.pokemon[sighting.pokemon_id].name;
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
      .setColor('00ccff').setThumbnail(pokemon_url)
      .addField(pokemon_name+' ('+internal_value+'%)'+weather_boost, 'Atk: '+sighting.individual_attack+' / Def: '+sighting.individual_defense+' / Sta: '+sighting.individual_stamina+' | '+pokemon_type, false)
      .addField('Level '+sighting.pokemon_level+' | CP '+sighting.cp+gender, move_name_1+' '+move_type_1+' / '+move_name_2+' '+move_type_2, false)
      .addField('Disappears: '+hide_time+' (*'+hide_minutes+' Mins*)', height+' | '+weight, false)

      .addField(embed_area+' | Directions:','[Google Maps](https://www.google.com/maps?q='+sighting.latitude+','+sighting.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+sighting.latitude+','+sighting.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+sighting.latitude+','+sighting.longitude+'&navigate=yes)')
      .setImage(img_url);

    // CHECK DISCORD CONFIG
    if(MAIN.config.POKEMON.Discord_Feeds == 'ENABLED'){
      if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Modules] [pokemon.js] Sent a '+pokemon_name+' to '+channel.guild.name+' ('+channel.id+').'); }
      return MAIN.Send_Embed(pokemon_embed, channel.id);
    }
  }); return;
}

async function send_without_iv(MAIN, sighting, channel, time_now, main_area, sub_area, embed_area, server){

  // FETCH THE MAP TILE
  MAIN.Static_Map_Tile(sighting.latitude,sighting.longitude).then(async function(img_url){

    // DEFINE VARIABLES
    let hide_time = await MAIN.Bot_Time(sighting.disappear_time, '1', server.hour_offset);
    let hide_minutes = Math.floor((sighting.disappear_time-(time_now/1000))/60);

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
      .setColor('00ccff').setThumbnail(pokemon_url)
      .setTitle('A Wild **'+name+'** has Appeared!')
      .addField('Disappears: '+hide_time+' (*'+hide_minutes+' Mins*)', embed_area+weather_boost+'\n'+pokemon_type, false)
      .addField('Directions:','[Google Maps](https://www.google.com/maps?q='+sighting.latitude+','+sighting.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+sighting.latitude+','+sighting.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+sighting.latitude+','+sighting.longitude+'&navigate=yes)')
      .setImage(img_url);

    // CHECK DISCORD CONFIG
    if(MAIN.config.POKEMON.Discord_Feeds == 'ENABLED'){
      if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Modules] [pokemon.js] Sent a Pokémon to '+channel.guild.name+' ('+channel.id+').'); }
      return MAIN.Send_Embed(pokemon_embed, channel.id);
    }
  }); return;
}
