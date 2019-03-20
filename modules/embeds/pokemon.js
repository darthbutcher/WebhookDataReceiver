const Discord = require('discord.js');

module.exports.run = async (MAIN, has_iv, target, sighting, internal_value, time_now, main_area, sub_area, embed_area, server, timezone) => {

  // CHECK IF THE TARGET IS A USER
  let member = MAIN.guilds.get(server.id).members.get(target.user_id);

  // GET STATIC MAP TILE
  let img_url = '';
  if(MAIN.config.Map_Tiles == 'ENABLED'){
    img_url = await MAIN.Static_Map_Tile(sighting.latitude, sighting.longitude, 'pokemon');
  }

  // DETERMINE POKEMON NAME
  let pokemon_name = MAIN.pokemon[sighting.pokemon_id].name;

  // DEFINE VARIABLES
  let hide_time = await MAIN.Bot_Time(sighting.disappear_time, '1', timezone);
  let hide_mins = Math.floor((sighting.disappear_time-(time_now/1000))/60);
  let hide_secs = Math.floor((sighting.disappear_time-(time_now/1000)) - (hide_mins*60));

  // GET POKEMON TYPE(S) AND EMOTE
  let pokemon_type = '';
  MAIN.pokemon[sighting.pokemon_id].types.forEach((type) => {
    pokemon_type += MAIN.emotes[type.toLowerCase()]+' '+type+' / ';
  }); pokemon_type = pokemon_type.slice(0,-3);

  // GET SPRITE IMAGE
  let pokemon_url = await MAIN.Get_Sprite(sighting.form, sighting.pokemon_id);

  // GET GENDER
  let gender = '';
  switch(sighting.gender){
    case 1: gender = ' '+MAIN.emotes.male; break;
    case 2: gender = ' '+MAIN.emotes.female; break;
  }
  // Round IV
  internal_value = Math.round(internal_value);

  // GET ROLEID
  let roleID = '';
  if (internal_value == 100){ roleID = '@everyone'; } else { roleID = ''; }

  // DESPAWN VERIFICATION
  let verified = sighting.disappear_time_verified ? MAIN.emotes.checkYes : MAIN.emotes.yellowQuestion;

  // GET WEATHER BOOST
  let weather_boost = '';
  switch(sighting.weather){
    case 1: weather_boost = ' | '+MAIN.emotes.clear+' ***Boosted***'; break;
    case 2: weather_boost = ' | '+MAIN.emotes.rain+' ***Boosted***'; break;
    case 3: weather_boost = ' | '+MAIN.emotes.partlyCloudy+' ***Boosted***'; break;
    case 4: weather_boost = ' | '+MAIN.emotes.cloudy+' ***Boosted***'; break;
    case 5: weather_boost = ' | '+MAIN.emotes.windy+' ***Boosted***'; break;
    case 6: weather_boost = ' | '+MAIN.emotes.snow+' ***Boosted***'; break;
    case 7: weather_boost = ' | '+MAIN.emotes.fog+' ***Boosted***'; break;
  }

  let pokemon_embed = new Discord.RichEmbed()
    .setImage(img_url)
    .setColor('00ccff')
    .setThumbnail(pokemon_url)
  if(has_iv == false){
    pokemon_embed
      .addField(pokemon_name+gender,verified+': '+hide_time+' (*'+hide_mins+'m '+hide_secs+'s*)\n'+pokemon_type+weather_boost)
      .addField(embed_area+' | Directions:','[Google Maps](https://www.google.com/maps?q='+sighting.latitude+','+sighting.longitude+') | '
                                           +'[Apple Maps](http://maps.apple.com/maps?daddr='+sighting.latitude+','+sighting.longitude+'&z=10&t=s&dirflg=d) | '
                                           +'[Waze](https://waze.com/ul?ll='+sighting.latitude+','+sighting.longitude+'&navigate=yes) | '
                                           +'[Scan Map]('+MAIN.config.FRONTEND_URL+'?lat='+sighting.latitude+'&lon='+sighting.longitude+'&zoom=15)',false);
  } else{

    // DETERMINE MOVE NAMES AND TYPES
    let move_name_1 = MAIN.moves[sighting.move_1].name;
    let move_type_1 = MAIN.emotes[MAIN.moves[sighting.move_1].type.toLowerCase()];
    let move_name_2 = MAIN.moves[sighting.move_2].name;
    let move_type_2 = MAIN.emotes[MAIN.moves[sighting.move_2].type.toLowerCase()];

    // DETERMINE HEIGHT AND WEIGHT
    let height = 'Height: '+Math.floor(sighting.height*100)/100+'m';
    let weight = 'Weight: '+Math.floor(sighting.weight*100)/100+'kg';

    pokemon_embed
      .addField(pokemon_name+' '+sighting.individual_attack+'/'+sighting.individual_defense+'/'+sighting.individual_stamina+' ('+internal_value+'%)\n'
               +'Level '+sighting.pokemon_level+' | CP '+sighting.cp+gender, height+' | '+weight+'\n'+move_name_1+' '+move_type_1+' / '+move_name_2+' '+move_type_2, false)
      .addField(verified+': '+hide_time+' (*'+hide_mins+'m '+hide_secs+'s*) ', pokemon_type+weather_boost, false)
      .addField(embed_area+' | Directions:','[Google Maps](https://www.google.com/maps?q='+sighting.latitude+','+sighting.longitude+') | '
                                           +'[Apple Maps](http://maps.apple.com/maps?daddr='+sighting.latitude+','+sighting.longitude+'&z=10&t=s&dirflg=d) | '
                                           +'[Waze](https://waze.com/ul?ll='+sighting.latitude+','+sighting.longitude+'&navigate=yes) | '
                                           +'[Scan Map]('+MAIN.config.FRONTEND_URL+'?lat='+sighting.latitude+'&lon='+sighting.longitude+'&zoom=15)',false);
  }

  if(member){
    if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Embed] [pokemon.js] Sent a '+pokemon_name+' to '+member.user.tag+' ('+member.id+').'); }
    return MAIN.Send_DM(server.id, member.id, pokemon_embed, target.bot);
  } else if(MAIN.config.POKEMON.Discord_Feeds == 'ENABLED'){
    if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Embed] [pokemon.js] Sent a '+pokemon_name+' to '+target.guild.name+' ('+target.id+').'); }
    return MAIN.Send_Embed('pokemon', 0, roleID, pokemon_embed, target.id);
  } else{ return; }

}
