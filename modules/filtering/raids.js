delete require.cache[require.resolve('../embeds/raids.js')];
const Send_Raid = require('../embeds/raids.js');
const Discord = require('discord.js');

module.exports.run = (MAIN, raid, main_area, sub_area, embed_area, server, timezone) => {

  if(MAIN.debug.Raids == 'ENABLED'){ console.info('[DEBUG] [Modules] [raids.js] Received a Raid.'); }

  // FILTER FEED TYPE FOR EGG, BOSS, OR BOTH
  let type = '', gym_id = raid.gym_id;
  if(raid.cp > 0){ type = 'Boss'; boss_name = MAIN.pokemon[raid.pokemon_id].name; }
  else{ type = 'Egg'; boss_name = 'Lvl'+raid.level; }

  // UPDATE/INSERT ACTIVE RAIDS
  if(raid.level >= discord.min_raid_lobbies  && server.id){
    MAIN.pdb.query(`SELECT * FROM active_raids WHERE gym_id = ?`, [gym_id], async function (error, record, fields) {
      if(record[0]){

        // UPDATE CHANNEL NAME
        if(record[0].raid_channel){
          let raid_channel = MAIN.channels.get(record[0].raid_channel);
          raid_channel.setName(boss_name+'_'+gym_name).catch(console.error);
        }

        // UPDATE BOSS NAME
        MAIN.pdb.query(`UPDATE active_raids SET boss_name = ? WHERE gym_id = ?`, [boss_name, gym_id], function (error, record, fields) {
          if(error){ console.error(error); }
        });
      } else {

        // INSERT INTO ACTIVE RAIDS
        let end_time = MAIN.Bot_Time(raid.end, '1', timezone);
        MAIN.pdb.query(`INSERT INTO active_raids (gym_id, gym_name, guild_id, area, boss_name, active, end_time, expire_time) VALUES (?,?,?,?,?,?,?,?)`, [raid.gym_id, raid.gym_name, server.id, embed_area, boss_name, 'false', end_time, raid.end], function (error, record, fields) {
          if(error){ console.error(error); }
        });
      }
    });
  }

  // CHECK EACH FEED FILTER
  MAIN.Raid_Channels.forEach((raid_channel,index) => {

    // DEFINE MORE VARIABLES
    let geofences = raid_channel[1].geofences.split(',');
    let channel = MAIN.channels.get(raid_channel[0]);
    let filter = MAIN.Filters.get(raid_channel[1].filter);

    // THROW ERRORS AND BREAK FOR INVALID DATA
    if(!filter){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] The filter defined for'+raid_channel[0]+' does not appear to exist.'); }
    else if(!channel){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] The channel '+raid_channel[0]+' does not appear to exist.'); }

    // FILTER FOR EGG LEVEL
    else if( (type == 'Egg' && filter.Egg_Levels.indexOf(raid.level) >= 0) || (type == 'Boss' && filter.Boss_Levels.indexOf(raid.level) >= 0) || (filter.Boss_Levels.indexOf(boss_name) >= 0) ){

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
      if(MAIN.debug.Raids == 'ENABLED'){ console.info('[DEBUG] [Modules] [raids.js] Raid Did Not Meet Type or Level Filter for '+raid_channel[0]+'. Expected: '+filter.Boss_Levels+', Saw: '+type.toLowerCase()); }
    }
  });
}
