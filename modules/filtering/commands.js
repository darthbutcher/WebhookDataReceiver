const Discord = require('discord.js');

module.exports.run = async (MAIN, message) => {

  // DEFINE VARIABLES
  let prefix = MAIN.config.PREFIX, command = '';

  // CHECK IF THE MESSAGE IS FROM A BOT
  if(message.author.bot == true){ return; }

  if(message.channel.type == 'dm'){

    // MAIN.pdb.query("SELECT * FROM users WHERE user_id = ? && discord_id = ?", [message.author.id, message.guild.id], async function (error, user, fields) {
    //   // CHECK IF THE USER HAS AN EXISTING RECORD IN THE USER TABLE
    //   if(!user || !user[0]){
    //     return message.reply('Before you can create and modify subscriptions via DM, you must first use the subsciption channel in your scanner discord.');
    //   }
    //   else{
    //
    //     // // FETCH THE GUILD MEMBER AND CHECK IF A DONOR
    //     let member = MAIN.guilds.get(user.discord_id).members.get(message.author.id);
    //     if(member.hasPermission('ADMINISTRATOR')){ /* DO NOTHING */ }
    //     else if(server.donor_role && !member.roles.has(server.donor_role)){ return; }
    //
    //     let command = '';
    //     switch(true){
    //       case prefix+'pause': command = 'pause'; break;
    //       case prefix+'resume': command = 'resume'; break;
    //       case prefix+'h':
    //       case prefix+'help': command = 'help'; break;
    //       case prefix+'p':
    //       case prefix+'pokemon': command = 'pokemon'; break;
    //       case prefix+'r':
    //       case prefix+'raid': command = 'raid'; break;
    //       case prefix+'q':
    //       case prefix+'quest': command = 'quest'; break;
    //       case 'restart':
    //         if(message.member.hasPermission('ADMINISTRATOR')){ process.exit(1).catch(console.error); } break;
    //       case 'reload':
    //         MAIN.start('reload'); break;
    //       default: command = message.content.slice(prefix.length);
    //     }
    //
    //     // SEND TO THE COMMAND FUNCTION
    //     let cmd = MAIN.Commands.get(command);
    //     if(cmd){ return cmd.run(MAIN, message, prefix, server); }
    //   }
    // });
    return;
  }
  else{
    // CHECK EACH DISCORD FOR THE SUB CHANNEL
    MAIN.Discord.Servers.forEach( async (server,index) => {
      // CHECK FOR SERVER COMMAND CHANNEL, ONLY RESPOND TO COMMANDS IN THAT CHANNEL
      if(server.command_channels.indexOf(message.channel.id) >= 0){
        // DELETE THE MESSAGE
        if(MAIN.config.Tidy_Channel == 'ENABLED'){ message.delete(); }

        // FETCH THE GUILD MEMBER AND CHECK IF A DONOR
        let member = MAIN.guilds.get(server.id).members.get(message.author.id);
        if(member.hasPermission('ADMINISTRATOR')){ /* DO NOTHING */ }
        else if(server.donor_role && !member.roles.has(server.donor_role)){ return; }

        // LOAD DATABASE RECORD
        MAIN.pdb.query('SELECT * FROM users WHERE user_id = ? AND discord_id = ?', [message.author.id, server.id], async function (error, user, fields) {

          // CHECK IF THE USER HAS AN EXISTING RECORD IN THE USER TABLE
          if(!user || !user[0]){ await MAIN.Save_Sub(message,server); }

          // DO NOT ALLOW MULTIPLE DISCORD SUBSCRIPTIONS
          if(user[0] && user[0].discord_id != message.guild.id && message.author.id != '329584924573040645'){ return; }

          // FIND THE COMMAND AND SEND TO THE MODULE
          switch(message.content.toLowerCase()){
            case 'reload': if(message.member.hasPermission('ADMINISTRATOR')){ MAIN.start('reload'); } break;
            case 'purge': if(message.member.hasPermission('ADMINISTRATOR')){ MAIN.Purge_Channels(); } break;
            case 'restart': if(message.member.hasPermission('ADMINISTRATOR')){ MAIN.restart(); } break;
            case prefix+'pause': command = 'pause'; break;
            case prefix+'resume': command = 'resume'; break;
            case 'help': command = 'help'; break;
            case 'p':
            case prefix+'p':
            case 'pokemon': command = 'pokemon'; break;
            case 'r':
            case prefix+'r':
            case 'raid': command = 'raid'; break;
            case 'q':
            case prefix+'q':
            case 'quest': command = 'quest'; break;
            case 'n':
            case prefix+'n':
            case 'nest': command = 'nest'; break;
            case 's':
            case prefix+'s':
            case 'pokemonstats':
            case 'pokemon stats':
            case 'stats': command = 'stats'; break;
            case 'a':
            case prefix+'a':
            case 'area': command = 'area'; break;
            case 'd':
            case prefix+'d':
            case 'dex': command = 'dex'; break;
            case 'cp': command = 'cp'; break;
            case 'raidcp':
            case 'catchcp': command = 'raidcp'; break;
            case 'weathercp':
            case 'boostedcp': command = 'weathercp'; break;
            case 'questcp': command = 'questcp'; break;
            default: if(message.content.startsWith(prefix)){ command = message.content.slice(prefix.length); }
          }

          // SEND TO THE COMMAND FUNCTION
          let cmd = MAIN.Commands.get(command);
          if(cmd){ return cmd.run(MAIN, message, prefix, server); }
        });
      }
    });
    if (MAIN.config.Raid_Lobbies == 'ENABLED') {
      // CHECK FOR ACTIVE RAID CHANNELS FOR RAID COMMANDS
      MAIN.pdb.query(`SELECT * FROM active_raids WHERE active = ?`, ['true'], function (error, raids, fields) {
        if(error){ console.error(error);}
        raids.forEach( function(raids) {
          if(message.channel.id == raids.raid_channel){
            switch (message.content.toLowerCase()) {
              // USER HAS ARRIVED AT THE RAID
              case 'i\’m here':
              case 'i\'m here':
              case 'here': command = 'here'; break;
              // USER IS INTERESTED
              case 'interested': command = 'interested'; break;
              // USER HAS INDICATED THEY'RE ON THE WAY
              case 'coming':
              case 'on the way':
              case 'on my way!':
              case 'omw': command = 'coming'; break;
              // USER IS NO LONGER INTERESTED AND LEFT THE RAID
              case 'leave':
              case 'not coming':
              case 'not interested': command = 'leave'; break;
              default: command = ''; break;
            }
            // SEND TO THE COMMAND FUNCTION
            let cmd = MAIN.Commands.get(command);
            if(cmd){ return cmd.run(MAIN, message, raids); }
          }
        });
        return;
      });
  }
  MAIN.Discord.Servers.forEach( async (server,index) => {
    if (server.id == message.guild.id && server.command_channels.indexOf(message.channel.id) <= 0){
    switch (message.content) {
      case prefix+'nest': command = 'nest'; break;
      case prefix+'pokemonstats':
      case prefix+'pokemon stats': command = 'stats'; break;
      case prefix+'dex': command = 'dex'; break;
      case prefix+'cp': command = 'cp'; break;
      case prefix+'raidcp':
      case prefix+'catchcp': command = 'raidcp'; break;
      case prefix+'weathercp':
      case prefix+'boostedcp': command = 'weathercp'; break;
      case prefix+'questcp': command = 'questcp'; break;
    }
    // SEND TO THE COMMAND FUNCTION
    let cmd = MAIN.Commands.get(command);
    if(cmd){ return cmd.run(MAIN, message, prefix, server); }
  }
  });
  return;
  }
  return; // FALL BACK RETURN
}
