const Discord = require('discord.js');
const moment = require('moment-timezone');

const reactions = {
    "interval": 60000
};

reactions.run = (MAIN, event) => {
  let guild = MAIN.guilds.get(event.d.guild_id);
  let member = guild.members.get(event.d.user_id);
  let channel = MAIN.channels.get(event.d.channel_id);
  let user_list = '', discord = '';
	if(!member.user.bot && event.d.emoji.id == MAIN.emotes.checkYesReact.id){

    // FETCH CHANNEL
    channel.fetchMessage(event.d.message_id).then( async raid => {

      let gym_id = raid.embeds[0].footer.text;

      await MAIN.Discord.Servers.forEach( async (server,index) => {
        if(server.id == guild.id){ discord = server; }
      });

      MAIN.pdb.query(`SELECT * FROM active_raids WHERE gym_id = ?`, [gym_id], function (error, record, fields) {
        if(error){ console.error(error); }
        else if(record[0]){

          // CHECK FOR ABUSE
          MAIN.pdb.query(`SELECT * FROM active_raids WHERE initiated_by = ? AND created > UNIX_TIMESTAMP()-900`, [member.id], function (error, posts, fields) {
            if(posts && posts.length >= MAIN.config.Lobby_Limit){
              guild.fetchMember(event.d.user_id).then( TARGET => {
                return TARGET.send('You have have attempted to create too many raid lobbies in a short amount of time. Please only react to raids you can actually make it to and are seriously interested in.').catch(console.error);
              });
            } else{

              // CHECK IF THE RAID IS ALREADY ACTIVE
              if(record[0].active == 'true'){

                // TAG USER IN EXISTING CHANNEL
                MAIN.channels.get(record[0].raid_channel).send(member+' has shown interest in the raid! Make sure to coordinate a start time.').catch(console.error);
              } else{

                // SET THE CHANNEL NAME
                let channel_name = record[0].gym_name

                // CREATE THE CHANNEL
                guild.createChannel(channel_name, 'text').then( new_channel => {

                  // SET THE CATEGORY ID
                  new_channel.setParent(channel.parent).then( new_channel => {
		    new_channel.lockPermissions();
                    let embed = JSON.parse(record[0].embed), channel_id = new_channel.id;

                    let channel_embed = new Discord.RichEmbed()
                      .setColor(embed.color)
                      .setThumbnail(embed.thumbnail.url)
                      .setAuthor(embed.author.name, embed.author.iconURL)
                      .setImage(embed.image.url);
                    if(embed.fields[0]){
                      channel_embed.addField(embed.fields[0].name, embed.fields[0].value, false)
                    }
                    if(embed.fields[1]){
                      channel_embed.addField(embed.fields[1].name, embed.fields[1].value, false)
                    }
                    if(embed.fields[2]){
                      channel_embed.addField(embed.fields[2].name, embed.fields[2].value, false)
                    }

                    let mention = '<@&'+discord.raid_role+'> '
                    if (mention == "<@&> "){ mention = '' }
                    new_channel.send(mention+member+' has shown interest in a raid! Make sure to coordinate a start time.', channel_embed).catch(console.error);
		    boss_name = embed.fields[0].name.slice(0, -7);
		    boss_name = boss_name.slice(2);

                    // UPDATE SQL RECORD
                    MAIN.pdb.query(`UPDATE active_raids SET active = ?, channel_id = ?, initiated_by = ?, raid_channel = ?, created = ?, boss_name = ? WHERE gym_id = ?`, ['true', channel.id, member.id, channel_id, moment().unix(), embed.fields[0].name, gym_id], function (error, raids, fields) {
                      if(error){ console.error(error); }
                    });
                    new_channel.setName(boss_name+'_'+record[0].gym_name).catch(console.error);
                  });
                });
              }
            }
          });
        } else{
          guild.fetchMember(event.d.user_id).then( TARGET => {
            return TARGET.send('Unable to create an Active Raid for '+raid.embeds[0].author.name+'. That Raid appears to have expired!').catch(console.error);
          });
        }
      });
    }); return;
  }
}

function getActiveRaids(MAIN){
  return new Promise(function(resolve, reject) {
    MAIN.pdb.query(`SELECT * FROM active_raids WHERE active = ?`, ['true'], function (error, raids, fields) { return resolve(raids); });
  });
}

reactions.startInterval = async (MAIN) => {
    let active_raids = await getActiveRaids(MAIN);
    setInterval(async function() {
      await active_raids.forEach((active,index) => {
        MAIN.pdb.query(`SELECT * FROM active_raids WHERE gym_id = ? AND active = ?`, [active.gym_id, 'true'], function (error, record, fields) {
          if(record[0] && active.embed != record[0].embed){

            let embed = JSON.parse(record[0].embed);

            let channel_embed = new Discord.RichEmbed()
              .setColor(embed.color)
              .setThumbnail(embed.thumbnail.url)
              .setAuthor(embed.author.name, embed.author.iconURL)
              .setImage(embed.image.url);
            if(embed.fields[0]){
              channel_embed.addField(embed.fields[0].name, embed.fields[0].value, false)
            }
            if(embed.fields[1]){
              channel_embed.addField(embed.fields[1].name, embed.fields[1].value, false)
            }
            if(embed.fields[2]){
              channel_embed.addField(embed.fields[2].name, embed.fields[2].value, false)
            }

	    boss_name = embed.fields[0].name.slice(0, -7);
            boss_name = boss_name.slice(2);
	    MAIN.channels.get(record[0].raid_channel).setName(boss_name+'_'+record[0].gym_name).catch(console.error);

            MAIN.channels.get(record[0].raid_channel).send(channel_embed).catch(console.error);
          }
        });
      });
      active_raids = await getActiveRaids(MAIN);
    }, 60000);
}

module.exports = reactions;
