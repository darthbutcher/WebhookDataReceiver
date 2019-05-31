delete require.cache[require.resolve('../embeds/quests.js')];
const Send_Quest = require('../embeds/quests.js');
const Discord = require('discord.js');
const Embed_Config = require('../../embeds/quests.js');
const moment = require('moment');

module.exports.run = async (MAIN, quest, main_area, sub_area, embed_area, server, timezone) => {

  // DETERMINE THE QUEST REWARD
  let quest_reward = '', simple_reward = '', form_name = '';
  let embed = 'quests.js'
  switch(quest.rewards[0].type){
    // PLACEHOLDER
    case 1: return console.error('NO REWARD SET. REPORT THIS TO THE DISCORD ALONG WITH THE FOLLOWING:',quest);
    // ITEM REWARDS (EXCEPT STARDUST)
    case 2:
      simple_reward = MAIN.proto.values['item_'+quest.rewards[0].info.item_id];
      quest_reward = quest.rewards[0].info.amount+' '+MAIN.proto.values['item_'+quest.rewards[0].info.item_id];
      if(quest.rewards[0].info.amount > 1){
        if(quest_reward.indexOf('Berry') >= 0){ quest_reward = quest_reward.toString().slice(0,-1)+'ies'; }
        else{ quest_reward = quest_reward+'s'; }
      } break;
    // STARDUST REWARD
    case 3: quest_reward = quest.rewards[0].info.amount+' Stardust'; break;
    // PLACEHOLDER
    case 4: return console.error('NO REWARD SET. REPORT THIS TO THE DISCORD ALONG WITH THE FOLLOWING:',quest);
    // PLACEHOLDER
    case 5: return console.error('NO REWARD SET. REPORT THIS TO THE DISCORD ALONG WITH THE FOLLOWING:',quest);
    // PLACEHOLDER
    case 6: return console.error('NO REWARD SET. REPORT THIS TO THE DISCORD ALONG WITH THE FOLLOWING:',quest);
    // ENCOUNTER REWARDS
    case 7:
      form = quest.rewards[0].info.form_id;
      if (form > 0){
        form_name = ' ['+MAIN.masterfile.pokemon[quest.rewards[0].info.pokemon_id].forms[form].name+']';
      }
      simple_reward = MAIN.masterfile.pokemon[quest.rewards[0].info.pokemon_id].name+form_name;
      quest_reward = MAIN.masterfile.pokemon[quest.rewards[0].info.pokemon_id].name+form_name+' Encounter';
      if(quest.rewards[0].info.shiny == true){
        simple_reward = 'Shiny '+simple_reward;
        quest_reward = 'Shiny '+quest_reward;
      } break;
  }

  if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-Subscriptions] [quests.js] [QUEST] Received '+quest_reward+' Quest for '+server.name+'.'); }

  // FETCH ALL USERS FROM THE USERS TABLE AND CHECK SUBSCRIPTIONS
  MAIN.pdb.query(`SELECT * FROM users WHERE discord_id = ? AND status = ?`, [server.id, 'ACTIVE'], function (error, users, fields){
    if(users && users[0]){
      users.forEach((user,index) => {

        //FETCH THE GUILD MEMBER AND CHECK IF A ADMINISTRATOR/DONOR
        let member = MAIN.guilds.get(server.id).members.get(user.user_id);
        if(!member){ proceed = false; }
        else if(member.hasPermission('ADMINISTRATOR')){ proceed = true; }
        else if(server.donor_role && !member.roles.has(server.donor_role)){ proceed = false; }

        // DEFINE VARIABLES
        let user_areas = user.geofence.split(',');

        // CHECK IF THE USER HAS SUBS
        if(user.quests && user.quests_status == 'ACTIVE'){

          // CHECK IF THE AREA IS WITHIN THE USER'S GEOFENCES
          if(user.geofence == server.name || user_areas.indexOf(main_area) >= 0 || user_areas.indexOf(sub_area) >= 0){

            // CONVERT REWARD LIST TO AN ARRAY
            let subs = user.quests.split(',');

            // CHECK IF THE REWARD IS ONE THEY ARE SUBSCRIBED TO
            if(subs.indexOf(quest_reward) >= 0 || subs.indexOf(simple_reward) >= 0){

              // PREPARE ALERT TO SEND TO USER
              if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-Subscriptions] [quests.js] [QUEST] Preparing '+quest_reward+' Quest for DM.'); }
              send_quest(MAIN, quest, quest_reward, simple_reward, main_area, sub_area, embed_area, server, user, timezone);
            } else{
              // DEBUG
              if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-Subscriptions] [quests.js] [QUEST] '+quest_reward+' Did Not Pass '+user.user_name+'\'s Reward Filters.'); }
            }
          } else{
            // DEBUG
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-Subscriptions] [quests.js] [QUEST] '+quest_reward+' Did Not Pass '+user.user_name+'\'s Area Filters. '+user.geofence+' | '+server.name+','+main_area+','+sub_area); }
          }
        }
      });
    }
  }); return;
}

