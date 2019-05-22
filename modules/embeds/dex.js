const Discord = require('discord.js');

module.exports.run = async (MAIN, message, pokemon_id, server) => {
      // CHECK IF THE TARGET IS A USER
      let member = MAIN.guilds.get(server.id).members.get(message.author.id);
      let guild = MAIN.guilds.get(message.guild.id);
      let role_id = '';

      // DETERMINE POKEMON NAME AND FORM
      let pokemon_name = MAIN.pokemon[pokemon_id].name;
      let attack = MAIN.base_stats[pokemon_id].attack;
      let defense = MAIN.base_stats[pokemon_id].defense;
      let stamina = MAIN.base_stats[pokemon_id].stamina;
      let form = 0; let form_name = '';

      // GET POKEMON TYPE(S), EMOTE AND COLOR
      let pokemon_type = '', weaknesses = '', pokemon_color = '', evolutions = pokemon_name;
      MAIN.pokemon[pokemon_id].types.forEach((type) => {
        pokemon_type += MAIN.emotes[type.toLowerCase()]+' '+type+' / ';
        MAIN.types[type.toLowerCase()].weaknesses.forEach((weakness,index) => {
          if(weaknesses.indexOf(MAIN.emotes[weakness.toLowerCase()]) < 0){
            weaknesses += MAIN.emotes[weakness.toLowerCase()]+' ';
          }
        });
        pokemon_color = MAIN.Get_Color(type, pokemon_color);
      });
      pokemon_type = pokemon_type.slice(0,-3);
      weaknesses = weaknesses.slice(0,-1);

      //EVOLUTION FAMILY
      for (key in MAIN.evolutions) { //Find Previous Evolutions
        for(var i = 0; i < MAIN.evolutions[key].length; i++) {
          if (MAIN.evolutions[key][i] == pokemon_id) {
            evolutions = MAIN.pokemon[key].name+' -> '+evolutions;
            evolve = key;
            for (key in MAIN.evolutions) {
              for(var x = 0; x < MAIN.evolutions[evolve].length; x++) {
               if (MAIN.evolutions[key][x] == evolve) {
                 evolutions = MAIN.pokemon[key].name+' -> '+evolutions;
                 break;
               }
             }
           }
           break;
          }
        }
       }
       if (MAIN.evolutions[pokemon_id] != ''){ //Find Next Evolution
         evolutions += ' -> ';
         for(var i = 0; i < MAIN.evolutions[pokemon_id].length; i++) {
           evolutions += MAIN.pokemon[MAIN.evolutions[pokemon_id][i]].name+', ';
           evolve = parseInt(MAIN.evolutions[MAIN.evolutions[pokemon_id][i]]);
           if (evolve != 'NaN' && MAIN.pokemon[evolve]) {
             evolutions = evolutions.slice(0,-2);
             evolutions += ' -> ';
             for(var x = 0; x < MAIN.evolutions[MAIN.evolutions[pokemon_id][i]].length; x++) {
               evolutions += MAIN.pokemon[MAIN.evolutions[MAIN.evolutions[pokemon_id][i]][x]].name+', ';
             }
           }
         }
         evolutions = evolutions.slice(0,-2);
       }

      // GET SPRITE IMAGE
      let sprite = await MAIN.Get_Sprite(form, pokemon);

      let dex_embed = new Discord.RichEmbed()
      .setColor(pokemon_color)
      .setThumbnail(sprite)
      .setTitle('**'+pokemon_name+'** '+form_name+'('+pokemon_id+') '+pokemon_type)
      .setDescription(MAIN.pokemon[pokemon_id].dex)
      .addField('__Evolution Family__', evolutions)
      .addField('__Weaknesses__',weaknesses,true)
      .addField('__Base Stats__',
                '**Atk**: '+attack
             +', **Def**: '+defense
             +', **Sta**: '+stamina,true)
      .addField('__Max CPs__',
                '**Level 40**: '+MAIN.CalculateCP(pokemon_id,form,15,15,15,40)
               +' | **Level 25**: '+MAIN.CalculateCP(pokemon_id,form,15,15,15,25)
               +'\n**Level 20**: '+MAIN.CalculateCP(pokemon_id,form,15,15,15,20)
               +' | **Level 15**: '+MAIN.CalculateCP(pokemon_id,form,15,15,15,15));

      if(server.spam_channels.indexOf(message.channel.id) >= 0){
        return MAIN.Send_Embed('dex', 0, server, role_id, dex_embed, message.channel.id);
      } else {
        guild.fetchMember(message.author.id).then( TARGET => {
          return TARGET.send(dex_embed).catch(console.error);
        });
      }
}
