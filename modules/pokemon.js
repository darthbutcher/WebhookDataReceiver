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

delete require.cache[require.resolve('./embeds/pokemon.js')];
const Send_Pokemon = require('./embeds/pokemon.js');

module.exports.run = async (MAIN, sighting, main_area, sub_area, embed_area, server, timezone) => {

  // VARIABLES
  let internal_value = (sighting.individual_defense+sighting.individual_stamina+sighting.individual_attack)/45;
  let time_now = new Date().getTime(); internal_value = Math.floor(internal_value*1000)/10;

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
              return send_without_iv(MAIN, sighting, channel, time_now, main_area, sub_area, embed_area, server, timezone);
            }
            else if(sighting.cp > 0){
              // CHECK THE MIN AND MAX IV
              if(filter.min_iv <= internal_value && filter.max_iv >= internal_value){

                // CHECK MIN AND MAX LEVEL
                if(filter.min_level <= sighting.pokemon_level && filter.max_level >= sighting.pokemon_level){

                  // CHECK MIN AND MAX CP
                  if(filter.min_cp <= sighting.cp && filter.max_cp >= sighting.cp){

                    // SEND POKEMON TO DISCORD
                    if(MAIN.debug.Pokemon=='ENABLED' && server.name == MAIN.debug.Target){ console.info('[DEBUG] [pokemon.js] Pokemon matched filters for '+server.name+'. '+pokemon_channel[1].filter+'.'); return; }
                    return Send_Pokemon.run(MAIN, channel, sighting, internal_value, time_now, main_area, sub_area, embed_area, server, timezone);
                  }
                  else{
                    // DEBUG
                    if(MAIN.debug.Pokemon == 'ENABLED' && sighting.cp > 0){ console.info('[DEBUG] [pokemon.js] Pokemon Did Not Pass CP Filters for '+server.name+'. '+pokemon_channel[1].filter+'.'); return; }
                  }
                }
                else{
                  // DEBUG
                  if(MAIN.debug.Pokemon == 'ENABLED' && sighting.cp > 0){ console.info('[DEBUG] [pokemon.js] Pokemon Did Not Pass Level Filters for '+server.name+'. '+pokemon_channel[1].filter+'.'); return; }
                }
              }
              else{
                // DEBUG
                if(MAIN.debug.Pokemon == 'ENABLED' && sighting.cp > 0){ console.info('[DEBUG] [pokemon.js] Pokemon Did Not Pass IV Filters for '+server.name+'. '+pokemon_channel[1].filter+'.'); return; }
              }
            }
          }
          else if(filter[MAIN.pokemon[sighting.pokemon_id].name] && filter[MAIN.pokemon[sighting.pokemon_id].name].min_iv <= internal_value && filter.max_iv >= internal_value){

            // CHECK IF THE POKEMON HAS BEEN IV SCANNED OR TO POST WITHOUT IV
            if(sighting.cp > 0){
              return Send_Pokemon.run(MAIN, channel, sighting, internal_value, time_now, main_area, sub_area, embed_area, server, timezone);
            }
          }
          else{
            // DEBUG
            if(MAIN.debug.Pokemon=='ENABLED' && sighting.cp > 0){ console.info('[DEBUG] [pokemon.js] Pokemon Did Not Pass Any Filters for '+server.name+' '+pokemon_channel[1].filter+'.'); return; }
          }
        }
        else{
          // DEBUG
          if(MAIN.debug.Pokemon == 'ENABLED' && sighting.cp > 0){ console.info('[DEBUG] [pokemon.js] Pokemon Set to False in the filter for '+server.name+' '+pokemon_channel[1].filter+'.'); return; }
        }
      }
      else{
        // DEBUG
        if(MAIN.debug.Pokemon == 'ENABLED' && sighting.cp > 0){ console.info('[DEBUG] [pokemon.js] Pokemon Did Not Meet Any Area Filters. '+pokemon_channel[1].filter+' | Saw: '+server.name+','+main_area+','+sub_area+' | Expected: '+pokemon_channel[1].geofences); return; }
      }
    }
  }); return;
}

async function send_without_iv(MAIN, sighting, channel, time_now, main_area, sub_area, embed_area, server, timezone){

  // FETCH THE MAP TILE
  MAIN.Static_Map_Tile(sighting.latitude, sighting.longitude, 'pokemon').then(async function(img_url){

    // DEFINE VARIABLES
    let hide_time = await MAIN.Bot_Time(sighting.disappear_time, '1', timezone);
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
      .addField('Directions:','[Google Maps](https://www.google.com/maps?q='+sighting.latitude+','+sighting.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+sighting.latitude+','+sighting.longitude+'&z=10&t=s&dirflg=d) | [Waze](https://waze.com/ul?ll='+sighting.latitude+','+sighting.longitude+'&navigate=yes)')
      .setImage(img_url);

    // CHECK DISCORD CONFIG
    if(MAIN.config.POKEMON.Discord_Feeds == 'ENABLED'){
      if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Modules] [pokemon.js] Sent a Pokémon to '+channel.guild.name+' ('+channel.id+').'); }
      return MAIN.Send_Embed(pokemon_embed, channel.id);
    }
  }); return;
}