function get_quest_task(MAIN, quest){
  // DETERMINE THE QUEST TASK
  let quest_task = '';
  switch(true){

    // CATCHING SPECIFIC POKEMON
    case quest.template.indexOf('catch_specific')>=0:
      if(quest.conditions[0].info && quest.conditions[0].info.pokemon_ids){
        quest_task = 'Catch '+quest.target+' '+MAIN.masterfile.pokemon[quest.conditions[0].info.pokemon_ids[0]]+'.';
      } break;

    // CATCH POKEMON TYPES
    case quest.template.indexOf('catch_types')>=0:
      if(quest.conditions[0].info && quest.conditions[0].info.pokemon_type_ids){
        let catch_types = '';
        quest.conditions[0].info.pokemon_type_ids.forEach((type,index) => { catch_types += type+', '; });
        catch_types = catch_types.slice(0,-2);
        quest_task = 'Catch '+quest.target+' '+catch_types+' Type Pokémon.';
      } break;

    // CATCH WEATHER BOOSTED
    case quest.template.indexOf('catch_weather')>=0:
      if(quest.conditions[0].info && quest.conditions[0].info.pokemon_type_ids){
        quest_task = 'Catch '+quest.target+' Weather Boosted Pokémon.';
      } break;

    // CATCH POKEMON OTHER
    case quest.template.indexOf('catch')>=0:
      if(quest.conditions && quest.conditions[0]){
        if(quest.conditions[0].info && quest.conditions[0].info.pokemon_type_ids){
          quest_task = 'Catch '+quest.target+' '+MAIN.proto.values['poke_type_'+quest.conditions[0].info.pokemon_type_ids[0]]+' Type Pokémon.';
        } else{
          quest_task = 'Catch '+quest.target+' '+MAIN.proto.values['quest_condition_'+quest.conditions[0].type]+' Pokémon.';
        }
      } else{
        quest_task = 'Catch '+quest.target+' Pokémon.';
      } break;

    // LANDING SPECIFIC THROWS
    case quest.template.indexOf('land') >= 0:
      let curveball = '';
      if(quest.template.indexOf('curve') >= 0){ curveball = ' Curveball'; }
      if(quest.template.indexOf('inarow') >= 0){
        quest_task = 'Perform '+quest.target+' '+MAIN.proto.values['throw_type_'+quest.conditions[0].info.throw_type_id]+curveball+' Throw(s) in a Row.';
      } else{
        quest_task = 'Perform '+quest.target+' '+MAIN.proto.values['throw_type_'+quest.conditions[0].info.throw_type_id]+curveball+' Throw(s).';
      } break;

    // COMPLETE RAIDS
    case quest.template.indexOf('raid') >= 0:
      if(!quest.conditions[0]){ quest_task = 'Battle in '+quest.target+' Raid.'; }
      else if(quest.conditions[0].type == 6){ quest_task = 'Battle in '+quest.target+' Raid(s).'; }
      else{ quest_task = 'Win '+quest.target+' Level '+quest.conditions[0].info.raid_levels+' Raid(s).'; } break;

    // SEND GIFTS TO FRIENDS
    case quest.template.indexOf('gifts') >= 0:
      quest_task = 'Send '+quest.target+' Gift(s) to Friends.'; break;

    // GYM BATTLING
    case quest.template.indexOf('gym_easy') >= 0:
    case quest.template.indexOf('gym_try') >= 0:
      quest_task = 'Battle '+quest.target+' Time(s) in a Gym.'; break;
    case quest.template.indexOf('gym_win') >= 0:
      quest_task = 'Win '+quest.target+' Gym Battle(s).'; break;

    // CATCH WITH PINAP
    case quest.template.indexOf('berry_pinap') >= 0:
      quest_task = 'Catch '+quest.target+' Pokémon With a Pinap Berry.'; break;

    // CATCH WITH NANAB
    case quest.template.indexOf('t2_2019_berry_nanab_pkmn') >= 0:
      quest_task = 'Catch '+quest.target+' Pokémon With a Nanab Berry.'; break;

    // CATCH WITH RAZZ
    case quest.template.indexOf('berry_razz') >= 0:
      quest_task = 'Catch '+quest.target+' Pokémon With a Razz Berry.'; break;

    // CATCH WITH ANY BERRY
    case quest.template.indexOf('berry_easy') >= 0:
      quest_task = 'Catch '+quest.target+' Pokémon With a Razz Berry.'; break;
    case quest.template.indexOf('challenge_berry_moderate') >= 0:
      quest_task = 'Catch '+quest.target+' Pokémon With Any Berry.'; break;

    // HATCH EGGS
    case quest.template.indexOf('hatch') >= 0:
      if(quest.target > 1){ quest_task='Hatch '+quest.target+' Eggs.'; }
      else{ quest_task = 'Hatch '+quest.target+' Egg.'; } break;

    // SPIN POKESTOPS
    case quest.template.indexOf('spin') >= 0:
      quest_task = 'Spin '+quest.target+' Pokéstops.'; break;

    // EVOLVE POKEMON
    case quest.template.indexOf('evolve_specific_plural') >= 0:
      let quest_pokemon = '';
      for(let p = 0; p < quest.conditions[0].info.pokemon_ids.length; p++){
        quest_pokemon = MAIN.masterfile.pokemon[quest.conditions[0].info.pokemon_ids[p]].name+', ';
      }
      quest_pokemon = quest_pokemon.slice(0,-2);
      quest_task = 'Evolve a '+quest_pokemon; break;
    case quest.template.indexOf('evolve_item') >= 0:
      quest_task = 'Evolve '+quest.target+' Pokémon with an Evolution Item.'; break;
    case quest.template.indexOf('evolve') >= 0:
      quest_task = 'Evolve '+quest.target+' Pokémon.'; break;

    // BUDDY TASKS
    case quest.template.indexOf('buddy') >= 0:
      quest_task = 'Get '+quest.target+' Candy from Walking a Pokémon Buddy.'; break;

    // POWER UP POKEMON
    case quest.template.indexOf('powerup') >= 0:
      quest_task = 'Power Up '+quest.target+' Pokémon.'; break;

    // TRADE POKEMON
    case quest.template.indexOf('trade') >= 0:
      quest_task = 'Perform '+quest.target+' Trade(s) with a Friend.'; break;
    // TRANSFER POKEMON
    case quest.template.indexOf('transfer') >= 0:
      quest_task = 'Transfer '+quest.target+' Pokémon.'; break;

    // USE SPECIFIC CHARGE MOVES
    case quest.template.indexOf('charge') >= 0:
      if(quest.target > 1){ quest_task='Use a Super Effective Charge Move '+quest.target+' Times.'; }
      else{ quest_task = 'Use a Super Effective Charge Move '+quest.target+' Time.'; } break;

    // CATCH MISSING QUESTS
    default: return console.error('NO CASE FOR THIS QUEST ('+quest.pokestop_id+')', quest);
  }

  // RETURN THE TASK
  return quest_task;
}

