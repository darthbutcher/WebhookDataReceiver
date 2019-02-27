// RAID EMBEDS

const Discord = require('discord.js');

delete require.cache[require.resolve('../embeds/raids.js')];
const Send_Raid = require('../embeds/raids.js');

module.exports.run = async (MAIN, raid, main_area, sub_area, embed_area, server, timezone) => {

  if(!raid.pokemon_id){ return; }

  if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-Subscriptions] [raids.js] Received '+MAIN.pokemon[raid.pokemon_id].name+' Raid for '+server.name+'.'); }

  // FETCH ALL USERS FROM THE USERS TABLE AND CHECK SUBSCRIPTIONS
  MAIN.database.query("SELECT * FROM pokebot.users WHERE discord_id = ? AND status = ?", [server.id, 'ACTIVE'], function (error, users, fields){
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

        // CHECK IF THE USER HAS SUBS
        if(user.raids /*&& proceed == true*/){

          // CONVERT POKEMON LIST TO AN ARRAY
          let raid_subs = JSON.parse(user.raids);

          // CHECK EACH USER SUBSCRIPTION
          raid_subs.subscriptions.forEach((sub,index) => {

            // CHECK IF THE GYM NAME MATCHES THE USER'S SUB
            if(sub.id == raid.gym_id || sub.gym == 'All'){

              // CHECK IF THE RAID BOSS NAME MATCHES THE USER'S SUB
              if(sub.boss == MAIN.pokemon[raid.pokemon_id].name || sub.boss == 'All'){

                // CHECK IF THE AREA IS WITHIN THE USER'S GEOFENCES
                if(sub.areas == 'No' || sub.areas == 'Gym Specified' || user.geofence == server.name || user_areas.indexOf(main_area) >= 0 || user_areas.indexOf(sub_area) >= 0){

                  // CHECK IF THE RAID LEVEL MATCHES THE USER'S SUB
                  if(raid.level >= sub.min_lvl || sub.min_lvl.toLowerCase() == 'all' || sub.min_lvl == 'Boss Specified'){
                    if(raid.level <= sub.max_lvl || sub.max_level.toLowerCase() == 'all' || sub.max_lvl == 'Boss Specified'){
                        Send_Raid.run(MAIN, user, raid, 'Boss', main_area, sub_area, embed_area, server, timezone);
                    }
                  }
                  else{
                    if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-Subscriptions] [raids.js] '+MAIN.pokemon[raid.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Raid Level Filter.'); }
                  }
                }
                else{
                  if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-Subscriptions] [raids.js] '+MAIN.pokemon[raid.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Area Filter.'); }
                }
              }
              else{
                if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-Subscriptions] [raids.js] '+MAIN.pokemon[raid.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Raid Boss Name Filter.'); }
              }
            }
            else{
              if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-Subscriptions] [raids.js] '+MAIN.pokemon[raid.pokemon_id].name+' Did Not Pass '+user.user_name+'\'s Gym Name Filter.'); }
            }
          });
        }
      });
    } return;
  });
}
