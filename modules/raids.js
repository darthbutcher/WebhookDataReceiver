const Discord = require('discord.js');
const insideGeofence = require('point-in-polygon');
const insideGeojson = require('point-in-geopolygon');

//####################################################//
//####################################################//
//#####   _____            _____ _____   _____   #####//
//#####  |  __ \     /\   |_   _|  __ \ / ____|  #####//
//#####  | |__) |   /  \    | | | |  | | (___    #####//
//#####  |  _  /   / /\ \   | | | |  | |\___ \   #####//
//#####  | | \ \  / ____ \ _| |_| |__| |____) |  #####//
//#####  |_|  \_\/_/    \_\_____|_____/|_____/   #####//
//#####     RAID WEBHOOKS, AND SUBSCRIPTIONS     #####//
//####################################################//
//####################################################//

module.exports.run = async (MAIN, raid) => {

  // VARIABLES
  let main_area = '', sub_area = '', server = '', area = {};
  let defending_team = '', raid_sponsor = '', embed_area = '', embed_color = '', raid_type = '', raid_embed = '', embed_thumb = '';
  let time_now = new Date().getTime(), hatch_time = MAIN.Bot_Time(raid.start,'1'), end_time = MAIN.Bot_Time(raid.end,'1');
  let hatch_mins = Math.floor((raid.start-(time_now/1000))/60), end_mins = Math.floor((raid.end-(time_now/1000))/60);

  // DEBUG
  if(MAIN.debug.Raids == 'ENABLED'){ console.info('[DEBUG] [Modules] [raids.js] Received Raid ID: '+raid.gym_id); }

  // DEFINE THE DISCORD THE OBJECT NEEDS TO BE SENT TO
  await MAIN.Discord.Servers.forEach((bot_discord,index) => {
    if(insideGeofence([raid.latitude,raid.longitude], bot_discord.geofence)){ server = bot_discord; }
  });

  // DEFINE THE GEOFENCE THE OBJECT IS WITHIN
  await MAIN.geofences.features.forEach((geofence,index) => {
    if(insideGeojson.polygon(geofence.geometry.coordinates, [raid.longitude,raid.latitude])){
      if(geofence.properties.sub_area != 'true'){ area.main = geofence.properties.name; }
      else if(geofence.properties.sub_area == 'false'){  area.sub = geofence.properties.name;  }
    }
  });

  // DEFINE AREA FOR EMBED
  if(area.sub){ embed_area = area.sub; sub_area = area.sub; }
  else if(area.main){ embed_area = area.main; main_area = area.main; }
  else{ embed_area = server.name; main_area = server.name; }

  MAIN.Static_Map_Tile(raid.latitude,raid.longitude,'raid').then(async function(imgUrl){

    // ATTACH THE MAP TILE
    let attachment = new Discord.Attachment(imgUrl, 'Raid_Alert.png');

    // DETERMINE GYM CONTROL
    let defending_team = await MAIN.Get_Detail('team',raid.team_id);

    // GET RAID LEVEL
    switch(raid.level){
      case 1:
      case 2: embed_color = 'f358fb'; break;
      case 3:
      case 4: embed_color = 'ffd300'; break;
      case 5: embed_color = '5b00de'; break;
    }

    // CHECK IF SPONSORED GYM
    if(raid.sponsor_id == true){ raid_sponsor = ' | '+MAIN.emotes.exPass+' Eligible'; }

    // CHECK FOR GYM NAME
    if(!raid.gym_name){ gym_name = 'No Name'; }
    else{ gym_name = raid.gym_name; }

    // DETERMINE IF IT'S AN EGG OR A RAID
    switch(raid.cp){

      // RAID IS AN EGG
      case 0:
        raid_type = 'Egg';

        // GET EGG IMAGE
        switch(raid.level){
          case 1:
          case 2: embed_thumb = 'https://i.imgur.com/ABNC8aP.png'; break;
          case 3:
          case 4: embed_thumb = 'https://i.imgur.com/zTvNq7j.png'; break;
          case 5: embed_thumb = 'https://i.imgur.com/jaTCRXJ.png'; break;
        }

        // CREATE THE EGG EMBED
        raid_embed = new Discord.RichEmbed().setThumbnail(embed_thumb).setColor(embed_color)
          .addField(raid.gym_name, embed_area, false)
          .addField('Hatches: '+hatch_time+' (*'+hatch_mins+' Mins*)', 'Level '+raid.level+' | '+defending_team+raid_sponsor, false)
          .addField('Directions:','[Google Maps](https://www.google.com/maps?q='+raid.latitude+','+raid.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+raid.latitude+','+raid.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+raid.latitude+','+raid.longitude+'&navigate=yes)',false)
          .attachFile(attachment)
          .setImage('attachment://Raid_Alert.png');

        raid_filtration(MAIN, raid_embed, raid_type, raid, server, main_area, sub_area); break;

      // RAID IS A BOSS
      default:
        raid_type = 'Boss';

        // DETERMINE POKEMON NAME AND TYPE
        let pokemonType = '';
        let pokemonName = MAIN.pokemon[raid.pokemon_id].name;
        await MAIN.pokemon[raid.pokemon_id].types.forEach((type) => {  pokemonType += type+' '+MAIN.emotes[type.toLowerCase()]+' / '; });
        pokemonType = pokemonType.slice(0,-3);

        // DETERMINE MOVE NAMES AND TYPES
        let move_name_1 = MAIN.moves[raid.move_1].name;
        let move_type_1 = await MAIN.Get_Detail('type',raid.move_1);
        let move_name_2 = MAIN.moves[raid.move_2].name;
        let move_type_2 = await MAIN.Get_Detail('type',raid.move_2);

        // GET THE RAID BOSS SPRITE
        let raid_url = await MAIN.Get_Sprite(raid.form, raid.pokemon_id);

        // GET THE BOSS MOVESET
        if(!MAIN.moves[raid.move_1].name){ console.error('Move ID #'+raid.move_1+' not found in pokemon.json. Please report to the Discord.'); }
        if(!MAIN.moves[raid.move_2].name){ console.error('Move ID #'+raid.move_2+' not found in pokemon.json. Please report to the Discord.'); }

        // CREATE THE RAID EMBED
        raid_embed = new Discord.RichEmbed().setThumbnail(raid_url).setColor(embed_color)
          .setTitle('**'+pokemonName+'** has taken over a Gym!')
          .setDescription(move_name_1+' '+move_type_1+' / '+move_name_2+' '+move_type_2)
          .addField(gym_name+' | '+embed_area, pokemonType+'\nWeaknesses:', false)
          .addField('Raid Ends: '+end_time+' (*'+end_mins+' Mins*)', 'Level '+raid.level+' | '+defending_team+raid_sponsor, false)
          .addField('Directions:','[Google Maps](https://www.google.com/maps?q='+raid.latitude+','+raid.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+raid.latitude+','+raid.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+raid.latitude+','+raid.longitude+'&navigate=yes)',false)
          .attachFile(attachment)
          .setImage('attachment://Raid_Alert.png');

        raid_filtration(MAIN, raid_embed, raid_type, raid, server, main_area, sub_area);
    }



    // SEND TO THE SUBSCRIPTION MODULE
    if(MAIN.config.RAID.Subscriptions == 'ENABLED'){

    }

    // END
    return;
  });
}

