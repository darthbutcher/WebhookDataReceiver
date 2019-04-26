const Discord = require('discord.js');
const Embed_Config = require('../../config/embed_pokemon.js');
const Embed_IVConfig = require('../../config/embed_pokemon_iv.js');

module.exports.run = async (MAIN, has_iv, target, sighting, internal_value, time_now, main_area, sub_area, embed_area, server, timezone, role_id) => {

  // CHECK IF THE TARGET IS A USER
  let member = MAIN.guilds.get(server.id).members.get(target.user_id);

  // GET STATIC MAP TILE
  let img_url = '';
  if(MAIN.config.Map_Tiles == 'ENABLED'){
    img_url = await MAIN.Static_Map_Tile(sighting.latitude, sighting.longitude, 'pokemon');
  }

  // DETERMINE POKEMON NAME AND FORM
  let pokemon_name = MAIN.pokemon[sighting.pokemon_id].name;
  form = sighting.form;
  let form_name = '';
  if (form > 0){
    form_name = '['+MAIN.forms[sighting.pokemon_id][form]+'] ';
  }

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
  let map_url = MAIN.config.FRONTEND_URL;

  // GET GENDER
  let gender = '';
  switch(sighting.gender){
    case 1: gender = ' '+MAIN.emotes.male; break;
    case 2: gender = ' '+MAIN.emotes.female; break;
  }
  // Round IV
  internal_value = Math.round(internal_value);

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

  if(has_iv == false || (sighting.cp == null && MAIN.config.POKEMON.sub_without_iv == 'ENABLED')){

  pokemon_embed = Embed_Config(pokemon_name,form_name,pokemon_type,gender,weather_boost,verified,hide_time,hide_mins,hide_secs,sighting.latitude,sighting.longitude,map_url,img_url,pokemon_url,embed_area);

  send_embed();
  } else{

    if(sighting.cp == null){ return; }
    // DETERMINE MOVE NAMES AND TYPES
    let move_name_1 = MAIN.moves[sighting.move_1].name;
    let move_type_1 = MAIN.emotes[MAIN.moves[sighting.move_1].type.toLowerCase()];
    let move_name_2 = MAIN.moves[sighting.move_2].name;
    let move_type_2 = MAIN.emotes[MAIN.moves[sighting.move_2].type.toLowerCase()];

    // DETERMINE HEIGHT AND WEIGHT
    let height = Math.floor(sighting.height*100)/100;
    let weight = Math.floor(sighting.weight*100)/100;

    // DETERMINE SIZE
    let size = '';
    size = MAIN.Get_Size(sighting.pokemon_id, sighting.height, sighting.weight);

    // VERIFY VERIFICATION FOR IV SCAN
    if (verified == MAIN.emotes.yellowQuestion) {
      MAIN.rdmdb.query('SELECT * FROM pokemon WHERE id = ?', [sighting.encounter_id], function (error, record, fields) {
        if(error){ console.error(error); }
        veri = verified;
        time = hide_time;
        mins = hide_mins;
        secs = hide_secs;
        if (record[0].expire_timestamp_verified == 1) {
          if(MAIN.config.DEBUG.Pokemon == 'ENABLED'){console.log('DESPAWN for '+pokemon_name+' is verified');}
          time = MAIN.Bot_Time(record[0].expire_timestamp, '1', timezone);
          mins = Math.floor((record[0].expire_timestamp-(time_now/1000))/60);
          secs = Math.floor((record[0].expire_timestamp-(time_now/1000)) - (mins*60));
          veri = MAIN.emotes.checkYes;
        } else {
          if(MAIN.config.DEBUG.Pokemon == 'ENABLED'){console.log('DESPAWN for '+pokemon_name+' is not verified');}
        }
        pokemon_embed = Embed_IVConfig(pokemon_name,form_name,pokemon_type,sighting.individual_attack,sighting.individual_defense,sighting.individual_stamina,internal_value,sighting.pokemon_level,sighting.cp,gender,height,weight,size,move_name_1,move_type_1,move_name_2,move_type_2,weather_boost,veri,time,mins,secs,sighting.latitude,sighting.longitude,map_url,img_url,pokemon_url,embed_area);
        send_embed();
      });
    } else {
      pokemon_embed = Embed_IVConfig(pokemon_name,form_name,pokemon_type,sighting.individual_attack,sighting.individual_defense,sighting.individual_stamina,internal_value,sighting.pokemon_level,sighting.cp,gender,height,weight,size,move_name_1,move_type_1,move_name_2,move_type_2,weather_boost,verified,hide_time,hide_mins,hide_secs,sighting.latitude,sighting.longitude,map_url,img_url,pokemon_url,embed_area);
      send_embed();
    }
  }

  function send_embed(){
  if(member){
    if(MAIN.config.DEBUG.Pokemon == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Embed] [pokemon.js] Sent a '+pokemon_name+' to '+member.user.tag+' ('+member.id+').'); }
    return MAIN.Send_DM(server.id, member.id, pokemon_embed, target.bot);
  } else if(MAIN.config.POKEMON.Discord_Feeds == 'ENABLED'){
    if(MAIN.config.DEBUG.Pokemon == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Embed] [pokemon.js] Sent a '+pokemon_name+' to '+target.guild.name+' ('+target.id+').'); }
    return MAIN.Send_Embed('pokemon', 0, server, role_id, pokemon_embed, target.id);
  } else{ return; }}

}
