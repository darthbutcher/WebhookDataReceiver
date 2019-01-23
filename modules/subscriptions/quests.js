//#########################################################//
//#########################################################//
//#####    ____  _    _ ______  _____ _______ _____   #####//
//#####   / __ \| |  | |  ____|/ ____|__   __/ ____|  #####//
//#####  | |  | | |  | | |__  | (___    | | | (___    #####//
//#####  | |  | | |  | |  __|  \___ \   | |  \___ \   #####//
//#####  | |__| | |__| | |____ ____) |  | |  ____) |  #####//
//#####   \___\_\\____/|______|_____/   |_| |_____/   #####//
//#####              QUEST SUBSCRIPTIONS              #####//
//#########################################################//
//#########################################################//

const Discord = require('discord.js');
const moment = require('moment');

module.exports.run = async (MAIN, quest, quest_reward, simple_reward, main_area, sub_area, embed_area, server) => {

  if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-Subscriptions] [quests.js] [QUEST] Received '+quest_reward+' Quest for '+server.name+'.'); }

  // FETCH ALL USERS FROM THE USERS TABLE AND CHECK SUBSCRIPTIONS
  MAIN.database.query("SELECT * FROM pokebot.users WHERE discord_id = ? AND status = ?", [server.id, 'ACTIVE'], function (error, users, fields){
    if(users && users[0]){
      users.forEach((user,index) => {

        // FETCH THE GUILD MEMBER AND CHECK IF A ADMINISTRATOR/DONOR
        // let member = MAIN.guilds.get(server.id).members.get(user.user_id);
        // if(!member){ proceed = false; }
        // else if(member.hasPermission('ADMINISTRATOR')){ proceed = true; }
        // else if(server.donor_role && !member.roles.has(server.donor_role)){ proceed = false; }

        // DEFINE VARIABLES
        let user_areas = user.geofence.split(',');

        // CHECK IF THE USER HAS SUBS
        if(user.quests){

          // CHECK IF THE AREA IS WITHIN THE USER'S GEOFENCES
          if(user.geofence == server.name || user_areas.indexOf(main_area) >= 0 || user_areas.indexOf(sub_area) >= 0){

            // CONVERT REWARD LIST TO AN ARRAY
            let subs = user.quests.split(',');

            // CHECK IF THE REWARD IS ONE THEY ARE SUBSCRIBED TO
            if(subs.indexOf(quest_reward) >= 0 || subs.indexOf(simple_reward) >= 0){

              // PREPARE ALERT TO SEND TO USER
              if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-Subscriptions] [quests.js] [QUEST] Preparing '+quest_reward+' Quest for DM.'); }
              send_quest(MAIN, quest, quest_reward, simple_reward, main_area, sub_area, embed_area, server, user);
            }
            else{
              // DEBUG
              if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-Subscriptions] [quests.js] [QUEST] '+quest_reward+' Did Not Pass '+user.user_name+'\'s Reward Filters.'); }
            }
          }
          else{
            // DEBUG
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-Subscriptions] [quests.js] [QUEST] '+quest_reward+' Did Not Pass '+user.user_name+'\'s Area Filters. '+user.geofence+' | '+server.name+','+main_area+','+sub_area); }
          }
        }
      }); return;
    }
  });
}

