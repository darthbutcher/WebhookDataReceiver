const Discord=require('discord.js');
const moves=require('../static/moves.json');
const emote=require('../config/emotes.json');

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

module.exports.run = async (MAIN, sighting) => {

  let channelID='', timeNow=new Date().getTime(),
  internalValue=(sighting.individual_defense+sighting.individual_stamina+sighting.individual_attack)/45;
  internalValue=Math.floor(internalValue*1000)/10;

  // FILTER INTERNAL VALUES AND FOR RARITY
  switch(true){
    case sighting.cp==0: return;
    case sighting.cp==null: return;
    case internalValue==100: parse_Pokemon(MAIN, internalValue ,sighting, MAIN.feed.CHANNELS.pokemon.HUNDRED_IV, timeNow); break;
    case internalValue>=80: parse_Pokemon(MAIN, internalValue, sighting, MAIN.feed.CHANNELS.pokemon.EIGHTY_TO_NINETYNINE_IV, timeNow); break;
    case internalValue==0: parse_Pokemon(MAIN, internalValue, sighting, MAIN.feed.CHANNELS.pokemon.ZERO_IV, timeNow); break;
  }

  switch(true){
    case sighting.pokemon_level>34: parse_Pokemon(MAIN, internalValue, sighting, MAIN.feed.CHANNELS.pokemon.max_level, timeNow); break;
    case sighting.cp==0: return;
    case sighting.cp==null: return;
    case MAIN.feed.POKEMON_LISTS.candy.indexOf(sighting.pokemon_id)>=0: parse_Pokemon(MAIN, internalValue, sighting, MAIN.feed.CHANNELS.pokemon.candy, timeNow); break;
    case MAIN.feed.POKEMON_LISTS.uber.indexOf(sighting.pokemon_id)>=0: parse_Pokemon(MAIN, internalValue, sighting, MAIN.feed.CHANNELS.pokemon.uber, timeNow); break;
  }
}

function parse_Pokemon(MAIN, iv, sighting, channelID, time){

  if(MAIN.debug.pokemon=='ENABLED'){ if(MAIN.debug.detailed=='ENABLED'){ console.info(sighting); } else{ console.info(sighting.encounter_id); } }

  let dTime=MAIN.Bot_Time(sighting.disappear_time,'1'),
  dMinutes=Math.floor((sighting.disappear_time-(time/1000))/60),
  pokeIV=Math.floor(sighting.iv*10)/10, pokemonUrl='', weather='', area='', gender='';

  // GET SPRITE IMAGE
  pokemonUrl=MAIN.Get_Sprite(sighting.form, sighting.pokemon_id);

  // GET THE GENERAL AREA
  let pokemonArea=MAIN.Get_Area(sighting.latitude,sighting.longitude);

  // GET WEATHER BOOST
  switch(sighting.weather){
    case 1: weather=' | '+emote.weather.clear+' *Boosted*'; break;
    case 2: weather=' | '+emote.weather.rain+' *Boosted*'; break;
    case 3: weather=' | '+emote.weather.partly_cloudy+' *Boosted*'; break;
    case 4: weather=' | '+emote.weather.mostly_cloudy+' *Boosted*'; break;
    case 5: weather=' | '+emote.weather.windy+' *Boosted*'; break;
    case 6: weather=' | '+emote.weather.snow+' *Boosted*'; break;
    case 7: weather=' | '+emote.weather.fog+' *Boosted*'; break;
  }

  // GET GENDER
  switch(sighting.gender){
    case 1: gender=' | ♂Male'; break;
    case 2: gender=' | ♀Female'; break;
  }

  // CREATE AND SEND THE EMBED
  let pokemonEmbed=new Discord.RichEmbed().setColor('00ccff').setThumbnail(pokemonUrl)
    .addField(MAIN.pokemon[sighting.pokemon_id]+' '+sighting.individual_attack+'/'+sighting.individual_defense+'/'+sighting.individual_stamina+' ('+iv+'%)', 'Level '+sighting.pokemon_level+weather+'\nCP '+sighting.cp+gender+'\n'+moves[sighting.move_1].name+'/'+moves[sighting.move_2].name, false)
    .addField('Disappears: '+dTime+' (*'+dMinutes+' Mins*)', pokemonArea.name, false)
    .addField('Directions:','[Google Maps](https://www.google.com/maps?q='+sighting.latitude+','+sighting.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+sighting.latitude+','+sighting.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+sighting.latitude+','+sighting.longitude+'&navigate=yes)')
    .setImage('https://maps.googleapis.com/maps/api/staticmap?center='+sighting.latitude+','+sighting.longitude+'&markers='+sighting.latitude+','+sighting.longitude+'&size=450x220&zoom=16');

  if(MAIN.logging=='ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Sent a Pokémon.'); }


  if(MAIN.pConfig.Discord_Feeds=='ENABLED'){
    MAIN.Send_Embed(pokemonEmbed, channelID);
  }

  if(MAIN.pConfig.Subscriptions=='ENABLED'){
    // parse_Subscription('sighting', sighting, pokemonEmbed, pokemonArea);
  }

  // END
  return;
}
