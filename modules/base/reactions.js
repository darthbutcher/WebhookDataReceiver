const Discord = require('discord.js');

module.exports.run = async (MAIN, event) => {
  let guild = MAIN.guilds.get(event.d.guild_id);
  let member = guild.members.get(event.d.user_id);
  let channel = MAIN.channels.get(event.d.channel_id);
  let user_list = '', discord = '';
	if(!member.user.bot && event.d.emoji.id == MAIN.emotes.checkYesReact.id){

    // FETCH CHANNEL
    channel.fetchMessage(event.d.message_id).then( async raid => {

      await MAIN.Discord.Servers.forEach( async (server,index) => {
        if(server.id == guild.id){ discord = server; }
      });

      MAIN.pdb.query(`SELECT * FROM active_raids WHERE gym_id = ?`, [raid.embeds[0].footer.text], function (error, record, fields) {
        if(error){ console.error; }
        else if(record[0]){

          // CHECK IF THE RAID IS ALREADY ACTIVE
          if(record[0].active == 'true'){

            // TAG USER IN EXISTING CHANNEL
            MAIN.channels.get(record[0].channel_id).send(member+' has shown interest in the raid!').catch(console.error);
          } else{

            // SET THE CHANNEL NAME
            let channel_name = record[0].boss_name+'_'+record[0].area

            // CREATE THE CHANNEL
            guild.createChannel(channel_name, 'text').then( new_channel => {

              // SET THE CATEGORY ID
              new_channel.setParent(discord.raid_lobbies_category_id).then( new_channel => {

                let embed = JSON.parse(record[0].embed);

                let channel_embed = new Discord.RichEmbed()
                  .setColor(embed.color)
                  .setThumbnail(embed.thumbnail.url)
                  .setAuthor(embed.author.name, embed.author.iconURL)
                  .addField(embed.fields[0].name, embed.fields[0].value, false)
                  .addField(embed.fields[1].name, embed.fields[1].value, false)
                  .addField(embed.fields[2].name, embed.fields[2].value, false)
                  .setImage(embed.image.url);

                new_channel.channel.send(member+' has shown interest in a raid!', channel_embed).then( message)

                MAIN.pdb.query(`UPDATE active_raids SET active = ?, channel_id = ? WHERE gym_id = ?`,
                  ['true', new_channel.id, raid.embeds[0].footer.text], function (error, raids, fields) { if(error){ console.error; } });
              });
            });
          }
        } else{
          guild.fetchMember(event.d.user_id).then( TARGET => {
            return TARGET.send('Unable to create an Active Raid for '+raid.embeds[0].author.name+'. That Raid appears to have expired!').catch(console.error);
          });
        }
      });
    }); return;
  }
}
