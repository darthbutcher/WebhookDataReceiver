const Discord = require('discord.js');

module.exports.run = async (MAIN, target, raid, raid_type, main_area, sub_area, embed_area, server, timezone) => {

  // CHECK IF THE TARGET IS A USER
  let member = MAIN.guilds.get(server.id).members.get(target.user_id);

  // VARIABLES
  let time_now = new Date().getTime();
  let hatch_time = MAIN.Bot_Time(raid.start, '1', timezone);
  let end_time = MAIN.Bot_Time(raid.end, '1', timezone);
  let hatch_mins = Math.floor((raid.start-(time_now/1000))/60);
  let end_mins = Math.floor((raid.end-(time_now/1000))/60);

  // GET STATIC MAP TILE
  let img_url = '';
  if(MAIN.config.Map_Tiles == 'ENABLED'){
    img_url = await MAIN.Static_Map_Tile(raid.latitude, raid.longitude, 'raid');
  }

  // DETERMINE GYM CONTROL
  let defending_team = '';
  switch(raid.team_id){
    case 1: defending_team = MAIN.emotes.mystic+' Gym'; break;
    case 2: defending_team = MAIN.emotes.valor+' Gym'; break;
    case 3: defending_team = MAIN.emotes.instinct+' Gym'; break;
    default: defending_team = 'Uncontested Gym';
  }

  //role ID mention
  let roleID ='';

  // GET RAID LEVEL
  let embed_color = '';
  switch(raid.level){
    case 1:
    case 2: embed_color = 'f358fb'; break;
    case 3:
    case 4: embed_color = 'ffd300'; break;
    case 5: embed_color = '5b00de'; break;
  }

  // CHECK IF SPONSORED GYM
  let raid_sponsor = '';
  if(raid.sponsor_id == true){ raid_sponsor = ' | '+MAIN.emotes.exPass+' Eligible'; }
  if(raid.ex_raid_eligible == true){ raid_sponsor = ' | '+MAIN.emotes.exPass+' Eligible'; }

  // CHECK FOR GYM NAME
  let gym_name = '';
  if(!raid.gym_name){ gym_name = 'No Name'; }
  else{ gym_name = raid.gym_name; }

  // DETERMINE IF IT'S AN EGG OR A RAID
  let embed_thumb = '', raid_embed = '', db_embed = '', gym_id = raid.gym_id;

  let gym_notes = '';
  if (!MAIN.gym_notes[gym_id]) { console.log('add note'); } else { gym_notes = MAIN.gym_notes[gym_id].description; }

  switch(raid_type){

    case 'Egg':

      // GET EGG IMAGE
      switch(raid.level){
        case 1:
        case 2: embed_thumb = 'https://i.imgur.com/ABNC8aP.png'; break;
        case 3:
        case 4: embed_thumb = 'https://i.imgur.com/zTvNq7j.png'; break;
        case 5: embed_thumb = 'https://i.imgur.com/jaTCRXJ.png'; break;
      }

      // CREATE THE EGG EMBED
      raid_embed = new Discord.RichEmbed()
        .setThumbnail(embed_thumb)
        .setColor(embed_color)
        .setAuthor(gym_name, raid.gym_url)
	.setDescription(gym_notes)
        .setImage(img_url)
        .addField('**Level '+raid.level+'** Raid', defending_team+raid_sponsor, false)
        .addField('Hatches: '+hatch_time,embed_area, false)
        .addField('Directions:','[Google Maps](https://www.google.com/maps?q='+raid.latitude+','+raid.longitude+') | '
                                             +'[Apple Maps](http://maps.apple.com/maps?daddr='+raid.latitude+','+raid.longitude+'&z=10&t=s&dirflg=d) | '
                                             +'[Scan Map]('+MAIN.config.FRONTEND_URL+'?lat='+raid.latitude+'&lon='+raid.longitude+'&zoom=15)',false)
      // ADD FOOTER IF RAID LOBBIES ARE ENABLED
      if(MAIN.config.Raid_Lobbies == 'ENABLED'){ raid_embed.setFooter(raid.gym_id); }

      // CHECK CONFIGS AND SEND TO USER OR FEED
      if(member && MAIN.config.RAID.Subscriptions == 'ENABLED'){
        if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Embed] [raids.js] Sent a Level '+raid.level+' Raid Egg to '+member.user.tag+' ('+member.id+').'); }
        MAIN.Send_DM(server.id, member.id, raid_embed, target.bot);
      } else if(MAIN.config.RAID.Discord_Feeds == 'ENABLED'){
        if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Embed] [raids.js] Sent a Level '+raid.level+' Raid Egg to '+target.guild.name+' ('+target.id+').'); }
        MAIN.Send_Embed('raid', raid.level, server, roleID, raid_embed, target.id);
      } else{ console.info('[Pokébot] Raid ignored due to Disabled Discord Feed setting.'); }

      // STRINGIFY THE EMBED
      db_embed = JSON.stringify(raid_embed);

      setTimeout(function() {
        // CHECK FOR RAID LOBBIES
        if(raid.level >= server.min_raid_lobbies ){

          // UPDATE BOSS NAME
          MAIN.pdb.query(`UPDATE active_raids SET embed = ? WHERE gym_id = ?`, [db_embed, gym_id], function (error, record, fields) {
            if(error){ console.error(error); }
          });
        }
      }, 5000); break;

    // RAID IS A BOSS
    case 'Boss':

      // DETERMINE POKEMON NAME AND TYPE
      let pokemon_type = '', weaknesses = '';
      let pokemon_name = MAIN.pokemon[raid.pokemon_id].name;
      await MAIN.pokemon[raid.pokemon_id].types.forEach((type) => {
        pokemon_type += type+' '+MAIN.emotes[type.toLowerCase()]+' / ';
        MAIN.types[type.toLowerCase()].weaknesses.forEach((weakness,index) => {
          if(weaknesses.indexOf(MAIN.emotes[weakness.toLowerCase()]) < 0){
            weaknesses += MAIN.emotes[weakness.toLowerCase()]+' ';
          }
        });
      });
      pokemon_type = pokemon_type.slice(0,-3);
      weaknesses = weaknesses.slice(0,-1);

      if(!MAIN.moves[raid.move_1]){ console.error('Move ID #'+raid.move_1+' not found in pokemon.json. Please report to the Discord.'); }
      if(!MAIN.moves[raid.move_2]){ console.error('Move ID #'+raid.move_2+' not found in pokemon.json. Please report to the Discord.'); }

      // DETERMINE MOVE NAMES AND TYPES
      let move_name_1 = MAIN.moves[raid.move_1].name;
      let move_type_1 = MAIN.emotes[MAIN.moves[raid.move_1].type.toLowerCase()];
      let move_name_2 = MAIN.moves[raid.move_2].name;
      let move_type_2 = MAIN.emotes[MAIN.moves[raid.move_2].type.toLowerCase()];

      // GET THE RAID BOSS SPRITE
      let raid_url = await MAIN.Get_Sprite(raid.form, raid.pokemon_id);

      // CREATE THE RAID EMBED
      raid_embed = new Discord.RichEmbed()
        .setThumbnail(raid_url)
        .setColor(embed_color)
        .setImage(img_url)
        .setAuthor(gym_name, raid.gym_url)
        .setDescription(gym_notes)
        .addField('**'+pokemon_name+'** Raid', move_name_1+' '+move_type_1+' / '+move_name_2+' '+move_type_2, false)
        .addField('Raid Ends: '+end_time,'Level '+raid.level+' | '+defending_team+raid_sponsor+'\nCounter(s): '+weaknesses,false)
        .addField(embed_area+' | Directions:','[Google Maps](https://www.google.com/maps?q='+raid.latitude+','+raid.longitude+') | '
                               +'[Apple Maps](http://maps.apple.com/maps?daddr='+raid.latitude+','+raid.longitude+'&z=10&t=s&dirflg=d) | '
                               +'[Scan Map]('+MAIN.config.FRONTEND_URL+'?lat='+raid.latitude+'&lon='+raid.longitude+'&zoom=15)',false);
      // ADD FOOTER IF RAID LOBBIES ARE ENABLED
      if(raid.level >= server.min_raid_lobbies){ raid_embed.setFooter(raid.gym_id); }

      // CHECK CONFIGS AND SEND TO USER OR FEED
      if(member && MAIN.config.RAID.Subscriptions == 'ENABLED'){
        if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Embed] [raids.js] Sent a '+pokemon_name+' Raid Boss to '+member.user.tag+' ('+member.id+').'); }
        MAIN.Send_DM(server.id, member.id, raid_embed, target.bot);
      } else if(MAIN.config.RAID.Discord_Feeds == 'ENABLED'){
        if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Embed] [raids.js] Sent a '+pokemon_name+' Raid Boss to '+target.guild.name+' ('+target.id+').'); }
        MAIN.Send_Embed('raid', raid.level, server, roleID, raid_embed, target.id);
      } else{ console.info('[Pokébot] Raid ignored due to Disabled Discord Feed setting.'); }

      // STRINGIFY THE EMBED
      db_embed = JSON.stringify(raid_embed);

      // CHECK FOR RAID LOBBIES
      setTimeout( async function() {
        if(raid.level >= server.min_raid_lobbies ){
          MAIN.pdb.query(`SELECT * FROM active_raids WHERE gym_id = ?`, [gym_id], function (error, record, fields) {
            if(record[0]){

              // UPDATE EMBED
              MAIN.pdb.query(`UPDATE active_raids SET embed = ? WHERE gym_id = ?`, [db_embed, gym_id], function (error, record, fields) {
                if(error){ console.error(error); }
              });
            }
          });
        }
      }, 5000); break;
  } return;
}
