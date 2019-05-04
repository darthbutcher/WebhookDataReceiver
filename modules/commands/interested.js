const Discord=require('discord.js');

module.exports.run = async (MAIN, message, raids, count) => {
  // HANDLE CHANNEL COMMANDS
  try {
    member = message.author.id;
    member_count = 1;
  }
  // HANDLE EMOJI REACTIONS
  catch(e) {
    guild = MAIN.guilds.get(message.d.guild_id);
    member = message.d.user_id
  }
  channel = raids.raid_channel;
  // RESET LOBBY
  lobby_count = 0;
  lobby_users = '';
  present_users = 0;
  transit_users = 0;
  member_count = count;

  // INSERT USER IN LOBBY
  MAIN.pdb.query(`INSERT INTO lobby_members (gym_id, user_id, count) VALUES (?,?,?) ON DUPLICATE KEY UPDATE count = ?`, [raids.gym_id, member,member_count,member_count], function (error, lobby, fields) {
    if(error){ console.error(error); }
  });
  if (member_count == 0) { MAIN.pdb.query(`DELETE FROM lobby_members WHERE user_id = ?`, [member], function (error, lobby, fields) {
    if(error){ console.error(error); }
  }); }
  MAIN.pdb.query(`SELECT * FROM lobby_members WHERE gym_id = ?`, [raids.gym_id], function (error, lobby, fields) {
    if(error){ console.error(error);}
    // COUNT USERS IN DB
    lobby.forEach(function(lobby) {
      if (lobby.user_id == member) { member_count = lobby.count; }
      if (lobby.arrived == 'here') { present_users += lobby.count; }
      if (lobby.arrived == 'coming') { transit_users += lobby.count; }
      lobby_count += lobby.count;
      lobby_users += '<@'+lobby.user_id+'> ';
    });
    switch (member_count){
      case 0:
        interest = ' has *left* the raid. ';
        break;
      case 1:
        interest = ' has shown interest in the raid with **'+member_count+'** account! ';
        break;
      default:
        interest = ' has shown interest in the raid with **'+member_count+'** accounts! ';
        break;
    }
    // TAG USER IN EXISTING CHANNEL
  return MAIN.channels.get(channel).send('<@'+member+'>'+interest+'There are:\n```\n'+transit_users+' accounts on the way.\n'+present_users+' accounts at the raid\n'+lobby_count+' total accounts interested```'+lobby_users).catch(console.error);
  });
}
