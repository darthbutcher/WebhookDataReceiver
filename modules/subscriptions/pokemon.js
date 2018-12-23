const Discord=require('discord.js');
const moment=require('moment');

//#############################################################//
//#############################################################//
//#####   _____   ____  _  ________ __  __  ____  _   _   #####//
//#####  |  __ \ / __ \| |/ /  ____|  \/  |/ __ \| \ | |  #####//
//#####  | |__) | |  | | ' /| |__  | \  / | |  | |  \| |  #####//
//#####  |  ___/| |  | |  < |  __| | |\/| | |  | | . ` |  #####//
//#####  | |    | |__| | . \| |____| |  | | |__| | |\  |  #####//
//#####  |_|     \____/|_|\_\______|_|  |_|\____/|_| \_|  #####//
//#####             POKEMON SUBSCRIPTIONS                 #####//
//#############################################################//
//#############################################################//

module.exports.run = async (MAIN, internal_value, sighting, city, time) => {

  // GET THE GENERAL AREA
  let pokemon_area = await MAIN.Get_Area(sighting.latitude,sighting.longitude);

  if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG] [SUBSCRIPTION] [pokemon.js] Received '+MAIN.pokemon[sighting.pokemon_id].name+' Sighting.'); }

  // FETCH ALL USERS FROM THE USERS TABLE AND CHECK SUBSCRIPTIONS
  MAIN.database.query("SELECT * FROM pokebot.users", function (error, users, fields){
    if(users[0]){
      users.forEach((user,index) => {

        // FETCH THE GUILD MEMBER AND CHECK IF A ADMINISTRATOR/DONOR
        let member = MAIN.guilds.get(city.discord_id).members.get(user.user_id);
        if(!member){ proceed = false; }
        else if(member.hasPermission('ADMINISTRATOR')){ proceed = true; }
        else if(city.donor_role && !member.roles.has(city.donor_role)){ proceed = false; }

        // DEFINE VARIABLES
        let user_areas = user.geofence.split(',');


        // LEVEL 1 FILTERS
        // CHECK IF THE USERS SUBS ARE PAUSED, EXIST, AND THAT THE AREA MATCHES THEIR CITY
        if(proceed = true && user.status == 'ACTIVE' && user.pokemon && city.name == user.city){

          // LEVEL 2 FILTERS
          // CHECK IF THE AREA IS WITHIN THE USER'S GEOFENCES
          if(user.geofence == 'ALL' || user_areas.indexOf(pokemon_area) >= 0){

            // SEND TO USER CHECK FUNCTION
            sub_check(MAIN, internal_value, sighting, user, city, time);
          }
          else{
            if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG] [SUBSCRIPTION] [pokemon.js] Received '+MAIN.pokemon[sighting.pokemon_id].name+' Sighting Failed Area Filters.'); }
          }
        }
        else{
          if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG] [SUBSCRIPTION] [pokemon.js] '+MAIN.pokemon[sighting.pokemon_id].name+' Sighting Failed Initial Filters.'); }
        }
      });
    }
  });
}

async function sub_check(MAIN, internal_value, sighting, user, city, time){

  if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG] [SUBSCRIPTION] [pokemon.js] Checking Subscriptions for '+MAIN.pokemon[sighting.pokemon_id].name+'.'); }

  // CONVERT REWARD LIST TO AN ARRAY
  let pokemon = JSON.parse(user.pokemon);

  // DETERMINE GENDER
  if(sighting.gender == 1){ gender = 'male'; }
  else if(sighting.gender == 2){ gender = 'female'; }
  else{ gender = 'no gender'; }

  // CHECK EACH USER SUBSCRIPTION
  pokemon.subscriptions.forEach((sub,index) => {
    // if(sub.min_iv.length > 3){
    //
    //   // SPLIT THE IVs UP INTO INDIVIDUAL STATS
    //   let min_iv = sub.min_iv.split('/');
    //   let max_iv = sub.max_iv.split('/');
    //
    //   // CHECK ALL SUBSCRIPTION REQUIREMENTS
    //   switch(true){
    //     case sighting.individual_attack < min_iv[0]: break;
    //     case sighting.individual_defense < min_iv[1]: break;
    //     case sighting.individual_stamina < min_iv[2]: break;
    //     case sighting.individual_attack > max_iv[0]: break;
    //     case sighting.individual_defense > max_iv[1]: break;
    //     case sighting.individual_stamina > max_iv[2]: break;
    //     case sub.min_cp > sighting.cp: break;
    //     case sub.max_cp < sighting.cp: break;
    //     case sub.min_lvl > sighting.pokemon_level: break;
    //     case sub.max_lvl < sighting.pokemon_level: break;
    //     default:
    //
    //       // DEBUG
    //       if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG] [SUBSCRIPTION] [pokemon.js] Did Not Pass User Filters.'); }
    //
    //       // CHECK GENDER AND NAME FOR A MATCH
    //       if(gender == 'no gender' || sub.gender.toLowerCase() == gender){ break; }
    //       else if(sub.name != MAIN.pokemon[sighting.pokemon_id].name && sub.name != 'ALL'){ break; }
    //       else{ prepare_alert(MAIN, internal_value, sighting, user, city, time); }
    //   }
    // }
    // else{
      switch(true){
        case sub.min_iv > internal_value: break;
        case sub.max_iv < internal_value: break;
        case sub.min_cp > sighting.cp: break;
        case sub.max_cp < sighting.cp: break;
        case sub.min_lvl > sighting.pokemon_level: break;
        case sub.max_lvl < sighting.pokemon_level: break;
        default:

          // DEBUG
          if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG] [SUBSCRIPTION] [pokemon.js] Did Not Pass User Filters.'); }

          // CHECK GENDER AND NAME FOR A MATCH
          if(gender == 'no gender' || sub.gender.toLowerCase() == gender){ break; }
          else if(sub.name != MAIN.pokemon[sighting.pokemon_id].name && sub.name != 'ALL'){ break; }
          else{ prepare_alert(MAIN, internal_value, sighting, user, city, time); }
      }
    // }

    // CHECK ALL SUBSCRIPTION VALUES

  });

  // DEBUG
  if(MAIN.debug.Subscriptions == 'ENABLED'){ console.info('[DEBUG] [SUBSCRIPTION] [pokemon.js] Did Not Pass User Filters.'); }
}

