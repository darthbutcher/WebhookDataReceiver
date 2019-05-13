const Discord = require('discord.js');
const Embed_Config = require('../../config/embed_nests.js');

module.exports.run = async (MAIN, target, nest, server, embed_area, timezone) => {
  MAIN.pdb.query(`SELECT * FROM users WHERE user_id = ?`, [target.author.id], function (error, user, fields){
    user.forEach(async function(user) {
      // CHECK IF THE TARGET IS A USER
      let member = MAIN.guilds.get(server.id).members.get(target.author.id);
      let role_id ='';

      // GET STATIC MAP TILE
      let img_url = '';
      if(MAIN.config.Map_Tiles == 'ENABLED'){
        img_url = await MAIN.Static_Map_Tile(nest.lat, nest.lon, 'pokemon');
      }

      // DETERMINE POKEMON NAME AND FORM
      let pokemon_name = MAIN.pokemon[nest.pokemon_id].name;
      let form = 0; let form_name = '';

      // DEFINE VARIABLES
      let submit_time = await MAIN.Bot_Time(nest.updated, 'nest', timezone);
      let pokemon_avg = nest.pokemon_avg;

      // GET POKEMON TYPE(S), EMOTE AND COLOR
      let pokemon_type = '', pokemon_color = '';
      MAIN.pokemon[nest.pokemon_id].types.forEach((type) => {
        pokemon_type += MAIN.emotes[type.toLowerCase()]+' '+type+' / ';
        switch (type.toLowerCase()) {
          case 'fairy':
          pokemon_color = 'e898e8';
          break;
          case 'ghost':
          pokemon_color = '705898';
          break;
          case 'grass':
          pokemon_color = '78c850';
          break;
          case 'water':
          pokemon_color = '6890f0';
          break;
          case 'bug':
          pokemon_color = 'a8b820';
          break;
          case 'fighting':
          pokemon_color = 'c03028';
          break;
          case 'electric':
          pokemon_color = 'f8d030';
          break;
          case 'rock':
          pokemon_color = 'b8a038';
          break;
          case 'fire':
          pokemon_color = 'f08030';
          break;
          case 'flying':
          pokemon_color = 'a890f0';
          break;
          case 'ice':
          pokemon_color = '98d8d8';
          break;
          case 'ground':
          pokemon_color = 'e0c068';
          break;
          case 'steel':
          pokemon_color = 'b8b8d0';
          break;
          case 'dragon':
          pokemon_color = '7038f8';
          break;
          case 'poison':
          pokemon_color = 'a040a0';
          break;
          case 'psychic':
          pokemon_color = 'f85888';
          break;
          case 'dark':
          pokemon_color = '705848';
          break;
          case 'normal':
          default:
          pokemon_color = '8a8a59';
          break;
        }
      }); pokemon_type = pokemon_type.slice(0,-3);

      // GET SPRITE IMAGE
      let pokemon_url = await MAIN.Get_Sprite(form, nest.pokemon_id);
      let map_url = MAIN.config.FRONTEND_URL;
      let nest_name = nest.name;
      let submitter = '';
      if (nest.nest_submitted_by !== null){
        submitter = nest.nest_submitted_by;
      } else {
        submitter = 'Map Scanned';
      }

      nest_embed = Embed_Config(pokemon_name,form_name,pokemon_type,pokemon_color,pokemon_avg,submit_time,nest_name,submitter,nest.lat,nest.lon,embed_area,map_url,img_url,pokemon_url);
      //MAIN.Send_Embed('nest', 0, server, role_id, nest_embed, target.channel.id);
      return MAIN.Send_DM(user.discord_id, user.user_id,nest_embed, user.bot);
    })
  });
}
