const Discord=require('discord.js');

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

module.exports.run = async (MAIN, raid, city) => {

  // DEBUG
  if(MAIN.debug.Raids == 'ENABLED'){ console.info('[DEBUG] [raids.js] Received Raid ID: '+raid.gym_id); }

  // VARIABLES
  let defendingTeam = '', area = '', raidSponsored = '', embedColor = '', raidType = '', raidEmbed = '', embedThumb = '';
  let timeNow = new Date().getTime(), hatchTime=MAIN.Bot_Time(raid.start,'1'), endTime = MAIN.Bot_Time(raid.end,'1');
  let hatchMinutes = Math.floor((raid.start-(timeNow/1000))/60), endMinutes = Math.floor((raid.end-(timeNow/1000))/60);

  MAIN.Static_Map_Tile(raid.latitude,raid.longitude,'raid').then(async function(imgUrl){

    // ATTACH THE MAP TILE
    let attachment = new Discord.Attachment(imgUrl, 'Raid_Alert.png');

    // DETERMINE THE GEOFENCE AREA
    let raidArea = await MAIN.Get_Area(raid.latitude,raid.longitude);

    // DETERMINE GYM CONTROL
    let defendingTeam = await MAIN.Get_Team(raid.team_id);

    // GET RAID LEVEL
    switch(raid.level){
      case 1:
      case 2: embedColor = 'f358fb'; break;
      case 3:
      case 4: embedColor = 'ffd300'; break;
      case 5: embedColor = '5b00de'; break;
    }

    // CHECK IF SPONSORED GYM
    if(raid.sponsor_id == true){ raidSponsored = ' | '+MAIN.emotes.exPass+' Eligible'; }

    // CHECK FOR GYM NAME
    if(!raid.gym_name){ gymName = 'No Name'; }
    else{ gymName = raid.gym_name; }

    // DETERMINE IF IT'S AN EGG OR A RAID
    switch(raid.cp){

      // RAID IS AN EGG
      case 0:
        raidType = 'Egg';

        // GET EGG IMAGE
        switch(raid.level){
          case 1:
          case 2: embedThumb = 'https://i.imgur.com/ABNC8aP.png'; break;
          case 3:
          case 4: embedThumb = 'https://i.imgur.com/zTvNq7j.png'; break;
          case 5: embedThumb = 'https://i.imgur.com/jaTCRXJ.png'; break;
        }

        // CREATE THE EGG EMBED
        raidEmbed = new Discord.RichEmbed().setThumbnail(embedThumb).setColor(embedColor)
          .addField(raid.gym_name, raidArea.name, false)
          .addField('Hatches: '+hatchTime+' (*'+hatchMinutes+' Mins*)', 'Level '+raid.level+' | '+defendingTeam+raidSponsored, false)
          .addField('Directions:','[Google Maps](https://www.google.com/maps?q='+raid.latitude+','+raid.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+raid.latitude+','+raid.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+raid.latitude+','+raid.longitude+'&navigate=yes)',false)
          .attachFile(attachment)
          .setImage('attachment://Raid_Alert.png');

        send_to_discord(MAIN, raidEmbed, raidType, raid, city); break;

      // RAID IS A BOSS
      default:
        raidType = 'Boss';

        // DETERMINE POKEMON NAME AND TYPE
        let pokemonType = '';
        let pokemonName = MAIN.pokemon[raid.pokemon_id].name;
        await MAIN.pokemon[raid.pokemon_id].types.forEach((type) => {  pokemonType += type+' '+MAIN.emotes[type.toLowerCase()]+' / '; });
        pokemonType = pokemonType.slice(0,-3);

        // DETERMINE MOVE NAMES AND TYPES
        let moveName1 = MAIN.moves[raid.move_1].name;
        let moveType1 = await MAIN.Get_Move_Type(raid.move_1);
        let moveName2 = MAIN.moves[raid.move_2].name;
        let moveType2 = await MAIN.Get_Move_Type(raid.move_2);

        // GET THE RAID BOSS SPRITE
        let raidUrl = await MAIN.Get_Sprite(raid.form, raid.pokemon_id);

        // GET THE BOSS MOVESET
        if(!MAIN.moves[raid.move_1].name){ console.error('Move ID #'+raid.move_1+' not found in pokemon.json. Please report to the Discord.'); }
        if(!MAIN.moves[raid.move_2].name){ console.error('Move ID #'+raid.move_2+' not found in pokemon.json. Please report to the Discord.'); }

        // CREATE THE RAID EMBED
        raidEmbed = new Discord.RichEmbed().setThumbnail(raidUrl).setColor(embedColor)
          .addField('**'+pokemonName+'** has taken over a Gym!', pokemonType, false)
          .addField(gymName+' | '+raidArea.name, moveName1+' '+moveType1+' / '+moveName2+' '+moveType2, false)
          .addField('Raid Ends: '+endTime+' (*'+endMinutes+' Mins*)', 'Level '+raid.level+' | '+defendingTeam+raidSponsored, false)
          .addField('Directions:','[Google Maps](https://www.google.com/maps?q='+raid.latitude+','+raid.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+raid.latitude+','+raid.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+raid.latitude+','+raid.longitude+'&navigate=yes)',false)
          .attachFile(attachment)
          .setImage('attachment://Raid_Alert.png');

        send_to_discord(MAIN, raidEmbed, raidType, raid, city);
    }



    // SEND TO THE SUBSCRIPTION MODULE
    if(MAIN.r_config.Subscriptions == 'ENABLED'){

    }

    // END
    return;
  });
}

function send_to_discord(MAIN, raidEmbed, raidType, raid, city){
  // CHECK EACH FEED IN THE RAID ARRAY
  if(MAIN.r_config.Discord_Feeds == 'ENABLED'){

    // DEBUG
    if(MAIN.debug.Raids == 'ENABLED'){ console.info('[DEBUG] [raids.js] Raid Sent to Filters. ID: '+raid.gym_id); }

    // CHECK EACH FEED FILTER
    MAIN.feeds.forEach((feed,index) => {

      // ONLY LOOK AT FEEDS MARKED AS RAIDS
      if(feed.Type == 'raid'){

        // FILTER FOR EGG OR RAID AND CITY
        if(MAIN.config.Cities.length == 1 || city.name == feed.City){
          if(feed.Egg_Or_Boss.toLowerCase() == raidType.toLowerCase()){

            // FILTER FOR RAID LEVEL
            if(feed.Raid_Levels.indexOf(raid.level) >= 0){

              // CHECK FOR EX ELIGIBLE REQUIREMENT
              if(feed.Ex_Eligible == undefined){
                if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Modules] Sent a Raid '+raidType+' for '+city.name+'.'); }
                MAIN.Send_Embed(raidEmbed,feed.Channel_ID);
              }
              else if(feed.Ex_Eligible == raid.sponsor_id){
                if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Modules] Sent a Raid '+raidType+' for '+city.name+'.'); }
                MAIN.Send_Embed(raidEmbed,feed.Channel_ID);
              }
            }
            else{
              if(MAIN.debug.Raids == 'ENABLED'){ console.info('[DEBUG] [raids.js] Raid Did Not Pass Feed Filter. '+raid.gym_id); }
            }
          }
        }
      }
    });
  }
}
