const Discord = require('discord.js');

module.exports.run = async (MAIN, target, sighting, internal_value, time_now, main_area, sub_area, embed_area, server, timezone) => {

  // CHECK IF THE TARGET IS A USER
  let member = MAIN.guilds.get(server.id).members.get(target.user_id);

  // GET STATIC MAP TILE
  let img_url = '';
  if(MAIN.config.Map_Tiles == 'ENABLED'){
    img_url = await MAIN.Static_Map_Tile(sighting.latitude, sighting.longitude, 'pokemon');
  }

  if(MAIN.debug.Pokemon=='ENABLED' && server.name == MAIN.debug.Target){ console.info('[DEBUG] [pokemon.js] Retrieved map tile for Pokemon '+server.name+'.'); }

  // DEFINE VARIABLES
  let hide_time = await MAIN.Bot_Time(sighting.disappear_time, '1', timezone);
  let hide_mins = Math.floor((sighting.disappear_time-(time_now/1000))/60);
  let hide_secs = Math.floor((sighting.disappear_time-(time_now/1000)) - (hide_mins*60));

  // DETERMINE MOVE NAMES AND TYPES
  let move_name_1 = MAIN.moves[sighting.move_1].name;
  let move_type_1 = await MAIN.Get_Type(sighting.move_1);
  let move_name_2 = MAIN.moves[sighting.move_2].name;
  let move_type_2 = await MAIN.Get_Type(sighting.move_2);

  // DETERMINE POKEMON NAME AND DETAILS
  let pokemon_name = MAIN.pokemon[sighting.pokemon_id].name;
  let height = 'Height: '+Math.floor(sighting.height*100)/100+'m';
  let weight = 'Weight: '+Math.floor(sighting.weight*100)/100+'kg';

  // GET POKEMON TYPE(S) AND EMOTE
  let pokemon_type = '';
  MAIN.pokemon[sighting.pokemon_id].types.forEach((type) => {
    pokemon_type += type+' '+MAIN.emotes[type.toLowerCase()]+' / ';
  }); pokemon_type = pokemon_type.slice(0,-3);

  // GET SPRITE IMAGE
  let pokemon_url = await MAIN.Get_Sprite(sighting.form, sighting.pokemon_id);

  // GET GENDER
  let gender = '';
  switch(sighting.gender){
    case 1: gender = ' | ♂Male'; break;
    case 2: gender = ' | ♀Female'; break;
  }

  // DESPAWN VERIFICATION
  let verified = sighting.disappear_time_verified ? MAIN.emotes.checkYes : MAIN.emotes.yellowQuestion;

  // GET WEATHER BOOST
  let weather_boost = '';
  switch(sighting.weather){
    case 1: weather_boost = ' | '+MAIN.emotes.clear+' *Boosted*'; break;
    case 2: weather_boost = ' | '+MAIN.emotes.rain+' *Boosted*'; break;
    case 3: weather_boost = ' | '+MAIN.emotes.partlyCloudy+' *Boosted*'; break;
    case 4: weather_boost = ' | '+MAIN.emotes.cloudy+' *Boosted*'; break;
    case 5: weather_boost = ' | '+MAIN.emotes.windy+' *Boosted*'; break;
    case 6: weather_boost = ' | '+MAIN.emotes.snow+' *Boosted*'; break;
    case 7: weather_boost = ' | '+MAIN.emotes.fog+' *Boosted*'; break;
  }

  // CREATE AND SEND THE EMBED
  let pokemon_embed = new Discord.RichEmbed()
    .setColor('00ccff')
    .setThumbnail(pokemon_url)
    .setImage(img_url)
    .setTitle(pokemon_name+' '+sighting.individual_attack+'/'+sighting.individual_defense+'/'+sighting.individual_stamina+' ('+internal_value+'%) (*'+hide_mins+'m '+hide_secs+'s*)')
    .addField('Level '+sighting.pokemon_level+' | CP '+sighting.cp+gender, height+' | '+weight, false)
    .addField('Disappears: '+hide_time+' (*'+hide_mins+'m '+hide_secs+'s*) '+verified, move_name_1+' '+move_type_1+' / '+move_name_2+' '+move_type_2+'\n'+pokemon_type+weather_boost, false)
    .addField(embed_area+' | Directions:','[Google Maps](https://www.google.com/maps?q='+sighting.latitude+','+sighting.longitude+') | '
                                         +'[Apple Maps](http://maps.apple.com/maps?daddr='+sighting.latitude+','+sighting.longitude+'&z=10&t=s&dirflg=w) | '
                                         +'[Waze](https://waze.com/ul?ll='+sighting.latitude+','+sighting.longitude+'&navigate=yes)', false);

  if(member){
    if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Embed] [pokemon.js] Sent a '+pokemon_name+' to '+member.user.tag+' ('+member.id+').'); }
    return MAIN.Send_DM(server.id, member.id, pokemon_embed, target.bot);
  } else if(MAIN.config.POKEMON.Discord_Feeds == 'ENABLED'){
    if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Embed] [pokemon.js] Sent a '+pokemon_name+' to '+target.guild.name+' ('+target.id+').'); }
    return MAIN.Send_Embed(pokemon_embed, target.id);
  } else{ return; }

}
