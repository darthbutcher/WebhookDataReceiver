const Discord = require('discord.js');

module.exports.run = async (MAIN, message, nest, server, embed_area, timezone, embed) => {
  let Embed_Config = require('../../embeds/'+embed);

  // CHECK IF THE TARGET IS A USER
  let guild = MAIN.guilds.get(message.guild.id);
  let member = MAIN.guilds.get(server.id).members.get(message.author.id);
  let pokemon = {type: '', color: '', form: '', area: embed_area}, role_id = '';

  // DETERMINE POKEMON NAME AND FORM
  pokemon.name = MAIN.masterfile.pokemon[nest.pokemon_id].name;
  let form = 0;

  // GET STATIC MAP TILE
  if(MAIN.config.Map_Tiles == 'ENABLED'){
    pokemon.map_img = await MAIN.Static_Map_Tile(nest.lat, nest.lon, 'pokemon');
  }

  // DEFINE VARIABLES
  pokemon.time = await MAIN.Bot_Time(nest.updated, 'nest', timezone);
  pokemon.avg = nest.pokemon_avg;

  // GET POKEMON TYPE(S), EMOTE AND COLOR
  MAIN.masterfile.pokemon[nest.pokemon_id].types.forEach((type) => {
    pokemon.type += MAIN.emotes[type.toLowerCase()]+' '+type+' / ';
    pokemon.color = MAIN.Get_Color(type, pokemon.color);
  }); pokemon.type = pokemon.type.slice(0,-3);

  // GET SPRITE IMAGE
  pokemon.sprite = await MAIN.Get_Sprite(form, nest.pokemon_id);
  pokemon.map_url = MAIN.config.FRONTEND_URL;
  pokemon.nest_name = nest.name;
  if (nest.nest_submitted_by !== null){
    pokemon.submitter = nest.nest_submitted_by;
  } else {
    pokemon.submitter = 'Map Scanned';
  }

  nest_embed = Embed_Config(pokemon);
  if(server.spam_channels.indexOf(message.channel.id) >= 0){
    return MAIN.Send_Embed('nest', 0, server, role_id, nest_embed, message.channel.id);
  } else {
    guild.fetchMember(message.author.id).then( TARGET => {
      return TARGET.send(nest_embed).catch(console.error); });
  }
}
