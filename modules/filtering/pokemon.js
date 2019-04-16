delete require.cache[require.resolve('../embeds/pokemon.js')];
const Send_Pokemon = require('../embeds/pokemon.js');
const Discord = require('discord.js');

module.exports.run = async (MAIN, sighting, main_area, sub_area, embed_area, server, timezone, role_id) => {

  // VARIABLES
  let internal_value = (sighting.individual_defense+sighting.individual_stamina+sighting.individual_attack)/45;
  let time_now = new Date().getTime(); internal_value = Math.floor(internal_value*1000)/10;

  // CHECK ALL FILTERS
  MAIN.Pokemon_Channels.forEach((pokemon_channel,index) => {

    // DEFINE FILTER VARIABLES
    let geofences = pokemon_channel[1].geofences.split(',');
    let channel = MAIN.channels.get(pokemon_channel[0]);
    let filter = MAIN.Filters.get(pokemon_channel[1].filter);
    if (pokemon_channel[1].roleid) {
      if (pokemon_channel[1].roleid == 'here' || pokemon_channel[1].roleid == 'everyone'){
        role_id = '@'+pokemon_channel[1].roleid;
      } else {
        role_id = '<@&'+pokemon_channel[1].roleid+'>';
      }
    } else { role_id = ''; }


    // CHECK FILTER GEOFENCES
    if(geofences.indexOf(server.name) >= 0 || geofences.indexOf(main_area) >= 0 || geofences.indexOf(sub_area) >= 0){

      // DETERMINE GENDER
      filter.gender = filter.gender.toLowerCase();
      if(sighting.gender == 1){ gender = 'male'; }
      else if(sighting.gender == 2){ gender = 'female'; }
      else{ gender = 'all'; }

      switch(true){
        // CHECK IF FILTER EXISTS
        case !filter: console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] The filter defined for'+pokemon_channel[0]+' does not appear to exist.'); break;

        // CHECK IF CHANNEL EXISTS
        case !channel: console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] The channel '+pokemon_channel[0]+' does not appear to exist.'); break;

        // POST WITHOUT IV IF ENABLED
        case filter.Post_Without_IV:
          switch(true){
            case sighting.cp > 0: break;
            case filter[MAIN.pokemon[sighting.pokemon_id].name] == 'False': break;
            default:
              Send_Pokemon.run(MAIN, false, channel, sighting, internal_value, time_now, main_area, sub_area, embed_area, server, timezone, role_id); break;
          }
        // CHECK IF SIGHTING HAS A CP
        case !sighting.cp > 0: break;

        // CHECK IF FILTER HAS INDIVIDUAL POKEMON IV REQUIREMENT
        case filter[MAIN.pokemon[sighting.pokemon_id].name] != 'True':
          switch(true){
            case filter[MAIN.pokemon[sighting.pokemon_id].name] == 'False': break;
            case filter[MAIN.pokemon[sighting.pokemon_id].name].min_iv > internal_value: sightingFailed(MAIN, filter, 'IV'); break;
            case filter.max_iv < internal_value: sightingFailed(MAIN, filter, 'IV'); break;
            case filter.min_cp > sighting.cp: sightingFailed(MAIN, filter, 'CP'); break;
            case filter.max_cp < sighting.cp: sightingFailed(MAIN, filter, 'CP'); break;
            case filter.min_level > sighting.pokemon_level: sightingFailed(MAIN, filter, 'LEVEL'); break;
            case filter.max_level < sighting.pokemon_level: sightingFailed(MAIN, filter, 'LEVEL'); break;
            default:
              Send_Pokemon.run(MAIN, true, channel, sighting, internal_value, time_now, main_area, sub_area, embed_area, server, timezone, role_id);
          } break;

        // CHECK IF FILTER HAS INDIVIDUAL VALUE REQUIREMENTS
        case filter.min_iv.length > 3:
          let min_iv = filter.min_iv.split('/');
          let max_iv = filter.max_iv.split('/');

          // SEND SIGHTING THROUGH ALL FILTERS
          switch(true){
            case !filter[MAIN.pokemon[sighting.pokemon_id].name]: sightingFailed(MAIN, filter, 'IV'); break;
            case min_iv[0] > sighting.individual_attack: sightingFailed(MAIN, filter, 'IV'); break;
            case min_iv[1] > sighting.individual_defense: sightingFailed(MAIN, filter, 'IV'); break;
            case min_iv[2] > sighting.individual_stamina: sightingFailed(MAIN, filter, 'IV'); break;
            case max_iv[0] < sighting.individual_attack: sightingFailed(MAIN, filter, 'IV'); break;
            case max_iv[1] < sighting.individual_defense: sightingFailed(MAIN, filter, 'IV'); break;
            case max_iv[2] < sighting.individual_stamina: sightingFailed(MAIN, filter, 'IV');  break;
            case filter.min_cp > sighting.cp: sightingFailed(MAIN, filter, 'CP'); break;
            case filter.max_cp < sighting.cp: sightingFailed(MAIN, filter, 'CP'); break;
            case filter.min_level > sighting.pokemon_level: sightingFailed(MAIN, filter, 'LEVEL'); break;
            case filter.max_level < sighting.pokemon_level: sightingFailed(MAIN, filter, 'LEVEL'); break;
            default:
              if(filter.gender.toLowerCase() == 'all' || filter.gender.toLowerCase() == gender){
                Send_Pokemon.run(MAIN, true, channel, sighting, internal_value, time_now, main_area, sub_area, embed_area, server, timezone, role_id);
              }
          } break;

        // SEND SIGHTING THROUGH ALL FILTERS
        default:
          switch(true){
            case filter.min_iv > internal_value: sightingFailed(MAIN, filter, 'IV'); break;
            case filter.max_iv < internal_value: sightingFailed(MAIN, filter, 'IV'); break;
            case filter.min_cp > sighting.cp: sightingFailed(MAIN, filter, 'CP'); break;
            case filter.max_cp < sighting.cp: sightingFailed(MAIN, filter, 'CP'); break;
            case filter.min_level > sighting.pokemon_level: sightingFailed(MAIN, filter, 'LEVEL'); break;
            case filter.max_level < sighting.pokemon_level: sightingFailed(MAIN, filter, 'LEVEL'); break;
            default:
              if(filter.gender.toLowerCase() == 'all' || filter.gender.toLowerCase() == gender){
                Send_Pokemon.run(MAIN, true, channel, sighting, internal_value, time_now, main_area, sub_area, embed_area, server, timezone, role_id);
              }
          }
      }
    }
  }); return;
}

function sightingFailed(MAIN, filter, reason){
  if(MAIN.debug.Pokemon == 'ENABLED'){ console.info('[DEBUG] [filtering/pokemon.js] Sighting failed '+filter.name+' because of '+reason+' check.'); } return;
}

