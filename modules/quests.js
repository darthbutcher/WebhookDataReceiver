const Discord=require('discord.js');
const proto=require('../static/en.json');

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

module.exports.run = async (MAIN, quest) => {
  // DEBUG AND VARIABLES
  if(MAIN.debug.quests=='ENABLED'){ if(MAIN.debug.detailed=='ENABLED'){ console.info(quest); } else{ console.info(quest.pokestop_id); } }
  let questTask='', questReward='', questUrl='', channelID='', area='', expireTime=MAIN.Bot_Time(null,'quest');

  // GET THE GENERAL AREA
  let questArea=MAIN.Get_Area(quest.latitude,quest.longitude);

  // CHECK FOR EMPTY DATA
  if(!quest.pokestop_id){ return; }

  // DETERMINE THE QUEST REWARD AND CHANNEL
  switch(quest.rewards[0].type){
    case 1: questTask='NO REWARD SET'; break;
    case 2:
      channelID=MAIN.feed.CHANNELS.research.items;
      questReward=quest.rewards[0].info.amount+' '+proto.values['item_'+quest.rewards[0].info.item_id];
      if(quest.rewards[0].info.amount>1){
        if(questReward.indexOf('Berry')>=0){ questReward=questReward.toString().slice(0,-1)+'ies'; }
        else{ questReward=questReward+'s'; }
      } break;
    case 3: channelID=MAIN.feed.CHANNELS.research.items; questReward=quest.rewards[0].info.amount+' Stardust'; break;
    case 4: channelID=MAIN.feed.CHANNELS.research.items; return console.error('NO REWARD SET',quest);
    case 5: channelID=MAIN.feed.CHANNELS.research.items; return console.error('NO REWARD SET',quest);
    case 6: channelID=MAIN.feed.CHANNELS.research.items; return console.error('NO REWARD SET',quest);
    case 7: channelID=MAIN.feed.CHANNELS.research.encounters; questReward=MAIN.pokemon[quest.rewards[0].info.pokemon_id]+' Encounter'; break;
  }

  // DETERMINE THE QUEST TASK
  switch(true){
    case quest.template.indexOf('catch')>=0:
      if(quest.conditions && quest.conditions[0]){
        if(quest.conditions[0].info && quest.conditions[0].info.pokemon_type_ids){
          questTask='Catch '+quest.target+' '+proto.values['poke_type_'+quest.conditions[0].info.pokemon_type_ids[0]]+' Type Pokémon.';
        }
        else{ questTask='Catch '+quest.target+' '+proto.values['quest_condition_'+quest.conditions[0].type]+' Pokémon.'; }
      }
      else{ questTask='Catch '+quest.target+' Pokémon.'; } break;
    case quest.template.indexOf('great')>=0:
    case quest.template.indexOf('curveball')>=0:
    case quest.template.indexOf('excellent')>=0:
    case quest.template.indexOf('land')>=0:
      if(quest.conditions[1]){ questTask='Throw '+quest.target+' '+proto.values['quest_condition_'+quest.conditions[1].type]+'(s).'; }
      else if(quest.target>1){ questTask='Perform '+quest.target+' '+proto.values['throw_type_'+quest.conditions[0].info.throw_type_id]+' Throws in a Row.'; }
      else{ questTask='Perform '+quest.target+' '+proto.values['throw_type_'+quest.conditions[0].info.throw_type_id]+' Throw.'; } break;
    case quest.template.indexOf('raid')>=0:
      if(!quest.conditions[0]){ questTask='Battle in '+quest.target+' Raid.'; }
      else if(quest.conditions[0].type==6){ questTask='Battle in '+quest.target+' Raid(s).'; }
      else{ questTask='Win '+quest.target+' Level '+quest.conditions[0].info.raid_levels+' Raid(s).'; } break;
    case quest.template.indexOf('gifts')>=0:
      questTask='Send '+quest.target+' Gift(s).'; break;
    case quest.template.indexOf('gym')>=0:
      if(quest.target>1){ questTask='Battle '+quest.target+' Times in a Gym.'; }
      else{ questTask='Battle '+quest.target+' Time in a Gym.'; } break;
    case quest.template.indexOf('berry')>=0:
      questTask='Berry Pokémon '+quest.target+' Time(s) in a Gym.'; break;
    case quest.template.indexOf('hatch')>=0:
      if(quest.target>1){ questTask='Hatch '+quest.target+' Eggs.'; }
      else{ questTask='Hatch '+quest.target+' Egg.'; } break;
    case quest.template.indexOf('spin')>=0:
      questTask='Spin '+quest.target+' Pokéstops.'; break;
    case quest.template.indexOf('evolve')>=0:
      questTask='Evolve '+quest.target+' Pokémon.'; break;
    case quest.template.indexOf('buddy')>=0:
      questTask='Evolve '+quest.target+' Pokémon.'; break;
    case quest.template.indexOf('powerup')>=0:
      questTask='Power Up '+quest.target+' Pokémon.'; break;
    case quest.template.indexOf('trade')>=0:
      questTask='Perform '+quest.target+' Trade(s) with a Friend.'; break;
    case quest.template.indexOf('transfer')>=0:
      questTask='Transfer '+quest.target+' Pokémon.'; break;
    case quest.template.indexOf('charge')>=0:
      if(quest.target>1){ questTask='Use a Super Effective Charge Move '+quest.target+' Times.'; }
      else{ questTask='Use a Super Effective Charge Move '+quest.target+' Time.'; } break;
    default: return console.error('NO CASE FOR THIS QUEST ('+quest.pokestop_id+')', quest);
  }

  // GET REWARD ICON
  switch(true){
    case questReward.indexOf('Stardust')>=0: questUrl='https://i.imgur.com/WimkNLf.png'; break;
    case questReward.indexOf('Rare')>=0: questUrl='https://i.imgur.com/TnALZ7D.png'; break;
    case questReward.indexOf('Golden Razz')>=0: questUrl='https://i.imgur.com/VMK1l2M.png'; break;
    case questReward.indexOf('Razz')>=0: questUrl='https://i.imgur.com/uHpw0Vp.png'; break;
    case questReward.indexOf('Nanab')>=0: questUrl='https://i.imgur.com/lKlDhNV.png'; break;
    case questReward.indexOf('Silver Pinap')>=0: questUrl=''; break;
    case questReward.indexOf('Pinap')>=0: questUrl='https://i.imgur.com/QxqLk4v.png'; break;
    case questReward.indexOf('Ultra Ball')>=0: questUrl='https://i.imgur.com/7BQMix7.png'; break;
    case questReward.indexOf('Great Ball')>=0: questUrl='https://i.imgur.com/K5BVzrb.png'; break;
    case questReward.indexOf('Max Revive')>=0: questUrl='https://i.imgur.com/b0MVEZR.png'; break;
    case questReward.indexOf('Revive')>=0: questUrl='https://i.imgur.com/XrdRq32.png'; break;
    case questReward.indexOf('Max Potion')>=0: questUrl='https://i.imgur.com/42MWLXE.png'; break;
    case questReward.indexOf('Hyper Potion')>=0: questUrl='https://i.imgur.com/E4InpM5.png'; break;
    case questReward.indexOf('Super Potion')>=0: questUrl='https://i.imgur.com/G189hze.png'; break;
    case questReward.indexOf('Potion')>=0: questUrl='https://i.imgur.com/rkS66uc.png'; break;
    case questReward.indexOf('TM')>=0: questUrl='https://i.imgur.com/S38qdja.png'; break;
    case questReward.indexOf('XP')>=0: questUrl='https://i.imgur.com/lYmKyMG.jpg'; break;
    case questReward.indexOf('Poke Ball')>=0: questUrl='https://i.imgur.com/arNZ21Y.png'; break;
    case questReward.indexOf('Encounter')>=0: questUrl=MAIN.Get_Sprite(quest.rewards[0].info.form_id, quest.rewards[0].info.pokemon_id); break;
    default: questUrl=quest.pokestop_url;
  }

  // GET EMBED COLOR BASED ON QUEST DIFFICULTY
  switch(true){
    case quest.template.indexOf('easy')>=0: break;
    case quest.template.indexOf('moderate')>=0: break;
    case quest.template.indexOf('hard')>=0: break;
  }

  // CREATE RICH EMBED
  let questEmbed=new Discord.RichEmbed().setColor('00ccff').setThumbnail(questUrl)
    .addField( questReward+'  |  '+questArea.name, questTask, false)
    .addField('Pokéstop:', quest.pokestop_name, false)
    .addField('Directions:','[Google Maps](https://www.google.com/maps?q='+quest.latitude+','+quest.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+quest.latitude+','+quest.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+quest.latitude+','+quest.longitude+'&navigate=yes)')
    .setImage('https://maps.googleapis.com/maps/api/staticmap?center='+quest.latitude+','+quest.longitude+'&markers='+quest.latitude+','+quest.longitude+'&size=450x220&zoom=16')
    .setFooter('Expires: '+expireTime);

  // LOG AND MORE DETAILED DEBUG
  if(MAIN.logging=='ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Sent a Quest.'); }
  if(MAIN.debug.quests=='ENABLED' && MAIN.debug.detailed=='ENABLED'){
    console.info('Task: '+questTask);
    console.info('Reward: '+questReward);
  }

  // SEND THE EMBED
  if(MAIN.qConfig.Discord_Feeds=='ENABLED'){ MAIN.Send_Embed(questEmbed, channelID); }

  // SEND TO SUBSCRIPTIONS FUNCTION
  if(MAIN.qConfig.Subscriptions=='ENABLED'){
    let quest_subs=MAIN.modules.get('subscriptions.js');
    if(quest_subs){ quest_subs.run(MAIN, 'quest', quest, questEmbed, questArea); }
  }

  // END
  return;
}