async function send_quest(MAIN, quest, quest_reward, simple_reward, main_area, sub_area, embed_area, server, user, timezone){
  let pokestop = {name: quest.pokestop_name, reward: quest_reward, area: embed_area};
  pokestop.lat = quest.latitude, pokestop.lon = quest.longitude;

  // GET STATIC MAP TILE
  pokestop.map_img = '';
  if(MAIN.config.Map_Tiles == 'ENABLED'){
    pokestop.map_img = await MAIN.Static_Map_Tile(quest.latitude, quest.longitude, 'quest');
  }

  // GET MAP URL FROM CONFIG
  pokestop.map_url = MAIN.config.FRONTEND_URL;

  // DECLARE VARIABLES
  pokestop.time = MAIN.Bot_Time(null, 'quest', timezone);

  // GET REWARD ICON
  pokestop.sprite = '';
  if(quest_reward.indexOf('Encounter')>=0){
    pokestop.sprite = await MAIN.Get_Sprite(quest.rewards[0].info.form_id, quest.rewards[0].info.pokemon_id);
  } else{ pokestop.sprite = await MAIN.Get_Icon(quest, quest_reward); }

  // GET THE QUEST TASK
  pokestop.task = await get_quest_task(MAIN, quest);

  // GET EMBED COLOR BASED ON QUEST DIFFICULTY
  pokestop.color = '';
  switch(true){
    case quest.template.indexOf('easy') >= 0: pokestop.color = '00ff00'; break;
    case quest.template.indexOf('moderate') >= 0: pokestop.color = 'ffff00'; break;
    case quest.template.indexOf('hard') >= 0: pokestop.color = 'ff0000'; break;
    default: pokestop.color = '00ccff';
  }

  // CREATE QUEST EMBED
  if(!pokestop.sprite){ pokestop.sprite = quest.url; }
  quest_embed = Embed_Config(pokestop);

  // CHECK DISCORD CONFIG
  if(MAIN.config.QUEST.Subscriptions == 'ENABLED'){
    // CHECK THE TIME VERSUS THE USERS SET SUBSCRIPTION TIME
    let time_now = new Date().getTime(); let todays_date = moment(time_now).format('MM/DD/YYYY');
    let db_date = moment(todays_date+' '+user.alert_time, 'MM/DD/YYYY H:mm').valueOf()

    // DEFINE VARIABLES
    let quest_object = JSON.stringify(quest);
    quest_embed = JSON.stringify(quest_embed);

    // SAVE THE ALERT TO THE ALERT TABLE FOR FUTURE DELIVERY
    return MAIN.pdb.query(`INSERT INTO quest_alerts (user_id, user_name, quest, embed, area, bot, alert_time, discord_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user.user_id, user.user_name.replace(/[\W]+/g,''), quest_object, quest_embed, embed_area, user.bot, db_date, server.id], function (error, alert, fields) {
        if(error){ console.error('[Pokébot] UNABLE TO ADD ALERT TO quest_alerts',error); }
        else if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Subscriptions-Quest] Stored a '+quest_reward+' Quest Alert for '+user.user_name+'.'); }
    });
  } else{
    return console.info('[Pokébot] '+quest_reward+' Quest ignored due to Disabled Discord Feed Setting.');
  } return;
}
