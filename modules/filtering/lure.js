delete require.cache[require.resolve('../embeds/lure.js')];
const Send_Lure = require('../embeds/lure.js');
const Discord = require('discord.js');

module.exports.run = async (MAIN, lure, main_area, sub_area, embed_area, server, timezone, role_id) => {

  if(MAIN.debug.Lure == 'ENABLED'){ console.info('[DEBUG] [Modules] [lure.js] Received a Pokestop.'); }

  // FILTER FEED TYPE FOR EGG, BOSS, OR BOTH
  let type = '', stop_id = lure.pokestop_id;

  switch(lure.lure_id){
    case 501: type = 'Normal'; break;
    case 502: type = 'Glacial'; break;
    case 503: type = 'Mossy'; break;
    case 504: type = 'Magnetic'; break;
    default: type = 'Not Lured'
  }

  // CHECK EACH FEED FILTER
  MAIN.Lure_Channels.forEach((lure_channel,index) => {

    // DEFINE MORE VARIABLES
    let geofences = lure_channel[1].geofences.split(',');
    let channel = MAIN.channels.get(lure_channel[0]);
    let filter = MAIN.Filters.get(lure_channel[1].filter);
    let role_id = '', embed = 'lure.js';

    if (lure_channel[1].roleid) {
      if (lure_channel[1].roleid == 'here' || lure_channel[1].roleid == 'everyone'){
        role_id = '@'+lure_channel[1].roleid;
      } else {
        role_id = '<@&'+lure_channel[1].roleid+'>';
      }
    }

    if (lure_channel[1].embed) { embed = lure_channel[1].embed; }


    // THROW ERRORS AND BREAK FOR INVALID DATA
    if(!filter){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] The filter defined for'+lure_channel[0]+' does not appear to exist.'); }
    else if(!channel){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] The channel '+lure_channel[0]+' does not appear to exist.'); }

    // FILTER FOR LURE TYPE
    else if (type) {

      // AREA FILTER
      if(geofences.indexOf(server.name) >= 0 || geofences.indexOf(main_area) >= 0 || geofences.indexOf(sub_area) >= 0){

        if(filter.Lure_Type.indexOf(type) >= 0){
          if(MAIN.debug.Lure == 'ENABLED'){ console.info('[DEBUG] [Modules] [lure.js] Lure Passed Filters for '+lure_channel[0]+'.'); }
          Send_Lure.run(MAIN, channel, lure, type, main_area, sub_area, embed_area, server, timezone, role_id, embed);
        }
      }
      else{
        if(MAIN.debug.Lure == 'ENABLED'){ console.info('[DEBUG] [Modules] [lure.js] Lure Did Not Pass Channel Geofences for '+lure_channel[0]+'. Expected: '+lure_channel[1].geofences+' Saw: '+server.name+'|'+main_area+'|'+sub_area); }
      }
    }
    else{
      if(MAIN.DEBUG.Lure == 'ENABLED'){ console.info('[DEBUG] [Modules] [lure.js] Lure Did Not Meet Type or Level Filter for '+lure_channel[0]+'. Expected: '+filter.Lure_Type+', Saw: '+type.toLowerCase()); }
    }
  });

}
