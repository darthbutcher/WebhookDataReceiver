delete require.cache[require.resolve('../embeds/pokemon.js')];
const Send_Pokemon = require('../embeds/pokemon.js');
const Discord = require('discord.js');

module.exports.run = async (MAIN, sighting, main_area, sub_area, embed_area, server, timezone) => {

  if(sighting.cp == null && MAIN.config.sub_without_iv == 'FALSE'){ return; }
  let internal_value = (sighting.individual_defense+sighting.individual_stamina+sighting.individual_attack)/45;
  let time_now = new Date().getTime(); internal_value = Math.floor(internal_value*1000)/10;

  // FETCH ALL USERS FROM THE USERS TABLE AND CHECK SUBSCRIPTIONS
  MAIN.pdb.query(`SELECT * FROM users WHERE discord_id = ? AND status = ?`, [server.id, 'ACTIVE'], function (error, users, fields){
    if(users && users[0]){
      users.forEach((user,index) => {

        // FETCH THE GUILD MEMBER AND CHECK IF A ADMINISTRATOR/DONOR
        // let member = MAIN.guilds.get(user.discord_id).members.get(user.user_id), proceed = true;
        // switch(true){
        //   case !member: proceed = false; break;
        //   case member.hasPermission('ADMINISTRATOR'): proceed = true; break;
        //   default: if(server.donor_role && !member.roles.has(server.donor_role)){ proceed = false; }
        // }

        // DEFINE VARIABLES
        let user_areas = user.geofence.split(',');

        // CHECK IF THE USERS SUBS ARE PAUSED, EXIST, AND THAT THE AREA MATCHES THEIR DISCORD
        if(user.pokemon && user.pokemon_status == 'ACTIVE'){

          // CONVERT POKEMON LIST TO AN ARRAY
          let pokemon = JSON.parse(user.pokemon);

          // CHECK EACH USER SUBSCRIPTION
          pokemon.subscriptions.forEach((sub,index) => {

            // CHECK IF THE AREA IS WITHIN THE USER'S GEOFENCES
            if(sub.areas == 'No' || user.geofence == server.name || user_areas.indexOf(main_area) >= 0 || user_areas.indexOf(sub_area) >= 0){

              // CHECK POKEMON NAME
              if(sub.name == MAIN.pokemon[sighting.pokemon_id].name || sub.name.toLowerCase().startsWith('all')){

                // DETERMINE GENDER
                sub.gender = sub.gender.toLowerCase();
                if(sighting.gender == 1){ gender = 'male'; }
                else if(sighting.gender == 2){ gender = 'female'; }
                else{ gender = 'all'; }

                switch(true){
                  case sub.min_iv.length > 3:
                    // SPLIT THE IVs UP INTO INDIVIDUAL STATS
                    let min_iv = sub.min_iv.split('/');
                    let max_iv = sub.max_iv.split('/');

                    // CHECK ALL SUBSCRIPTION REQUIREMENTS
                    switch(true){
                      case sighting.individual_attack < min_iv[0]: break;
                      case sighting.individual_defense < min_iv[1]: break;
                      case sighting.individual_stamina < min_iv[2]: break;
                      case sighting.individual_attack > max_iv[0]: break;
                      case sighting.individual_defense > max_iv[1]: break;
                      case sighting.individual_stamina > max_iv[2]: break;
                      case sub.min_cp > sighting.cp: break;
                      case sub.max_cp < sighting.cp: break;
                      case sub.min_lvl > sighting.pokemon_level: break;
                      case sub.max_lvl < sighting.pokemon_level: break;
                      default:
                        if(sub.gender == 'all' || sub.gender == gender){
                          Send_Pokemon.run(MAIN, true, user, sighting, internal_value, time_now, main_area, sub_area, embed_area, server, timezone);
                        }
                    } break;
                  default:
                    switch(true){
                      case sub.min_iv > internal_value:  break;
                      case sub.max_iv < internal_value: break;
                      case sub.min_cp > sighting.cp: break;
                      case sub.max_cp < sighting.cp: break;
                      case sub.min_lvl > sighting.pokemon_level: break;
                      case sub.max_lvl < sighting.pokemon_level: break;
                      default:
                        if(sub.gender == 'all' || sub.gender == gender){
                          Send_Pokemon.run(MAIN, true, user, sighting, internal_value, time_now, main_area, sub_area, embed_area, server, timezone);
                        }
                    }
                }
              } else{
                if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-Subscriptions] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Name Filters.'); }
              }
            } else{
              if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-Subscriptions] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Area Filter.'); }
            }
          });
        }
      }); return;
    }
  });
}
