const Discord=require('discord.js');
const moves=require('../static/moves.json');
const feeds=[];

for(let f=1; f<7; f++){
  let feed=require('../config/feed_'+f+'.json');
  feeds.push(feed);
}

//#############################################################//
//#############################################################//
//#####   _____   ____  _  ________ __  __  ____  _   _   #####//
//#####  |  __ \ / __ \| |/ /  ____|  \/  |/ __ \| \ | |  #####//
//#####  | |__) | |  | | ' /| |__  | \  / | |  | |  \| |  #####//
//#####  |  ___/| |  | |  < |  __| | |\/| | |  | | . ` |  #####//
//#####  | |    | |__| | . \| |____| |  | | |__| | |\  |  #####//
//#####  |_|     \____/|_|\_\______|_|  |_|\____/|_| \_|  #####//
//#####      POKEMON WEBHOOKS AND DM SUBSCRIPTIONS        #####//
//#############################################################//
//#############################################################//

module.exports.run = async (MAIN, sighting, city) => {

  // EStABLISH SIGHTING VARIABLES
  let timeNow=new Date().getTime(), pName=MAIN.pokemon[sighting.pokemon_id];
  let internalValue=(sighting.individual_defense+sighting.individual_stamina+sighting.individual_attack)/45;
  internalValue=Math.floor(internalValue*1000)/10;

  // CHECK ALL FILTERS
  feeds.forEach((feed,index) => {
    if(!feed[pName]) console.error('[Pokébot] NO POKEMON FOUND WITHIN filter_'+(index+1)+'. '+pName+sighting.gender);
    if(feed.Channel_ID && feed[pName]!='False'){

      // CHECK IF POKEMON IS ENABLED OR SET TO A SPECIFIC IV
      if(feed[pName]=='True'){

        // CHECK IF THE POKEMON HAS BEEN IV SCANNED
        if(sighting.cp>0){

          // CHECK THE MIN AND MAX IV SET FOR THE ENTIRE FEED
          if(feed.min_iv<=internalValue && feed.max_iv>=internalValue){
            parse_Pokemon(MAIN, internalValue ,sighting, feed.Channel_ID, timeNow, city);
          }
        }
        else if(feed.Post_Without_IV==true){
          send_Without_IV(MAIN, sighting, feed.Channel_ID, time, city);
        }
      }
      else if(feed[pName].min_iv<=internalValue && feed.max_iv>=internalValue){

        // CHECK IF THE POKEMON HAS BEEN IV SCANNED OR TO POST WITHOUT IV
        if(sighting.cp>0){
          parse_Pokemon(MAIN, internalValue, sighting, feed.Channel_ID, timeNow, city);
        }
        else if(feed.Post_Without_IV==true){
          sendWithoutIV(MAIN, sighting, feed.Channel_ID, time, city);
        }
      }
    }
  }); return;
}

function parse_Pokemon(MAIN, iv, sighting, channelID, time, city){
  // SEND LOGS
  if(MAIN.debug.pokemon=='ENABLED'){ if(MAIN.debug.detailed=='ENABLED'){ console.info(sighting); } else{ console.info(sighting.encounter_id); } }

  // DEFINE VARIABLES
  let dTime=MAIN.Bot_Time(sighting.disappear_time,'1'),
  dMinutes=Math.floor((sighting.disappear_time-(time/1000))/60),
  pokeIV=Math.floor(sighting.iv*10)/10, weather='', area='';

  // GET SPRITE IMAGE
  let pokemonUrl=MAIN.Get_Sprite(sighting.form, sighting.pokemon_id);

  // GET THE GENERAL AREA
  let pokemonArea=MAIN.Get_Area(sighting.latitude,sighting.longitude);

  // GET GENDER
  let gender=MAIN.Get_Gender(sighting.gender);

  // GET WEATHER BOOST
  switch(sighting.weather){
    case 1: weather=' | '+MAIN.emotes.weather.clear+' *Boosted*'; break;
    case 2: weather=' | '+MAIN.emotes.weather.rain+' *Boosted*'; break;
    case 3: weather=' | '+MAIN.emotes.weather.partly_cloudy+' *Boosted*'; break;
    case 4: weather=' | '+MAIN.emotes.weather.mostly_cloudy+' *Boosted*'; break;
    case 5: weather=' | '+MAIN.emotes.weather.windy+' *Boosted*'; break;
    case 6: weather=' | '+MAIN.emotes.weather.snow+' *Boosted*'; break;
    case 7: weather=' | '+MAIN.emotes.weather.fog+' *Boosted*'; break;
  }

  // CREATE AND SEND THE EMBED
  let pokemonEmbed=new Discord.RichEmbed().setColor('00ccff').setThumbnail(pokemonUrl)
    .addField(MAIN.pokemon[sighting.pokemon_id]+' '+sighting.individual_attack+'/'+sighting.individual_defense+'/'+sighting.individual_stamina+' ('+iv+'%)', 'Level '+sighting.pokemon_level+weather+'\nCP '+sighting.cp+gender+'\n'+moves[sighting.move_1].name+'/'+moves[sighting.move_2].name, false)
    .addField('Disappears: '+dTime+' (*'+dMinutes+' Mins*)', pokemonArea.name, false)
    .addField('Directions:','[Google Maps](https://www.google.com/maps?q='+sighting.latitude+','+sighting.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+sighting.latitude+','+sighting.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+sighting.latitude+','+sighting.longitude+'&navigate=yes)')
    .setImage('https://maps.googleapis.com/maps/api/staticmap?center='+sighting.latitude+','+sighting.longitude+'&markers='+sighting.latitude+','+sighting.longitude+'&size=450x220&zoom=16');

  // MORE LOGS
  if(MAIN.logging=='ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Sent a Pokémon for '+city.name+'.'); }

  // SEND EMBED TO FEEDS
  if(MAIN.pConfig.Discord_Feeds=='ENABLED'){
    MAIN.Send_Embed(pokemonEmbed, channelID);
  }

  // SEND TO SUBSCRIPTIONS MODULE
  if(MAIN.pConfig.Subscriptions=='ENABLED'){
    // parse_Subscription('sighting', sighting, pokemonEmbed, pokemonArea, city);
  }

  // END
  return;
}

function send_Without_IV(MAIN, sighting, channelID, time, city){

  // GET GENDER
  let gender=MAIN.Get_Gender(sighting.gender);

  // CREATE AND SEND EMBED
  let pokemonEmbed=new Discord.RichEmbed().setColor('00ccff').setThumbnail(pokemonUrl)
    .addField('A Wild **'+MAIN.pokemon[sighting.pokemon_id]+'** has appeared!', gender, false)
    .addField('Disappears: '+dTime+' (*'+dMinutes+' Mins*)', pokemonArea.name, false)
    .addField('Directions:','[Google Maps](https://www.google.com/maps?q='+sighting.latitude+','+sighting.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+sighting.latitude+','+sighting.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+sighting.latitude+','+sighting.longitude+'&navigate=yes)')
    .setImage('https://maps.googleapis.com/maps/api/staticmap?center='+sighting.latitude+','+sighting.longitude+'&markers='+sighting.latitude+','+sighting.longitude+'&size=450x220&zoom=16');
  MAIN.Send_Embed(pokemonEmbed, channelID);
}
