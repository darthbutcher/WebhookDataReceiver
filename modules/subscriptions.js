const Discord=require('discord.js');
const proto=require('../static/en.json');
const moment=require('moment');
const config=require('../config/pokebot_config.json');

//###########################################################################################//
//###########################################################################################//
//    _____ _    _ ____   _____  _____ _____  _____ _____ _______ _____ ____  _   _  _____   //
//   / ____| |  | |  _ \ / ____|/ ____|  __ \|_   _|  __ \__   __|_   _/ __ \| \ | |/ ____|  //
//  | (___ | |  | | |_) | (___ | |    | |__) | | | | |__) | | |    | || |  | |  \| | (___    //
//   \___ \| |  | |  _ < \___ \| |    |  _  /  | | |  ___/  | |    | || |  | | . ` |\___ \   //
//   ____) | |__| | |_) |____) | |____| | \ \ _| |_| |      | |   _| || |__| | |\  |____) |  //
//  |_____/ \____/|____/|_____/ \_____|_|  \_\_____|_|      |_|  |_____\____/|_| \_|_____/   //
//                       FUCK ME, THIS SHIT IS ANNOYING AS FUCK                              //
//###########################################################################################//
//###########################################################################################//

var subChannels=[];
config.Cities.forEach((channel,index) => {
  subChannels.push(config.Cities[index].sub_channel);
});

module.exports.run = async (MAIN, type, object, embed, area, city) => {
  let subs='', alertedUsers=[], alert='';
  switch(type){
    // case 'raid':
    //   if(object.pokemon_id==0){ return; }
    //   MAIN.database.query("SELECT * FROM pokebot."+area.db_table_name, function (error, subscriptions, fields) {
    //     if(subscriptions[0]){
    //       subscriptions.forEach((user,index) => {
    //         MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ?", [user.user_id], function (error, user, fields) {
    //           if(user[0]){
    //             if(user[0].paused!='YES' && user[0].raids){
    //               subs=JSON.parse(user[0].raids);
    //               // CHECK FOR SUBSCRIBED GYMS OR RAID BOSSES
    //               if(subs[object.gym_id] && alertedUsers.indexOf(subs.user_id<0)){
    //                 alertedUsers.push(subs.user_id);
    //                 send_Subscription(subs.user_id, embed);
    //               }
    //               else if(subs[object.pokemon_id] && alertedUsers.indexOf(subs.user_id<0)){
    //                 subs.user_id let expireTime=MAIN.Bot_Time(null,'quest');
    //                 alertedUsers.push(subs.user_id);
    //
    //               }
    //             }
    //           }
    //         });
    //       });
    //     }
    //   });
    case 'quest':
      MAIN.database.query("SELECT * FROM pokebot.users", function (error, users, fields){
        if(users[0]){
          users.forEach((user,index) => {

            // DEFINE VARIABLES
            let userAreas=user.geofence.split(','), userID=user.user_id;

            // CHEK IF THE USERS SUBS ARE PAUSED, EXIST, AND THAT THE AREA MATCHES THEIR CITY
            if(user.paused!='YES' && user.quests && city.name==user.city){

              // CHECK IF THE AREA IS WITHIN THE USER'S GEOFENCES
              if(user.geofence=='ALL' || userAreas.indexOf(area.name)>=0){

                let subs=user.quests.split(',');

                // CHECK FOR SUBSCRIBED GYMS OR RAID BOSSES
                switch(object.rewards[0].type){
                  case 1: break;
                  case 2: reward=proto.values['item_'+object.rewards[0].info.item_id]; break;
                  case 3: reward=object.rewards[0].info.amount+' Stardust'; break;
                  case 4: break;
                  case 5: break;
                  case 6: break;
                  case 7: reward=MAIN.pokemon[object.rewards[0].info.pokemon_id]+' Encounter'; break;
                }

                // CHECK IF THE REWARD IS ONE THEY ARE SUBSCRIBED TO
                if(subs.indexOf(reward)>=0){
                  let quest=JSON.stringify(object), questEmbed=JSON.stringify(embed);
                  let timeNow=new Date().getTime(); let todaysDate=moment(timeNow).format('MM/DD/YYYY');
                  let dbDate=moment(todaysDate+' '+user.alert_time, 'MM/DD/YYYY H:mm').valueOf()
                  if(dbDate<timeNow){ dbDate=dbDate+86400000; }
                  MAIN.database.query(`INSERT INTO pokebot.quest_alerts (user_id, user_name, quest, embed, area, bot, alert_time) VALUES (?, ?, ?, ?, ?, ?, ?)`, [user.user_id, user.user_name, quest, questEmbed, area.name, user.bot, dbDate], function (error, user, fields) {
                    if(error){ console.error('[Pokébot] UNABLE TO ADD ALERT TO pokebot.quest_alerts',error); }
                    else{ console.info('[Pokébot] Stored a '+reward+' Quest alert for '+userID+'.'); }
                  });
                }
              }
            }
          });
        }
      });
    // case 'pokemon':
    //   MAIN.database.query("SELECT * FROM pokebot.all", function (error, subscriptions, fields) {
    //     if(subscriptions[0]){
    //       subscriptions.forEach((data,index) => {
    //         if(data.raid){
    //           subs=JSON.parse(data.raid);
    //           // CHECK FOR G
    //           if(subs[raid.gym_id]){
    //
    //           }
    //           //if(subs[])
    //         }
    //       });
    //     }
    //   });
    default: return;
  }
}
