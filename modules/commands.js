const Discord = require('discord.js');
const moment = require('moment');
const fs = require('fs');

const modules = new Discord.Collection();
fs.readdir('./modules/commands', (err,files) => {
  let commandFiles = files.filter(f => f.split('.').pop()==='js');
  commandFiles.forEach((f,i) => {
    let command = require('./commands/'+f); modules.set(f.slice(0,-3), command);
  });
});

//#############################################################//
//#############################################################//
//    _____ ____  __  __ __  __          _   _ _____   _____   //
//   / ____/ __ \|  \/  |  \/  |   /\   | \ | |  __ \ / ____|  //
//  | |   | |  | | \  / | \  / |  /  \  |  \| | |  | | (___    //
//  | |   | |  | | |\/| | |\/| | / /\ \ | . ` | |  | |\___ \   //
//  | |___| |__| | |  | | |  | |/ ____ \| |\  | |__| |____) |  //
//   \_____\____/|_|  |_|_|  |_/_/    \_\_| \_|_____/|_____/   //
//       SUBSCRIPTIONS AND BOT ADMINISTRATION COMMANDS         //
//#############################################################//
//#############################################################//

module.exports.run = async (MAIN, message) => {

  // DEFINE VARIABLES
  let prefix = MAIN.config.PREFIX;
  let args = message.content.toLowerCase().split(' ').slice(1);

  // CHECK IF THE MESSAGE IS FROM A BOT
  if(message.author.bot == true){ return; }

  // CHECK EACH CITY FOR THE SUB CHANNEL
  MAIN.config.Cities.forEach((city,index) => {
    if(message.channel.id == city.sub_channel){

      // DELETE THE MESSAGE
      //message.delete();

      // FETCH THE GUILD MEMBER AND CHECK IF A DONOR
      let member = MAIN.guilds.get(city.discord_id).members.get(message.member.id);
      if(member.hasPermission('ADMINISTRATOR')){ /* DO NOTHING */ }
      else if(city.donor_role && !member.roles.has(city.donor_role)){ return; }

      // LOAD DATABASE RECORD
      MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ?", [message.member.id], function (error, user, fields) {

        // CHECK IF THE USER HAS AN EXISTING RECORD IN THE USER TABLE
        if(!user || !user[0]){ MAIN.Save_Sub(message,city.name); }
        else if(user[0].city != city.name){

          // DO NOT ALLOW SUBSCRIPTIONS IN TWO CITIES (SPOOFERS)
          return message.reply('You are not able to have subscriptions in two cities. Contact an admin to explain yourself.')
            .then(m => m.delete(120000))
            .catch(console.error);
        }
        else{

          // FIND THE COMMAND AND SEND TO THE MODULE
          let command = message.content.toLowerCase().split(' ')[0].slice(MAIN.config.PREFIX.length);
          let cmd = modules.get(command);
          if(cmd){ return cmd.run(MAIN, message, args, prefix, city); }
        }
      }); return;
    }
  });
}
