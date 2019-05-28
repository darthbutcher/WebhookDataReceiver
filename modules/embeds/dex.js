const Discord = require('discord.js');

module.exports.run = async (MAIN, message, pokemon_id, form_id, server) => {
      // CHECK IF THE TARGET IS A USER
      let member = MAIN.guilds.get(server.id).members.get(message.author.id);
      let guild = MAIN.guilds.get(message.guild.id);
      let role_id = '';

      // DETERMINE POKEMON NAME
      let pokemon_name = MAIN.pokemon[pokemon_id].name;
      let pokemon_type = '', weaknesses = '', pokemon_color = '', evolutions = pokemon_name;
      let attack = '', defense = '', stamina = '', form_name = '';

      if(!form_id || form_id == 'NaN'){
        if(!MAIN.pokemon[pokemon_id].default_form){
          form_id = 0;
        } else{
          form_id = MAIN.pokemon[pokemon_id].default_form;
        }
      }

      // DETERMINE FORM TYPE(S), EMOTE AND COLOR
      if (!MAIN.pokemon[pokemon_id].attack) {
        form_name = MAIN.pokemon[pokemon_id].forms[form_id].name;
        attack = MAIN.pokemon[pokemon_id].forms[form_id].attack;
        defense = MAIN.pokemon[pokemon_id].forms[form_id].defense;
        stamina = MAIN.pokemon[pokemon_id].forms[form_id].stamina;

        MAIN.pokemon[pokemon_id].forms[form_id].types.forEach((type) => {
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
      } else {
        attack = MAIN.pokemon[pokemon_id].attack;
        defense = MAIN.pokemon[pokemon_id].defense;
        stamina = MAIN.pokemon[pokemon_id].stamina;

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
      }

      //EVOLUTION FAMILY
      for (key in MAIN.pokemon) { //Find Previous Evolutions
        for(var i = 0; i < MAIN.pokemon[key].evolutions.length; i++) {
          if (MAIN.pokemon[key].evolutions[i] == pokemon_id) {
            evolutions = MAIN.pokemon[key].name+' -> '+evolutions;
            evolve = key;
            for (key in MAIN.pokemon) {
              for(var x = 0; x < MAIN.pokemon[evolve].evolutions.length; x++) {
               if (MAIN.pokemon[key].evolutions[x] == evolve) {
                 evolutions = MAIN.pokemon[key].name+' -> '+evolutions;
                 break;
               }
             }
           }
           break;
          }
        }
       }
       if (MAIN.pokemon[pokemon_id].evolutions != ''){ //Find Next Evolution
         evolutions += ' -> ';
         for(var i = 0; i < MAIN.pokemon[pokemon_id].evolutions.length; i++) {
           evolutions += MAIN.pokemon[MAIN.pokemon[pokemon_id].evolutions[i]].name+', ';
           evolve = parseInt(MAIN.pokemon[MAIN.pokemon[pokemon_id].evolutions[i]]);
           if (evolve != 'NaN' && MAIN.pokemon[evolve]) {
             evolutions = evolutions.slice(0,-2);
             evolutions += ' -> ';
             for(var x = 0; x < MAIN.pokemon[MAIN.pokemon[pokemon_id].evolutions[i]].evolutions.length; x++) {
               evolutions += MAIN.pokemon[MAIN.pokemon[MAIN.pokemon[pokemon_id].evolutions[i]].evolutions[x]].name+', ';
             }
           }
         }
         evolutions = evolutions.slice(0,-2);
       }

      // GET SPRITE IMAGE
      let sprite = await MAIN.Get_Sprite(form_id, pokemon);

      let dex_embed = new Discord.RichEmbed()
      .setColor(pokemon_color)
      .setThumbnail(sprite)
      .setTitle('**'+pokemon_name+'** ['+form_name+'] ('+pokemon_id+') '+pokemon_type)
      .setDescription(MAIN.pokemon[pokemon_id].dex)
      .addField('__Evolution Family__', evolutions)
      .addField('__Weaknesses__',weaknesses,true)
      .addField('__Base Stats__',
                '**Atk**: '+attack
             +', **Def**: '+defense
             +', **Sta**: '+stamina,true)
      .addField('__Max CPs__',
                '**Level 40**: '+MAIN.CalculateCP(pokemon_id,form_id,15,15,15,40)
               +' | **Level 25**: '+MAIN.CalculateCP(pokemon_id,form_id,15,15,15,25)
               +'\n**Level 20**: '+MAIN.CalculateCP(pokemon_id,form_id,15,15,15,20)
               +' | **Level 15**: '+MAIN.CalculateCP(pokemon_id,form_id,15,15,15,15));

      if(server.spam_channels.indexOf(message.channel.id) >= 0){
        return MAIN.Send_Embed('dex', 0, server, role_id, dex_embed, message.channel.id);
      } else {
        guild.fetchMember(message.author.id).then( TARGET => {
          return TARGET.send(dex_embed).catch(console.error);
        });
      }

      async function asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
          await callback(array[index], index, array);
        }
      }
}
