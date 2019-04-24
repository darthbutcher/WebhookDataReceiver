module.exports.run = async (MAIN, message) => {

  // DEFINE VARIABLES
  let prefix = MAIN.config.PREFIX;

  // CHECK IF THE MESSAGE IS FROM A BOT
  if(message.author.bot == true){ return; }

  // if(message.channel.type == 'dm'){
  //
  //   MAIN.pdb.query("SELECT * FROM users WHERE user_id = ? && discord_id = ?", [message.member.id, message.guild.id], async function (error, user, fields) {
  //     // CHECK IF THE USER HAS AN EXISTING RECORD IN THE USER TABLE
  //     if(!user || !user[0]){
  //       return message.reply('Before you can create and modify subscriptions via DM, you must first use the subsciption channel in your scanner discord.');
  //     }
  //     else{
  //
  //       // // FETCH THE GUILD MEMBER AND CHECK IF A DONOR
  //       // let member = MAIN.guilds.get(user.discord_id).members.get(message.member.id);
  //       // if(member.hasPermission('ADMINISTRATOR')){ /* DO NOTHING */ }
  //       // else if(server.donor_role && !member.roles.has(server.donor_role)){ return; }
  //
  //       let command = '';
  //       switch(true){
  //         case prefix+'pause': command = 'pause'; break;
  //         case prefix+'resume': command = 'resume'; break;
  //         case prefix+'h':
  //         case prefix+'help': command = 'help'; break;
  //         case prefix+'p':
  //         case prefix+'pokemon': command = 'pokemon'; break;
  //         case prefix+'r':
  //         case prefix+'raid': command = 'raid'; break;
  //         case prefix+'q':
  //         case prefix+'quest': command = 'quest'; break;
  //         case 'restart':
  //           if(message.member.hasPermission('ADMINISTRATOR')){ process.exit(1).catch(console.error); } break;
  //         case 'reload':
  //           MAIN.start('reload'); break;
  //         default: command = message.content.slice(prefix.length);
  //       }
  //
  //       // SEND TO THE COMMAND FUNCTION
  //       let cmd = MAIN.Commands.get(command);
  //       if(cmd){ return cmd.run(MAIN, message, prefix, server); }
  //     }
  //   }); return;
  // }
  // else{
    // CHECK EACH DISCORD FOR THE SUB CHANNEL
    MAIN.Discord.Servers.forEach( async (server,index) => {
      if(server.command_channels.indexOf(message.channel.id) >= 0){

        // DELETE THE MESSAGE
        if(MAIN.config.Tidy_Channel == 'ENABLED'){ message.delete(); }

        // // FETCH THE GUILD MEMBER AND CHECK IF A DONOR
        // let member = MAIN.guilds.get(server.id).members.get(message.member.id);
        // if(member.hasPermission('ADMINISTRATOR')){ /* DO NOTHING */ }
        // else if(server.donor_role && !member.roles.has(server.donor_role)){ return; }

        // LOAD DATABASE RECORD
        MAIN.pdb.query('SELECT * FROM users WHERE user_id = ? AND discord_id = ?', [message.member.id, server.id], async function (error, user, fields) {

          // CHECK IF THE USER HAS AN EXISTING RECORD IN THE USER TABLE
          if(!user || !user[0]){ await MAIN.Save_Sub(message,server); }

          // DO NOT ALLOW MULTIPLE DISCORD SUBSCRIPTIONS
          if(user[0] && user[0].discord_id != message.guild.id && message.member.id != '329584924573040645'){ return; }

          // FIND THE COMMAND AND SEND TO THE MODULE
          let command = '';
          switch(message.content){
            case 'reload': if(message.member.hasPermission('ADMINISTRATOR')){ MAIN.start('reload'); } break;
            case 'purge': if(message.member.hasPermission('ADMINISTRATOR')){ MAIN.Purge_Channels(); } break;
            case 'restart': if(message.member.hasPermission('ADMINISTRATOR')){ MAIN.restart(); } break;
            case prefix+'pause': command = 'pause'; break;
            case prefix+'resume': command = 'resume'; break;
            case prefix+'help': command = 'help'; break;
            case prefix+'p':
            case prefix+'pokemon': command = 'pokemon'; break;
            case prefix+'r':
            case prefix+'raid': command = 'raid'; break;
            case prefix+'q':
            case prefix+'quest': command = 'quest'; break;
            default: if(message.content.startsWith(prefix)){ command = message.content.slice(prefix.length); }
          }

          // SEND TO THE COMMAND FUNCTION
          let cmd = MAIN.Commands.get(command);
          if(cmd){ return cmd.run(MAIN, message, prefix, server); }
        });
      }
    }); return;
  // } return;
}
