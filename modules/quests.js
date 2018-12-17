const Discord=require('discord.js');

//#########################################################//
//#########################################################//
//#####    ____  _    _ ______  _____ _______ _____   #####//
//#####   / __ \| |  | |  ____|/ ____|__   __/ ____|  #####//
//#####  | |  | | |  | | |__  | (___    | | | (___    #####//
//#####  | |  | | |  | |  __|  \___ \   | |  \___ \   #####//
//#####  | |__| | |__| | |____ ____) |  | |  ____) |  #####//
//#####   \___\_\\____/|______|_____/   |_| |_____/   #####//
//#####      QUEST POSTING AND DM SUBSCRIPTIONS       #####//
//#########################################################//
//#########################################################//

module.exports.run = async (MAIN, quest, city) => {

  // DEBUG
  if(MAIN.debug.Quests == 'ENABLED'){ console.info('[DEBUG] [quests.js] Received Quest. '+quest.pokestop_id); }

  // DEFINE VARIABLES
  let questTask = '', questUrl = '', questReward = '';
  let simpleReward = '', area = '', expireTime = MAIN.Bot_Time(null,'quest');

  // GET STATIC MAP TILE
  MAIN.Static_Map_Tile(quest.latitude,quest.longitude).then(async function(imgUrl){

    // ATTACH THE MAP TILE
    let attachment = new Discord.Attachment(imgUrl, 'maptile.jpg');

    // GET THE GENERAL AREA
    let questArea = await MAIN.Get_Area(quest.latitude,quest.longitude);

    // CHECK FOR EMPTY DATA
    if(!quest.pokestop_id){ return; }

    // DETERMINE THE QUEST REWARD AND CHANNEL
    switch(quest.rewards[0].type){

      // PLACEHOLDER
      case 1: return console.error('NO REWARD SET. REPORT THIS TO THE DISCORD ALONG WITH THE FOLLOWING.',quest);

      // ITEM REWARDS (EXCEPT STARDUST)
      case 2:
        simpleReward=MAIN.proto.values['item_'+quest.rewards[0].info.item_id];
        questReward=quest.rewards[0].info.amount+' '+MAIN.proto.values['item_'+quest.rewards[0].info.item_id];
        if(quest.rewards[0].info.amount>1){
          if(questReward.indexOf('Berry')>=0){ questReward = questReward.toString().slice(0,-1)+'ies'; }
          else{ questReward = questReward+'s'; }
        } break;

      // STARDUST REWARD
      case 3:
        simpleReward = 'Stardust'; questReward = quest.rewards[0].info.amount+' Stardust'; break;

      // PLACEHOLDER
      case 4:
        return console.error('NO REWARD SET. REPORT THIS TO THE DISCORD ALONG WITH THE FOLLOWING.',quest);

      // PLACEHOLDER
      case 5:
        return console.error('NO REWARD SET. REPORT THIS TO THE DISCORD ALONG WITH THE FOLLOWING.',quest);

      // PLACEHOLDER
      case 6:
        return console.error('NO REWARD SET. REPORT THIS TO THE DISCORD ALONG WITH THE FOLLOWING.',quest);

      // ENCOUNTER REWARDS
      case 7:
        simpleReward = MAIN.pokemon[quest.rewards[0].info.pokemon_id].name;
        questReward = MAIN.pokemon[quest.rewards[0].info.pokemon_id].name+' Encounter'; break;
    }

    // GET REWARD ICON
    if(questReward.indexOf('Encounter')>=0){
      questUrl = await MAIN.Get_Sprite(quest.rewards[0].info.form_id, quest.rewards[0].info.pokemon_id);
    }
    else{
      questUrl = await MAIN.Get_Icon(quest, questReward);
    }

    // DETERMINE THE QUEST TASK
    switch(true){

      // CATCHING SPECIFIC POKEMON
      case quest.template.indexOf('catch')>=0:
        if(quest.conditions && quest.conditions[0]){
          if(quest.conditions[0].info && quest.conditions[0].info.pokemon_type_ids){
            questTask = 'Catch '+quest.target+' '+MAIN.proto.values['poke_type_'+quest.conditions[0].info.pokemon_type_ids[0]]+' Type Pokémon.';
          } else{ questTask = 'Catch '+quest.target+' '+MAIN.proto.values['quest_condition_'+quest.conditions[0].type]+' Pokémon.'; }
        } else{ questTask = 'Catch '+quest.target+' Pokémon.'; } break;

      // LANDING SPECIFIC THROWS
      case quest.template.indexOf('great')>=0:
      case quest.template.indexOf('curveball')>=0:
      case quest.template.indexOf('excellent')>=0:
      case quest.template.indexOf('land')>=0:
        if(quest.conditions[1]){ questTask = 'Throw '+quest.target+' '+MAIN.proto.values['quest_condition_'+quest.conditions[1].type]+'(s).'; }
        else if(quest.target>1){ questTask = 'Perform '+quest.target+' '+MAIN.proto.values['throw_type_'+quest.conditions[0].info.throw_type_id]+' Throws in a Row.'; }
        else{ questTask = 'Perform '+quest.target+' '+MAIN.proto.values['throw_type_'+quest.conditions[0].info.throw_type_id]+' Throw.'; } break;

      // COMPLETE RAIDS
      case quest.template.indexOf('raid') >= 0:
        if(!quest.conditions[0]){ questTask='Battle in '+quest.target+' Raid.'; }
        else if(quest.conditions[0].type == 6){ questTask = 'Battle in '+quest.target+' Raid(s).'; }
        else{ questTask='Win '+quest.target+' Level '+quest.conditions[0].info.raid_levels+' Raid(s).'; } break;

      // SEND GIFTS TO FRIENDS
      case quest.template.indexOf('gifts')>=0:
        questTask = 'Send '+quest.target+' Gift(s).'; break;

      // GYM BATTLING
      case quest.template.indexOf('gym')>=0:
        if(quest.target>1){ questTask = 'Battle '+quest.target+' Times in a Gym.'; }
        else{ questTask = 'Battle '+quest.target+' Time in a Gym.'; } break;

      // BERRY GYM POKEMON
      case quest.template.indexOf('berry')>=0:
        questTask = 'Berry Pokémon '+quest.target+' Time(s) in a Gym.'; break;

      // HATCH EGGS
      case quest.template.indexOf('hatch')>=0:
        if(quest.target>1){ questTask='Hatch '+quest.target+' Eggs.'; }
        else{ questTask = 'Hatch '+quest.target+' Egg.'; } break;

      // SPIN POKESTOPS
      case quest.template.indexOf('spin')>=0:
        questTask = 'Spin '+quest.target+' Pokéstops.'; break;

      // EVOLVE POKEMON
      case quest.template.indexOf('evolve')>=0:
        questTask = 'Evolve '+quest.target+' Pokémon.'; break;

      // BUDDY TASKS
      case quest.template.indexOf('buddy')>=0:
        questTask = 'Get '+quest.target+' Buddy Walking Candy.'; break;

      // POWER UP POKEMON
      case quest.template.indexOf('powerup')>=0:
        questTask = 'Power Up '+quest.target+' Pokémon.'; break;

      // TRADE POKEMON
      case quest.template.indexOf('trade')>=0:
        questTask = 'Perform '+quest.target+' Trade(s) with a Friend.'; break;

      // TRANSFER POKEMON
      case quest.template.indexOf('transfer')>=0:
        questTask = 'Transfer '+quest.target+' Pokémon.'; break;

      // USE SPECIFIC CHARGE MOVES
      case quest.template.indexOf('charge')>=0:
        if(quest.target > 1){ questTask='Use a Super Effective Charge Move '+quest.target+' Times.'; }
        else{ questTask = 'Use a Super Effective Charge Move '+quest.target+' Time.'; } break;
      default: return console.error('NO CASE FOR THIS QUEST ('+quest.pokestop_id+')', quest);
    }

    // GET EMBED COLOR BASED ON QUEST DIFFICULTY
    switch(true){
      case quest.template.indexOf('easy') >= 0: embedColor='00ff00'; break;
      case quest.template.indexOf('moderate') >= 0: embedColor='ffff00'; break;
      case quest.template.indexOf('hard') >= 0: embedColor='ff0000'; break;
      default: embedColor='00ccff';
    }

    // CREATE RICH EMBED
    if(!questUrl){ questUrl = quest.url; }
    let questEmbed = new Discord.RichEmbed().setColor(embedColor).setThumbnail(questUrl)
      .addField( questReward+'  |  '+questArea.name, questTask, false)
      .addField('Pokéstop:', quest.pokestop_name, false)
      .addField('Directions:','[Google Maps](https://www.google.com/maps?q='+quest.latitude+','+quest.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+quest.latitude+','+quest.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+quest.latitude+','+quest.longitude+'&navigate=yes)')
      .attachFile(attachment)
      .setImage('attachment://maptile.jpg')
      .setFooter('Expires: '+expireTime);

    // SEND THE EMBED
    if(MAIN.qConfig.Discord_Feeds == 'ENABLED'){

      // DEBUG LOG
      if(MAIN.debug.Quests == 'ENABLED'){ console.info('[DEBUG] [quests.js] Quest Sent To Filters. '+quest.pokestop_id); }

      // CHECK EACH FILTER
      MAIN.feeds.forEach((feed,index) => {

        // INITIAL FILTERING FOR CITY AND FILTER TYPE
        if(MAIN.config.Cities.length == 1 || city.name == feed.City){
          if(feed.Type == 'quest'){

            // DEBUG LOG
            if(MAIN.debug.Quests == 'ENABLED'){ console.info('[DEBUG] [quests.js] Quest PASSED Initial Filters. '+quest.pokestop_id); }

            // SECONDARY FILTERING BASED ON FILTER CONFIG
            if(feed.Rewards.toString().indexOf(simpleReward) >= 0 || feed.Rewards.toString().indexOf(questReward) >= 0){

              // LOGGING
              if(MAIN.debug.Quests == 'ENABLED'){ console.info('[DEBUG] [quests.js] Quest PASSED Secondary Filters and Sent to Discord. '+quest.pokestop_id); }
              else if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Sent a '+simpleReward+' Quest for '+city.name+'.'); }

              // SEND TO DISCORD
              MAIN.Send_Embed(questEmbed, feed.Channel_ID);
            }
            else{
              if(MAIN.debug.Quests == 'ENABLED'){ console.info('[DEBUG] [quests.js] Quest Ignored and Did Not Pass Filters. '+quest.pokestop_id); }
            }
          }
        }
      });
    }
    else{ console.info('[Pokébot] Quest ignored due to Disabled Discord setting.'); }

    // SEND TO SUBSCRIPTIONS FUNCTION
    if(MAIN.qConfig.Subscriptions == 'ENABLED'){
      let quest_subs = MAIN.modules.get('subscriptions.js');
      if(quest_subs){ quest_subs.run(MAIN, 'quest', quest, questEmbed, questArea, city); }
    }
    else{ console.info('[Pokébot] Quest ignored due to Disabled Subscription setting.'); }

    // END
    return;
  });
}