async function send_quest(MAIN, quest, quest_reward, simple_reward, main_area, sub_area, embed_area, server, user){

  // GET STATIC MAP TILE
  MAIN.Static_Map_Tile(quest.latitude,quest.longitude,'quest').then(async function(img_url){

    // DECLARE VARIABLES
    let expireTime = MAIN.Bot_Time(null, 'quest', server.hour_offset);

    // GET REWARD ICON
    let quest_url = '';
    if(quest_reward.indexOf('Encounter')>=0){
      quest_url = await MAIN.Get_Sprite(quest.rewards[0].info.form_id, quest.rewards[0].info.pokemon_id);
    } else{ quest_url = await MAIN.Get_Icon(quest, quest_reward); }

    // DETERMINE THE QUEST TASK
    let quest_task = '';
    switch(true){

      // CATCHING SPECIFIC POKEMON
      case quest.template.indexOf('catch')>=0:
        if(quest.conditions && quest.conditions[0]){
          if(quest.conditions[0].info && quest.conditions[0].info.pokemon_type_ids){
            quest_task = 'Catch '+quest.target+' '+MAIN.proto.values['poke_type_'+quest.conditions[0].info.pokemon_type_ids[0]]+' Type Pokémon.';
          } else{ quest_task = 'Catch '+quest.target+' '+MAIN.proto.values['quest_condition_'+quest.conditions[0].type]+' Pokémon.'; }
        } else{ quest_task = 'Catch '+quest.target+' Pokémon.'; } break;

      // LANDING SPECIFIC THROWS
      case quest.template.indexOf('great') >= 0:
      case quest.template.indexOf('curveball') >= 0:
      case quest.template.indexOf('excellent') >= 0:
      case quest.template.indexOf('land') >= 0:
        if(quest.conditions[1]){ quest_task = 'Throw '+quest.target+' '+MAIN.proto.values['quest_condition_'+quest.conditions[1].type]+'(s).'; }
        else if(quest.target > 1){ quest_task = 'Perform '+quest.target+' '+MAIN.proto.values['throw_type_'+quest.conditions[0].info.throw_type_id]+' Throws in a Row.'; }
        else{ quest_task = 'Perform '+quest.target+' '+MAIN.proto.values['throw_type_'+quest.conditions[0].info.throw_type_id]+' Throw.'; } break;

      // COMPLETE RAIDS
      case quest.template.indexOf('raid') >= 0:
        if(!quest.conditions[0]){ quest_task='Battle in '+quest.target+' Raid.'; }
        else if(quest.conditions[0].type == 6){ quest_task = 'Battle in '+quest.target+' Raid(s).'; }
        else{ quest_task='Win '+quest.target+' Level '+quest.conditions[0].info.raid_levels+' Raid(s).'; } break;

      // SEND GIFTS TO FRIENDS
      case quest.template.indexOf('gifts') >= 0:
        quest_task = 'Send '+quest.target+' Gift(s).'; break;

      // GYM BATTLING
      case quest.template.indexOf('gym') >= 0:
        if(quest.target > 1){ quest_task = 'Battle '+quest.target+' Times in a Gym.'; }
        else{ quest_task = 'Battle '+quest.target+' Time in a Gym.'; } break;

      // BERRY GYM POKEMON
      case quest.template.indexOf('berry') >= 0:
        quest_task = 'Berry Pokémon '+quest.target+' Time(s) in a Gym.'; break;

      // HATCH EGGS
      case quest.template.indexOf('hatch') >= 0:
        if(quest.target > 1){ quest_task='Hatch '+quest.target+' Eggs.'; }
        else{ quest_task = 'Hatch '+quest.target+' Egg.'; } break;

      // SPIN POKESTOPS
      case quest.template.indexOf('spin') >= 0:
        quest_task = 'Spin '+quest.target+' Pokéstops.'; break;

      // EVOLVE POKEMON
      case quest.template.indexOf('evolve') >= 0:
        quest_task = 'Evolve '+quest.target+' Pokémon.'; break;

      // BUDDY TASKS
      case quest.template.indexOf('buddy') >= 0:
        quest_task = 'Get '+quest.target+' Buddy Walking Candy.'; break;

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
      default: return console.error('NO CASE FOR THIS QUEST ('+quest.pokestop_id+')', quest);
    }

    // GET EMBED COLOR BASED ON QUEST DIFFICULTY
    let embed_color = '';
    switch(true){
      case quest.template.indexOf('easy') >= 0: embed_color = '00ff00'; break;
      case quest.template.indexOf('moderate') >= 0: embed_color = 'ffff00'; break;
      case quest.template.indexOf('hard') >= 0: embed_color = 'ff0000'; break;
      default: embed_color = '00ccff';
    }

    // CREATE RICH EMBED
    if(!quest_url){ quest_url = quest.url; }
    let quest_embed = new Discord.RichEmbed()
      .setColor(embed_color).setThumbnail(quest_url)
      .addField( quest_reward+'  |  '+embed_area, quest_task, false)
      .addField('Pokéstop:', quest.pokestop_name, false)
      .addField('Directions:','[Google Maps](https://www.google.com/maps?q='+quest.latitude+','+quest.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+quest.latitude+','+quest.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+quest.latitude+','+quest.longitude+'&navigate=yes)')
      .setFooter('Expires: '+expireTime)
      .setImage(img_url);

    // CHECK DISCORD CONFIG
    if(MAIN.config.QUEST.Subscriptions == 'ENABLED'){
      // CHECK THE TIME VERSUS THE USERS SET SUBSCRIPTION TIME
      let time_now = new Date().getTime(); let todays_date = moment(time_now).format('MM/DD/YYYY');
      let db_date = moment(todays_date+' '+user.alert_time, 'MM/DD/YYYY H:mm').valueOf()

      // DEFINE VARIABLES
      let quest_object = JSON.stringify(quest);
      quest_embed = JSON.stringify(quest_embed);

      // SAVE THE ALERT TO THE ALERT TABLE FOR FUTURE DELIVERY
      return MAIN.database.query(`INSERT INTO pokebot.quest_alerts (user_id, user_name, quest, embed, area, bot, alert_time, discord_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.user_id, user.user_name.replace(/[\W]+/g,''), quest_object, quest_embed, embed_area, user.bot, db_date, server.id], function (error, alert, fields) {
          if(error){ console.error('[Pokébot] UNABLE TO ADD ALERT TO pokebot.quest_alerts',error); }
          else if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Subscriptions] Stored a '+quest_reward+' Quest Alert for '+user.user_name+'.'); }
      });
    }
    else{
      return console.info('[Pokébot] '+quest_reward+' Quest ignored due to Disabled Discord Feed Setting.');
    }
  }); return;
}