async function prepare_alert(MAIN, internal_value, sighting, user, city, time){
  // FETCH THE MAP TILE
  MAIN.Static_Map_Tile(sighting.latitude,sighting.longitude,'pokemon').then(async function(imgUrl){

    // DEFINE VARIABLES
    let dTime = await MAIN.Bot_Time(sighting.disappear_time,'1');
    let dMinutes = Math.floor((sighting.disappear_time-(time/1000))/60);
    let pokeIV = Math.floor(sighting.iv*10)/10, weather='', area='';

    // ATTACH THE MAP TILE
    let attachment = new Discord.Attachment(imgUrl, 'Pokemon_Alert.png');

    // DETERMINE MOVE NAMES AND TYPES
    let moveName1 = MAIN.moves[sighting.move_1].name;
    let moveType1 = await MAIN.Get_Move_Type(sighting.move_1);
    let moveName2 = MAIN.moves[sighting.move_2].name;
    let moveType2 = await MAIN.Get_Move_Type(sighting.move_2);

    // DETERMINE POKEMON NAME AND DETAILS
    let pokemonType = '';
    let pokemonName = MAIN.pokemon[sighting.pokemon_id].name;
    MAIN.pokemon[sighting.pokemon_id].types.forEach((type) => { pokemonType += type+' '+MAIN.emotes[type.toLowerCase()]+' / '; });
    pokemonType = pokemonType.slice(0,-3);
    let height = 'Height: '+Math.floor(sighting.height*100)/100+'m';
    let weight = 'Weight: '+Math.floor(sighting.weight*100)/100+'kg';

    // GET SPRITE IMAGE
    let pokemonUrl = await MAIN.Get_Sprite(sighting.form, sighting.pokemon_id);

    // GET THE GENERAL AREA
    let pokemon_area = await MAIN.Get_Area(sighting.latitude,sighting.longitude);

    // GET GENDER
    let gender = await MAIN.Get_Gender(sighting.gender);

    // GET WEATHER BOOST
    let weatherBoost = await MAIN.Get_Weather(sighting.weather);

    // CREATE AND SEND THE EMBED
    let pokemon_embed = new Discord.RichEmbed().setColor('00ccff').setThumbnail(pokemonUrl)
      .setTitle(pokemonName+' '+sighting.individual_attack+'/'+sighting.individual_defense+'/'+sighting.individual_stamina+' ('+internal_value+'%)'+weatherBoost)
      .addField('Level '+sighting.pokemon_level+' | CP '+sighting.cp+gender, moveName1+' '+moveType1+' / '+moveName2+' '+moveType2, false)
      .addField('Disappears: '+dTime+' (*'+dMinutes+' Mins*)', height+' | '+weight+'\n'+pokemonType, false)
      .addField(pokemon_area.name+'| Directions:','[Google Maps](https://www.google.com/maps?q='+sighting.latitude+','+sighting.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+sighting.latitude+','+sighting.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+sighting.latitude+','+sighting.longitude+'&navigate=yes)')
      .attachFile(attachment)
      .setImage('attachment://Pokemon_Alert.png');

    if(MAIN.logging == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Subscriptions] Sent a Pokémon DM to '+user.user_name+'.'); }

    MAIN.Send_DM(city.discord_id, user.user_id, pokemon_embed, user.bot);
  });
}
