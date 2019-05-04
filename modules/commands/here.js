const Discord=require('discord.js');

module.exports.run = async (MAIN, message, raids, count) => {
  member = message.author.id;
  channel = raids.raid_channel;
  // RESET LOBBY COUNT
  lobby_count = 0;
  lobby_users = '';
  present_users = 0;
  transit_users = 0;
  member_count = 0;

  MAIN.pdb.query(`SELECT * FROM lobby_members WHERE gym_id = ?`, [raids.gym_id], function (error, lobby, fields) {
    if(error){ console.error(error);}
    // CHECK IF USER HAS PREVIOUSLY SHOWN INTEREST
    user_search().then(function(results){
    if (results === undefined) {
      member_count = 1;
      MAIN.pdb.query(`INSERT INTO lobby_members (gym_id, user_id, count, arrived) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE count = ?, arrived = ?`, [raids.gym_id, member,member_count,'here',member_count, 'here'], function (error, lobby, fields) {
        if(error){ console.error(error); }
      });
      present_users += member_count;
      lobby_count += member_count;
    }
    else {
      MAIN.pdb.query(`UPDATE lobby_members SET arrived = ? WHERE gym_id = ? && user_id = ?`, ['here',raids.gym_id,member], function (error, lobby, fields) {
        if(error){ console.error(error); }
      });
    }
    // COUNT LOBBY MEMBERS
    lobby.forEach(function(lobby) {
      if (lobby.user_id == member) { member_count = lobby.count; }
      if (lobby.arrived == 'here') { present_users += lobby.count; }
      if (lobby.arrived == 'coming') { transit_users += lobby.count; }
      if (lobby.arrived == 'interested' && lobby.user_id == member ) { present_users += lobby.count; }
      if (lobby.arrived == 'coming' && lobby.user_id == member ) {
        present_users += lobby.count;
        transit_users -= lobby.count;
      }
      lobby_count += lobby.count;
      lobby_users += '<@'+lobby.user_id+'> ';
    });
    // TAG USER IN EXISTING CHANNEL

    return MAIN.channels.get(channel).send('<@'+member+'> is **at** the raid! There are:\n```\n'+transit_users+' accounts on the way.\n'+present_users+' accounts at the raid\n'+lobby_count+' total accounts interested```'+lobby_users).catch(console.error);
   }).catch(function(err){
    console.error();("Promise rejection error: "+err);
    })
  });

  user_search = function(){
    return new Promise( function(resolve, reject){
      MAIN.pdb.query(`SELECT * FROM lobby_members WHERE user_id = ?`, [member], function (error, user, fields) {
              if(fields === undefined){
                  reject(new Error("Error fields is undefined"));
              }else{
                  resolve(user[0]);
              }
          }
      )}
  )}
}
