const Discord=require('discord.js');
const moves=require('../static/moves.json');

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
  if(MAIN.debug.raids=='ENABLED'){ if(MAIN.debug.detailed=='ENABLED'){ console.info(raid); } else{ console.info(raid.gym_id); } }

  // VARIABLES
  let defendingTeam='', area, raidSponsored='', embedColor='', raidType='', raidEmbed='',
  timeNow=new Date().getTime(), hatchTime=MAIN.Bot_Time(raid.start,'1'), endTime=MAIN.Bot_Time(raid.end,'1'),
  hatchMinutes=Math.floor((raid.start-(timeNow/1000))/60), endMinutes=Math.floor((raid.end-(timeNow/1000))/60);

  // DETERMINE THE GEOFENCE AREA
  let raidArea=MAIN.Get_Area(raid.latitude,raid.longitude);
  if(!raidArea){ raidArea='None'; console.error('NO RAID AREA',raid); }

  // DETERMINE GYM CONTROL
  switch(raid.team_id){
    case 1: defendingTeam=MAIN.emotes.teams.mystic+' Gym'; break;
    case 2: defendingTeam=MAIN.emotes.teams.valor+' Gym'; break;
    case 3: defendingTeam=MAIN.emotes.teams.instinct+' Gym'; break;
    default: defendingTeam='Uncontested Gym';
  }

  // GET RAID LEVEL
  switch(raid.level){
    case 1:
    case 2: embedColor='f358fb'; break;
    case 3:
    case 4: embedColor='ffd300'; break;
    case 5: embedColor='5b00de'; break;
  }

  // CHECK IF SPONSORED GYM
  if(raid.sponsor_id==true){ raidSponsored=' | '+MAIN.emotes.ex_pass+' Eligible'; }

  // CHECK FOR GYM NAME
  if(!raid.gym_name){ gymName='No Name'; }
  else{ gymName=raid.gym_name; }

  // DETERMINE IF IT'S AN EGG OR A RAID
  switch(raid.cp){

    // RAID IS AN EGG
    case 0:
      raidType='egg';

      // CREATE THE EGG EMBED
      raidEmbed=new Discord.RichEmbed().setThumbnail(raid.url).setColor(embedColor)
        .addField(raid.gym_name, raidArea.name, false)
        .addField('Hatches: '+hatchTime+' (*'+hatchMinutes+' Mins*)', 'Level '+raid.level+' | '+defendingTeam+raidSponsored, false)
        .addField('Directions:','[Google Maps](https://www.google.com/maps?q='+raid.latitude+','+raid.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+raid.latitude+','+raid.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+raid.latitude+','+raid.longitude+'&navigate=yes)',false);

      send_to_discord(MAIN, raidEmbed, raidType, raid, city); break;

    // RAID IS A BOSS
    default:
      raidType='boss';

      // GET THE RAID BOSS SPRITE
      let raidUrl=MAIN.Get_Sprite(raid.form, raid.pokemon_id);

      // GET THE BOSS MOVESET
      if(!MAIN.moves[raid.move_1].name){ console.error('Move ID #'+raid.move_1+' not found in pokemon.json'); }
      if(!MAIN.moves[raid.move_2].name){ console.error('Move ID #'+raid.move_2+' not found in pokemon.json'); }

      // CREATE THE RAID EMBED
      raidEmbed=new Discord.RichEmbed().setThumbnail(raidUrl).setColor(embedColor)
        .addField('**'+MAIN.pokemon[raid.pokemon_id]+'** has taken over a Gym!', moves[raid.move_1].name+'/'+moves[raid.move_2].name, false)
        .addField(gymName, raidArea.name, false)
        .addField('Raid Ends: '+endTime+' (*'+endMinutes+' Mins*)', 'Level '+raid.level+' | '+defendingTeam+raidSponsored, false)
        .addField('Directions:','[Google Maps](https://www.google.com/maps?q='+raid.latitude+','+raid.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+raid.latitude+','+raid.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+raid.latitude+','+raid.longitude+'&navigate=yes)',false);

      send_to_discord(MAIN, raidEmbed, raidType, raid, city);
  }



  // SEND TO THE SUBSCRIPTION MODULE
  if(MAIN.rConfig.Subscriptions=='ENABLED'){

  }

  // END
  return;
}

function send_to_discord(MAIN, raidEmbed, raidType, raid, city){
  // CHECK EACH FEED IN THE RAID ARRAY
  if(MAIN.rConfig.Discord_Feeds=='ENABLED'){
    MAIN.feeds.forEach((feed,index) => {

      // ONLY LOOK AT FEEDS MARKED AS RAIDS
      if(feed.Type=='raid'){

        // FILTER FOR EGG OR RAID AND CITY
        if(feed.Egg_Or_Boss==raidType && city.name==feed.City){

          // FILTER FOR RAID LEVEL
          if(feed.Raid_Levels.indexOf(raid.level)>=0){

            // CHECK FOR EX ELIGIBLE REQUIREMENT
            if(feed.Ex_Eligible==undefined){
              if(MAIN.logging=='ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Sent a Raid '+raidType+' for '+city.name+'.'); }
              MAIN.Send_Embed(raidEmbed,feed.Channel_ID);
            }
            else if(feed.Ex_Eligible==raid.sponsor_id){
              if(MAIN.logging=='ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Sent a Raid '+raidType+' for '+city.name+'.'); }
              MAIN.Send_Embed(raidEmbed,feed.Channel_ID);
            }
          }
        }
      }
    });
  }
}
