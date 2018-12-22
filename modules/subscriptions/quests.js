const Discord=require('discord.js');
const moment=require('moment');

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

module.exports.run = async (MAIN, quest, embed, area, city) => {

  // DETERMINE THE QUEST REWARD
  let simpleReward='', questReward='';
  switch(quest.rewards[0].type){

    // PLACEHOLDER
    case 1:

    // ITEM REWARDS (EXCEPT STARDUST)
    case 2:
      simpleReward=MAIN.proto.values['item_'+quest.rewards[0].info.item_id];
      questReward=quest.rewards[0].info.amount+' '+MAIN.proto.values['item_'+quest.rewards[0].info.item_id]; break;

    // STARDUST REWARD
    case 3:
      questReward = quest.rewards[0].info.amount+' Stardust'; break;

    // PLACEHOLDER
    case 4:

    // PLACEHOLDER
    case 5:

    // PLACEHOLDER
    case 6:

    // ENCOUNTER REWARDS
    case 7:
      simpleReward = MAIN.pokemon[quest.rewards[0].info.pokemon_id].name;
      questReward = MAIN.pokemon[quest.rewards[0].info.pokemon_id].name+' Encounter'; break;
  }

  if(MAIN.debug.Subscriptions=='ENABLED'){ console.info('[DEBUG] [subscriptions.js] [QUEST] Received '+questReward+' Quest.'); }

  // FETCH ALL USERS FROM THE USERS TABLE AND CHECK SUBSCRIPTIONS
  MAIN.database.query("SELECT * FROM pokebot.users", function (error, users, fields){
    if(users[0]){
      users.forEach((user,index) => {

        // FETCH THE GUILD MEMBER AND CHECK IF A ADMINISTRATOR/DONOR
        let member = MAIN.guilds.get(city.discord_id).members.get(user.user_id);
        if(!member){ proceed = false; }
        else if(member.hasPermission('ADMINISTRATOR')){ proceed = true; }
        else if(city.donor_role && !member.roles.has(city.donor_role)){ proceed = false; }

        // DEFINE VARIABLES
        let user_areas=user.geofence.split(',');

        // LEVEL 1 FILTERS
        // CHECK IF THE USERS SUBS ARE PAUSED, EXIST, AND THAT THE AREA MATCHES THEIR CITY
        if(proceed = true && user.status == 'ACTIVE' && user.quests && city.name == user.city){

          // LEVEL 2 FILTERS
          // CHECK IF THE AREA IS WITHIN THE USER'S GEOFENCES
          if(user.geofence == 'ALL' || user_areas.indexOf(area.name) >= 0){

            // CONVERT REWARD LIST TO AN ARRAY
            let subs = user.quests.split(',');

            // USER FILTER
            // CHECK IF THE REWARD IS ONE THEY ARE SUBSCRIBED TO
            if(subs.indexOf(questReward) >= 0 || subs.indexOf(simpleReward) >= 0){

              // DEFINE VARIABLES
              let quest_object = JSON.stringify(quest), quest_embed = JSON.stringify(embed);

              // CHECK THE TIME VERSUS THE USERS SET SUBSCRIPTION TIME
              let timeNow = new Date().getTime(); let todaysDate = moment(timeNow).format('MM/DD/YYYY');
              let dbDate = moment(todaysDate+' '+user.alert_time, 'MM/DD/YYYY H:mm').valueOf()

              // SEND THE QUEST ALERT TO THE USER
              if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Subscriptions] Sent a '+questReward+' Quest DM to '+user.user_name+'.'); }
              if(dbDate < timeNow){ MAIN.Send_DM(city.discord_id, user.user_id, embed, user.bot); }
              else{

                // SAVE THE ALERT TO THE ALERT TABLE FOR FUTURE DELIVERY
                MAIN.database.query(`INSERT INTO pokebot.quest_alerts (user_id, user_name, quest, embed, area, bot, alert_time, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                  [user.user_id, user.user_name, quest_object, quest_embed, area.name, user.bot, dbDate, city.name], function (error, user, fields) {
                    if(error){ console.error('[Pokébot] UNABLE TO ADD ALERT TO pokebot.quest_alerts',error); }
                    else if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Subscriptions] Stored a '+questReward+' Quest Alert for '+user.user_name+'.'); }
                });
              }
            }
            else{ if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG] [subscriptions.js] [QUEST] Did Not Pass User Filters.'); } }
          }
        }
      });
    }
  });
}
