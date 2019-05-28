const Discord = require('discord.js');
const Embed_Config = require('../../config/embed_raids.js');
const Embed_EggConfig = require('../../config/embed_raid_eggs.js');

module.exports.run = async (MAIN, target, raid, raid_type, main_area, sub_area, embed_area, server, timezone, role_id) => {

  // CHECK IF THE TARGET IS A USER
  let member = MAIN.guilds.get(server.id).members.get(target.user_id);

  // VARIABLES
  let gym = { id: raid.gym_id, level: raid.level, form: '', notes: '', type: '', weaknesses: '', exraid: '', sprite: ''};
  gym.lat = raid.latitude, gym.lon = raid.longitude, gym.map_img = '';
  gym.area = embed_area;

  // CHECK FOR GYM NAME AND NOTES
  if(!raid.gym_name){ gym.name = 'No Name'; }
  else{ gym.name = raid.gym_name; }

  if (!MAIN.gym_notes[gym.id]) {
    if(MAIN.config.DEBUG.Raids == 'ENABLED') {console.log('[Pokébot] [Embed] [raids.js] GYM Has no note in gyms.json, add note.');}
  } else { gym_notes = MAIN.gym_notes[gym.id].description; }

  // CHECK IF SPONSORED GYM
  gym.sponsor = '';
  if(raid.sponsor_id == true){ gym.sponsor = ' | '+MAIN.emotes.exPass+' Eligible'; }
  if(raid.ex_raid_eligible == true){ raid_sponsor = ' | '+MAIN.emotes.exPass+' Eligible'; }

  // CHECK IF EXCLUSIVE RAID
  if(raid.is_exclusive == true){ gmy.is_exclusive = '**EXRaid Invite Only** '; }

  // DETERMINE GYM CONTROL
  switch(raid.team_id){
    case 1: gym.team = MAIN.emotes.mystic+' Gym'; break;
    case 2: gym.team = MAIN.emotes.valor+' Gym'; break;
    case 3: gym.team = MAIN.emotes.instinct+' Gym'; break;
    default: gym.team = 'Uncontested Gym';
  }

  // GET RAID COLOR
  switch(raid.level){
    case 1:
    case 2: gym.color = 'f358fb'; break;
    case 3:
    case 4: gym.color = 'ffd300'; break;
    case 5: gym.color = '5b00de'; break;
  }

  time_now = new Date().getTime();
  gym.start = raid.start, gym.end = raid.end;
  gym.hatch_time = MAIN.Bot_Time(raid.start, '1', timezone);
  gym.end_time = MAIN.Bot_Time(raid.end, '1', timezone);
  gym.hatch_mins = Math.floor((raid.start-(time_now/1000))/60);
  gym.end_mins = Math.floor((raid.end-(time_now/1000))/60);

  // GET STATIC MAP TILE
  if(MAIN.config.Map_Tiles == 'ENABLED'){
    gym.map_img = await MAIN.Static_Map_Tile(raid.latitude, raid.longitude, 'raid');
  }
  gym.map_url = MAIN.config.FRONTEND_URL;

  // DETERMINE IF IT'S AN EGG OR A RAID
  switch(raid_type){

    case 'Egg':
      gym.boss = 'Egg';

      // GET EGG IMAGE
      switch(raid.level){
        case 1:
        case 2: gym.sprite = 'https://i.imgur.com/ABNC8aP.png'; break;
        case 3:
        case 4: gym.sprite = 'https://i.imgur.com/zTvNq7j.png'; break;
        case 5: gym.sprite = 'https://i.imgur.com/jaTCRXJ.png'; break;
      }

      // CREATE THE EGG EMBED
      raid_embed = await Embed_EggConfig(gym);

      // ADD FOOTER IF RAID LOBBIES ARE ENABLED
      if(raid.level >= server.min_raid_lobbies){ raid_embed.setFooter(gym.id); }

      // CHECK CONFIGS AND SEND TO USER OR FEED
      if(member && MAIN.config.RAID.Subscriptions == 'ENABLED'){
        if(MAIN.config.DEBUG.Raids == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Embed] [raids.js] Sent a Level '+raid.level+' Raid Egg to '+member.user.tag+' ('+member.id+').'); }
        MAIN.Send_DM(server.id, member.id, raid_embed, target.bot);
      } else if(MAIN.config.RAID.Discord_Feeds == 'ENABLED'){
        if(MAIN.config.DEBUG.Raids == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Embed] [raids.js] Sent a Level '+raid.level+' Raid Egg to '+target.guild.name+' ('+target.id+').'); }
        MAIN.Send_Embed('raid', raid.level, server, role_id, raid_embed, target.id);
      } else{ console.info('[Pokébot] Raid ignored due to Disabled Discord Feed setting.'); }
      // CHECK FOR RAID LOBBIES
      setTimeout(async function() {
        if(MAIN.config.Raid_Lobbies == 'ENABLED'){
          // UPDATE BOSS NAME
          MAIN.pdb.query(`UPDATE active_raids SET embed = ? WHERE gym_id = ?`, [JSON.stringify(gym), gym.id], function (error, record, fields) {
            if(error){ console.error(error); }
          });
        }
      }, 5000); break;

    // RAID IS A BOSS
    case 'Boss':
      // DETERMINE POKEMON NAME, FORM, TYPE, AND WEAKNESSES
      gym.boss = MAIN.pokemon[raid.pokemon_id].name;
      if (raid.form > 0){
        gym.form = '['+MAIN.pokemon[raid.pokemon_id].forms[raid.form].name+']';
        await MAIN.pokemon[raid.pokemon_id].forms[raid.form].types.forEach((type) => {
         gym.type += type+' '+MAIN.emotes[type.toLowerCase()]+' / ';
         MAIN.types[type.toLowerCase()].weaknesses.forEach((weakness,index) => {
           if(gym.weaknesses.indexOf(MAIN.emotes[weakness.toLowerCase()]) < 0){
             gym.weaknesses += MAIN.emotes[weakness.toLowerCase()]+' ';
           }
         }); });
      } else{
        await MAIN.pokemon[raid.pokemon_id].types.forEach((type) => {
         gym.type += type+' '+MAIN.emotes[type.toLowerCase()]+' / ';
         MAIN.types[type.toLowerCase()].weaknesses.forEach((weakness,index) => {
           if(gym.weaknesses.indexOf(MAIN.emotes[weakness.toLowerCase()]) < 0){
             gym.weaknesses += MAIN.emotes[weakness.toLowerCase()]+' ';
           }
         }); });
      }
      gym.type = gym.type.slice(0,-3);
      gym.weaknesses = gym.weaknesses.slice(0,-1);

      if(!MAIN.pokemon['moves'][raid.move_1]){ console.error('Move ID #'+raid.move_1+' not found in pokemon.json. Please report to the Discord.'); }
      if(!MAIN.pokemon['moves'][raid.move_2]){ console.error('Move ID #'+raid.move_2+' not found in pokemon.json. Please report to the Discord.'); }

      // DETERMINE MOVE NAMES AND TYPES
      gym.move_name_1 = MAIN.pokemon['moves'][raid.move_1].name;
      gym.move_type_1 = MAIN.emotes[MAIN.pokemon['moves'][raid.move_1].type.toLowerCase()];
      gym.move_name_2 = MAIN.pokemon['moves'][raid.move_2].name;
      gym.move_type_2 = MAIN.emotes[MAIN.pokemon['moves'][raid.move_2].type.toLowerCase()];

      // GET THE RAID BOSS SPRITE
      gym.sprite = await MAIN.Get_Sprite(raid.form, raid.pokemon_id);

      // CREATE THE RAID EMBED
      raid_embed = await Embed_Config(gym)

      // ADD FOOTER IF RAID LOBBIES ARE ENABLED
      if(raid.level >= server.min_raid_lobbies){ raid_embed.setFooter(gym.id); }

      // CHECK CONFIGS AND SEND TO USER OR FEED
      if(member && MAIN.config.RAID.Subscriptions == 'ENABLED'){
        if(MAIN.config.DEBUG.Raids == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Embed] [raids.js] Sent a '+pokemon_name+' Raid Boss to '+member.user.tag+' ('+member.id+').'); }
        MAIN.Send_DM(server.id, member.id, raid_embed, target.bot);
      } else if(MAIN.config.RAID.Discord_Feeds == 'ENABLED'){
        if(MAIN.config.DEBUG.Raids == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Embed] [raids.js] Sent a '+pokemon_name+' Raid Boss to '+target.guild.name+' ('+target.id+').'); }
        MAIN.Send_Embed('raid', raid.level, server, role_id, raid_embed, target.id);
      } else{ console.info('[Pokébot] Raid ignored due to Disabled Discord Feed setting.'); }
      // CHECK FOR RAID LOBBIES
      setTimeout( async function() {
        if(MAIN.config.Raid_Lobbies == 'ENABLED'){
          MAIN.pdb.query(`SELECT * FROM active_raids WHERE gym_id = ?`, [gym.id], function (error, record, fields) {
            if(record[0]){
              // UPDATE EMBED
              MAIN.pdb.query(`UPDATE active_raids SET embed = ? WHERE gym_id = ?`, [JSON.stringify(gym), gym.id], function (error, record, fields) {
                if(error){ console.error(error); }
              });
            }
          });
        }
      }, 5000); break;
  }
  return;
}
