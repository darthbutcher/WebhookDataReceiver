const Discord=require('discord.js');

module.exports.run = async (MAIN, message, prefix, discord) => {
  let members = message.guild.members.map( m => m);
  let role = message.guild.roles.find('name', 'Trainers');
  for(let m=0; m<members.length; m++){
    setTimeout(function() {
      message.guild.members.get(members[m].id).addRole(role).catch(console.error);
      console.log('[Pokebot] [ROLE] Added '+role.name+' to '+members[m].user.tag);
    }, 2000*m);
  }

}
