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
  let prefix=MAIN.config.PREFIX, args=message.content.toLowerCase().split(' ').slice(1);

  // CHECK IF THE MESSAGE IS FROM A BOT
  if(message.author.bot==true){ return; }

  // CHECK EACH CITY FOR THE SUB CHANNEL
  MAIN.config.Cities.forEach((city,index) => {
    if(message.channel.id!=city.sub_channel){ return; }
    else{

      // DELETE THE MESSAGE
      message.delete();

      // SEE IF THE MESSAGE BEGINS WITH THE COMMAND PREFIX
      if(!message.content.startsWith(prefix)){
        return message.reply('All commands in this channel must start with `'+prefix+'`. Type `'+prefix+'help` for assistance.')
          .then(m => m.delete(60000))
          .catch(console.error);
      }
      else{

        // LOAD DATABASE RECORD
        MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ?", [message.member.id], function (error, user, fields) {

          // CHECK IF THE USER HAS AN EXISTING RECORD IN THE USER TABLE
          if(!user || !user[0]){ MAIN.Save_Sub(message,city.name); }
          else if(user[0].city!=city.name){

            // DO NOT ALLOW SUBSCRIPTIONS IN TWO CITIES (SPOOFERS)
            return message.reply('You are not able to have subscriptions in two cities. Contact an admin to explain yourself.')
              .then(m => m.delete(120000))
              .catch(console.error);
          }
          else{

            // FIND THE COMMAND AND SEND TO THE MODULE
            let command=message.content.toLowerCase().split(' ')[0].slice(prefix.length);
            let cmd=MAIN.commands.get(command);
            if(cmd){ return cmd.run(BOT, message, config); }
          }
        });
      } return;
    }
  });
}