function raid_filtration(MAIN, raid_embed, raid_type, raid, server, main_area, sub_area){

  // CHECK EACH FEED IN THE RAID ARRAY
  if(MAIN.config.RAID.Discord_Feeds == 'ENABLED'){

    // DEBUG
    if(MAIN.debug.Raids == 'ENABLED'){ console.info('[DEBUG] [Modules] [raids.js] Raid Sent to Filters. ID: '+raid.gym_id); }

    // CHECK EACH FEED FILTER
    MAIN.Raid_Channels.forEach((raid_channel,index) => {

      let geofences = raid_channel[1].geofences;
      let channel = MAIN.channels.get(raid_channel[0]);
      let filter = MAIN.Filters.get(raid_channel[1].filter);

      // THROW ERRORS FOR INVALID DATA
      if(!filter){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] The filter defined for'+raid_channel[0]+' does not appear to exist.'); }
      if(!channel){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] The channel '+raid_channel[0]+' does not appear to exist.'); }

      // FILTER FOR DISCORD ID
      if(channel.guild.id == server.id){

        // FILTER FEED TYPE FOR EGG, BOSS, OR BOTH
        if(filter.Egg_Or_Boss.toLowerCase() == 'both' || filter.Egg_Or_Boss.toLowerCase() == raid_type.toLowerCase()){

          // FILTER FOR RAID LEVEL
          if(filter.Raid_Levels.indexOf(raid.level) >= 0){

            // AREA FILTER
            if(raid_channel[1].geofences.indexOf(server.name) >= 0 || raid_channel[1].geofences.indexOf(main_area) >= 0 || raid_channel[1].geofences.indexOf(sub_area) >= 0){

              // CHECK FOR EX ELIGIBLE REQUIREMENT
              if(filter.Ex_Eligible == undefined || filter.Ex_Eligible == false){
                if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Modules] Sent a Level '+raid.level+' Raid '+raid_type+' to '+channel.guild.name+' ('+raid_channel[0]+').'); }
                MAIN.Send_Embed(raid_embed, channel.id);
              }
              else if(filter.Ex_Eligible == raid.sponsor_id){
                if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Modules] Sent a Level '+raid.level+' Raid '+raid_type+' to '+channel.guild.name+' ('+raid_channel[0]+').'); }
                MAIN.Send_Embed(raid_embed, channel.id);
              }
            }
            else{
              if(MAIN.debug.Raids == 'ENABLED'){ console.info('[DEBUG] [Modules] [raids.js] Raid Did Not Pass Channel Geofences for '+raid_channel[0]+'. Expected: '+raid_channel[1].geofences+' Saw: '+server.name+'|'+area.main+'|'+area.sub); }
            }
          }
          else{
            if(MAIN.debug.Raids == 'ENABLED'){ console.info('[DEBUG] [Modules] [raids.js] Raid Did Not Pass Level Filter for '+raid_channel[0]+' Expected: '+filter.Raid_Levels.toString()+' Saw: '+raid.level); }
          }
        }
        else{
          if(MAIN.debug.Raids == 'ENABLED'){ console.info('[DEBUG] [Modules] [raids.js] Filter Did Not Pass Type Check for '+raid_channel[0]+'. Expected: '+filter.Type+', Saw: '+raid_type); }
        }
      }
      else{
        if(MAIN.debug.Raids == 'ENABLED'){ console.info('[DEBUG] [Modules] [raids.js] Raid Did Not Discord Filter for '+raid_channel[0]+'. Expected: '+filter.Type+', Saw: '+raid_type); }
      }
    });
  }
}
