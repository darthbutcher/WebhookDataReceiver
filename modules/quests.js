const Discord = require('discord.js');
const Subscription = require('./subscriptions/quests.js');
const insideGeofence = require('point-in-polygon');
const insideGeojson = require('point-in-geopolygon');

//#########################################################//
//#########################################################//
//#####    ____  _    _ ______  _____ _______ _____   #####//
//#####   / __ \| |  | |  ____|/ ____|__   __/ ____|  #####//
//#####  | |  | | |  | | |__  | (___    | | | (___    #####//
//#####  | |  | | |  | |  __|  \___ \   | |  \___ \   #####//
//#####  | |__| | |__| | |____ ____) |  | |  ____) |  #####//
//#####   \___\_\\____/|______|_____/   |_| |_____/   #####//
//#####            QUEST PARSING AND FEEDS            #####//
//#########################################################//
//#########################################################//

module.exports.run = async (MAIN, quest, main_area, sub_area, embed_area, server) => {

  // DETERMINE THE QUEST REWARD
  let  quest_reward = '', simple_reward = '';
  switch(quest.rewards[0].type){
    // PLACEHOLDER
    case 1: return console.error('NO REWARD SET. REPORT THIS TO THE DISCORD ALONG WITH THE FOLLOWING.',quest);

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
    case 4: return console.error('NO REWARD SET. REPORT THIS TO THE DISCORD ALONG WITH THE FOLLOWING.',quest);

    // PLACEHOLDER
    case 5: return console.error('NO REWARD SET. REPORT THIS TO THE DISCORD ALONG WITH THE FOLLOWING.',quest);

    // PLACEHOLDER
    case 6: return console.error('NO REWARD SET. REPORT THIS TO THE DISCORD ALONG WITH THE FOLLOWING.',quest);

    // ENCOUNTER REWARDS
    case 7:
      simple_reward = MAIN.pokemon[quest.rewards[0].info.pokemon_id].name;
      quest_reward = MAIN.pokemon[quest.rewards[0].info.pokemon_id].name+' Encounter'; break;
  }

  // CHECK ALL FILTERS
  MAIN.Quest_Channels.forEach((quest_channel,index) => {

    // DEFINE MORE VARIABLES
    let geofences = quest_channel[1].geofences.split(',');
    let channel = MAIN.channels.get(quest_channel[0]);
    let filter = MAIN.Filters.get(quest_channel[1].filter);

    // THROW ERRORS FOR INVALID DATA
    if(!filter){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] The filter defined for'+quest_channel[0]+' does not appear to exist.'); }
    if(!channel){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] The channel '+quest_channel[0]+' does not appear to exist.'); }

    // ONLY LOOK AT QUEST FILTERS
    if(filter.Type == 'quest'){

      // AREA FILTER

      if(geofences.indexOf(server.geofence)>=0 || geofences.indexOf(main_area)>=0 || geofences.indexOf(sub_area)>=0){

        // SECONDARY FILTERING BASED ON FILTER CONFIG
        if(filter.Rewards.indexOf(quest_reward) >= 0 || filter.Rewards.indexOf(simple_reward) >= 0){

          // PREPARE AND SEND TO DISCORDS
          send_quest(MAIN, quest, channel, quest_reward, simple_reward, main_area, sub_area, embed_area, server);
        }
        else{ // DEBUG
          if(MAIN.debug.Quests == 'ENABLED'){ console.info('[DEBUG] [quests.js] '+quest_reward+' Quest did not pass the Reward Filter. '+channel.guild.name+'|'+quest_channel[1].filter); }
        }
      }
      else{ // DEBUG
        if(MAIN.debug.Quests == 'ENABLED'){ console.info('[DEBUG] [quests.js] '+quest_reward+' Quest did not pass the Area Filter. '+quest_reward+'|'+quest_channel[1].filter); }
      }
    }
  }); return;
}

async function send_quest(MAIN, quest, channel, quest_reward, simple_reward, main_area, sub_area, embed_area, server){

  // GET STATIC MAP TILE
  MAIN.Static_Map_Tile(quest.latitude,quest.longitude,'quest').then(async function(imgUrl){

    // ATTACH THE MAP TILE
    let attachment = new Discord.Attachment(imgUrl, 'maptile.jpg');
    // DECLARE VARIABLES
    let expireTime = MAIN.Bot_Time(null,'quest');

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
      .attachFile(attachment).setImage('attachment://maptile.jpg')
      .setColor(embed_color).setThumbnail(quest_url)
      .addField( quest_reward+'  |  '+embed_area, quest_task, false)
      .addField('Pokéstop:', quest.pokestop_name, false)
      .addField('Directions:','[Google Maps](https://www.google.com/maps?q='+quest.latitude+','+quest.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+quest.latitude+','+quest.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+quest.latitude+','+quest.longitude+'&navigate=yes)')
      .setFooter('Expires: '+expireTime);

    // LOGGING
    if(MAIN.debug.Quests == 'ENABLED'){ console.info('[DEBUG] [quests.js] '+quest_reward+' Quest PASSED Secondary Filters and Sent to '+channel.guild.name+' ('+channel.id+').'); }
    else if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Sent a '+quest_reward+' Quest for '+channel.guild.name+' ('+channel.id+').'); }

    // CHECK SUBSCRIPTION CONFIG
    // if(MAIN.config.QUEST.Subscriptions == 'ENABLED'){
    //   Subscription.run(MAIN, quest, quest_embed, main_area, sub_area, embed_area, server);
    // } else{ console.info('[Pokébot] '+quest_reward+' Quest ignored due to Disabled Subscription setting.'); }

    // CHECK DISCORD CONFIG
    if(MAIN.config.QUEST.Discord_Feeds == 'ENABLED'){
      MAIN.Send_Embed(quest_embed, channel.id);
    } else{ console.info('[Pokébot] '+quest_reward+' Quest ignored due to Disabled Discord Feed Setting.'); }
  }); return;
}
