const Discord = require('discord.js');
const moment = require('moment');

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

module.exports.run = async (MAIN, quest, quest_embed, main_area, sub_area, embed_area, server, locale) => {

  // DEBUG ACK
  if(MAIN.debug.Subscriptions=='ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [quests.js] [QUEST] Received '+quest_reward+' Quest.'); }

  // FETCH ALL USERS FROM THE USERS TABLE AND CHECK SUBSCRIPTIONS
  MAIN.database.query("SELECT * FROM pokebot.users WHERE discord_id = ?", [server.id], function (error, users, fields){
    if(users[0]){
      users.forEach((user,index) => {

        // FETCH THE GUILD MEMBER AND CHECK IF A ADMINISTRATOR/DONOR
        // let member = MAIN.guilds.get(server.id).members.get(user.user_id);
        // if(!member){ proceed = false; }
        // else if(member.hasPermission('ADMINISTRATOR')){ proceed = true; }
        // else if(server.donor_role && !member.roles.has(server.donor_role)){ proceed = false; }

        // DEFINE VARIABLES
        let user_areas=user.geofence.split(',');

        // LEVEL 1 FILTERS
        // CHECK IF THE USERS SUBS ARE PAUSED, EXIST, AND THAT THE AREA MATCHES THEIR DISCORD
        if(user.status == 'ACTIVE' && user.quests){

          // LEVEL 2 FILTERS
          // CHECK IF THE AREA IS WITHIN THE USER'S GEOFENCES
          if(user.geofence == server.geofence || user_areas.indexOf(main_area) >= 0 || user_areas.indexOf(sub_area) >= 0){

            // CONVERT REWARD LIST TO AN ARRAY
            let subs = user.quests.split(',');

            // USER FILTER
            // CHECK IF THE REWARD IS ONE THEY ARE SUBSCRIBED TO
            if(subs.indexOf(quest_reward) >= 0 || subs.indexOf(simple_reward) >= 0){

              // DEFINE VARIABLES
              let quest_object = JSON.stringify(quest), quest_embed = JSON.stringify(quest_embed);

              // CHECK THE TIME VERSUS THE USERS SET SUBSCRIPTION TIME
              let time_now = new Date().getTime(); let todays_date = moment(time_now).format('MM/DD/YYYY');
              let db_date = moment(todays_date+' '+user.alert_time, 'MM/DD/YYYY H:mm').valueOf()

              // SEND THE QUEST ALERT TO THE USER
              if(db_date < time_now){
                if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Subscriptions] Sent a '+quest_reward+' Quest DM to '+user.user_name+'.'); }
                MAIN.Send_DM(server.id, user.user_id, quest_embed, user.bot);
              }
              else{

                // SAVE THE ALERT TO THE ALERT TABLE FOR FUTURE DELIVERY
                MAIN.database.query(`INSERT INTO pokebot.quest_alerts (user_id, user_name, quest, embed, area, bot, alert_time, discord_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                  [user.user_id, user.user_name, quest_object, quest_embed, area.name, user.bot, db_date, discord.id], function (error, alert, fields) {
                    if(error){ console.error('[Pokébot] UNABLE TO ADD ALERT TO pokebot.quest_alerts',error); }
                    else if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Subscriptions] Stored a '+quest_reward+' Quest Alert for '+user.user_name+'.'); }
                });
              }
            }
            else{
              // DEBUG
              if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [quests.js] [QUEST] '+quest_reward+' Did Not Pass '+user.user_name+'\'s Reward Filters.'); }
            }
          }
          else{
            // DEBUG
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG-SUBSCRIPTIONS] [quests.js] [QUEST] '+quest_reward+' Did Not Pass '+user.user_name+'\'s Area Filters.'); }
          }
        }
      });
    }
  });
}
