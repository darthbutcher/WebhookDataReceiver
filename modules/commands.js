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

module.exports.run = async (MAIN, message, locale) => {

  // DEFINE VARIABLES
  let prefix = MAIN.config.PREFIX;
  let args = message.content.toLowerCase().split(' ').slice(1);

  // CHECK IF THE MESSAGE IS FROM A BOT
  if(message.author.bot == true){ return; }

  // CHECK EACH DISCORD FOR THE SUB CHANNEL
  MAIN.Discord.Servers.forEach((server,index) => {
    if(message.channel.id == server.sub_channel){

      // DELETE THE MESSAGE
      message.delete();

      // // FETCH THE GUILD MEMBER AND CHECK IF A DONOR
      // let member = MAIN.guilds.get(messag).members.get(message.member.id);
      // if(member.hasPermission('ADMINISTRATOR')){ /* DO NOTHING */ }
      // else if(server.donor_role && !member.roles.has(server.donor_role)){ return; }

      // LOAD DATABASE RECORD
      MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ? AND discord_id = ?", [message.member.id, message.guild.id], function (error, user, fields) {

        // CHECK IF THE USER HAS AN EXISTING RECORD IN THE USER TABLE
        if(!user || !user[0]){ MAIN.Save_Sub(message,server); }
        else{

          // FIND THE COMMAND AND SEND TO THE MODULE
          let command = '';
          switch(true){
            case message.content == prefix+'pause': command = 'pause'; break;
            case message.content == prefix+'resume': command = 'resume'; break;
            case message.content == prefix+'help': command = 'help'; break;
            case message.content == prefix+'p':
            case message.content == prefix+'pokemon': command = 'pokemon'; break;
            case message.content == prefix+'r':
            case message.content == prefix+'raid': command = 'raid'; break;
            case message.content == prefix+'q':
            case message.content == prefix+'quest': command = 'quest'; break;
            case message.content == 'restart':
              if(message.member.hasPermission('ADMINISTRATOR')){ process.exit(1).catch(console.error); } break;
            default: command = message.content.slice(prefix.length);
          }

          let cmd = modules.get(command);
          if(cmd){ return cmd.run(MAIN, message, args, prefix, server); }
        }
      });
    }
  }); return;
}
