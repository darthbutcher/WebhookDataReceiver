//####################################################//
//####################################################//
//#####   _____            _____ _____   _____   #####//
//#####  |  __ \     /\   |_   _|  __ \ / ____|  #####//
//#####  | |__) |   /  \    | | | |  | | (___    #####//
//#####  |  _  /   / /\ \   | | | |  | |\___ \   #####//
//#####  | | \ \  / ____ \ _| |_| |__| |____) |  #####//
//#####  |_|  \_\/_/    \_\_____|_____/|_____/   #####//
//#####     RAID WEBHOOKS, AND SUBSCRIPTIONS     #####//
//####################################################//
//####################################################//

const Discord = require('discord.js');

delete require.cache[require.resolve('./embeds/raids.js')];
const Send_Raid = require('./embeds/raids.js');

module.exports.run = async (MAIN, raid, main_area, sub_area, embed_area, server, timezone) => {

  if(MAIN.debug.Raids == 'ENABLED'){ console.info('[DEBUG] [Modules] [raids.js] Received a Raid.'); }

  // FILTER FEED TYPE FOR EGG, BOSS, OR BOTH
  let type = '';
  if(raid.cp > 0){ type = 'Boss'; }
  else{ type = 'Egg'; }

  // CHECK EACH FEED FILTER
  MAIN.Raid_Channels.forEach( async (raid_channel,index) => {

    // DEFINE MORE VARIABLES
    let geofences = raid_channel[1].geofences.split(',');
    let channel = MAIN.channels.get(raid_channel[0]);
    let filter = MAIN.Filters.get(raid_channel[1].filter);

    // THROW ERRORS AND BREAK FOR INVALID DATA
    if(!filter){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] The filter defined for'+raid_channel[0]+' does not appear to exist.'); }
    else if(!channel){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] The channel '+raid_channel[0]+' does not appear to exist.'); }

    // FILTER FOR EGG LEVEL
    else if( (type == 'Egg' && filter.Egg_Levels.indexOf(raid.level) >= 0) || (type == 'Boss' && filter.Boss_Levels.indexOf(raid.level) >= 0) ){

      // AREA FILTER
      if(geofences.indexOf(server.name) >= 0 || geofences.indexOf(main_area) >= 0 || geofences.indexOf(sub_area) >= 0){

        // CHECK FOR EX ELIGIBLE REQUIREMENT
        if(filter.Ex_Eligible_Only == undefined || filter.Ex_Eligible_Only != true){
          if(MAIN.debug.Raids == 'ENABLED'){ console.info('[DEBUG] [Modules] [raids.js] Raid Passed Filters for '+raid_channel[0]+'.'); }
          Send_Raid.run(MAIN, channel, raid, type, main_area, sub_area, embed_area, server, timezone);
        }
        else if(filter.Ex_Eligible_Only == raid.ex_raid_eligible || filter.Ex_Eligible_Only == raid.sponsor_id){
          if(MAIN.debug.Raids == 'ENABLED'){ console.info('[DEBUG] [Modules] [raids.js] Raid Passed Filters for '+raid_channel[0]+'.'); }
          Send_Raid.run(MAIN, channel, raid, type, main_area, sub_area, embed_area, server, timezone);
        }
      }
      else{
        if(MAIN.debug.Raids == 'ENABLED'){ console.info('[DEBUG] [Modules] [raids.js] Raid Did Not Pass Channel Geofences for '+raid_channel[0]+'. Expected: '+raid_channel[1].geofences+' Saw: '+server.name+'|'+main_area+'|'+sub_area); }
      }
    }
    else{
      if(MAIN.debug.Raids == 'ENABLED'){ console.info('[DEBUG] [Modules] [raids.js] Raid Did Not Meet Type or Level Filter for '+raid_channel[0]+'. Expected: '+filter.Egg_Or_Boss_Or_Both+', Saw: '+type.toLowerCase()); }
    }
  });
}
