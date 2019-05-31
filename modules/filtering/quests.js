delete require.cache[require.resolve('../embeds/quests.js')];
const Send_Quest = require('../embeds/quests.js');
const Discord = require('discord.js');

module.exports.run = async (MAIN, quest, main_area, sub_area, embed_area, server, timezone, role_id) => {

  // DETERMINE THE QUEST REWARD
  let  quest_reward = '', simple_reward = '', form_name = '';
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
      quest_reward = MAIN.masterfile.pokemon[quest.rewards[0].info.pokemon_id].name+form_name+' Encounter'; break;
      if(quest.rewards[0].info.shiny == true){
        simple_reward = 'Shiny '+simple_reward;
        quest_reward = 'Shiny '+quest_reward;
      }
  }

  if(MAIN.debug.Quests == 'ENABLED'){ console.info('[DEBUG] [quests.js] Received '+quest_reward+' Quest for '+server.name+'.'); }

  // CHECK ALL FILTERS
  MAIN.Quest_Channels.forEach((quest_channel,index) => {

    // DEFINE MORE VARIABLES
    let geofences = quest_channel[1].geofences.split(',');
    let channel = MAIN.channels.get(quest_channel[0]);
    let filter = MAIN.Filters.get(quest_channel[1].filter);
    let role_id = '', embed = 'quests.js';

    if (quest_channel[1].roleid) {
      if (quest_channel[1].roleid == 'here' || quest_channel[1].roleid == 'everyone'){
        role_id = '@'+quest_channel[1].roleid;
      } else {
        role_id = '<@&'+quest_channel[1].roleid+'>';
      }
    }

    if (quest_channel[1].embed) { embed = quest_channel[1].embed; }

    // THROW ERRORS FOR INVALID DATA
    if(!filter){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] The filter defined for'+quest_channel[0]+' does not appear to exist.'); }
    if(!channel){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] The channel '+quest_channel[0]+' does not appear to exist.'); }

    // ONLY LOOK AT QUEST FILTERS
    if(filter.Type == 'quest'){

      // AREA FILTER
      if(geofences.indexOf(server.name)>=0 || geofences.indexOf(main_area)>=0 || geofences.indexOf(sub_area)>=0){

          if(filter.Rewards.indexOf(quest_reward) >= 0 || filter.Rewards.indexOf(simple_reward) >= 0){

            // PREPARE AND SEND TO DISCORDS
            Send_Quest.run(MAIN, quest, channel, quest_reward, simple_reward, main_area, sub_area, embed_area, server, timezone, role_id, embed);
          }
          else{ // DEBUG
            if(MAIN.debug.Quests == 'ENABLED'){ console.info('[DEBUG] [quests.js] '+quest_reward+' Quest did not pass the Reward Filter. '+channel.guild.name+'|'+quest_channel[1].filter);
          }
        }
      }
      else{ // DEBUG
        if(MAIN.debug.Quests == 'ENABLED'){ console.info('[DEBUG] [quests.js] '+quest_reward+' Quest did not pass the Area Filter. '+quest_reward+'|'+quest_channel[1].filter); }
      }
    }
  }); return;
}
