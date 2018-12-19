const Discord=require('discord.js');

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

  // DEBUG
  if(MAIN.debug.Pokemon=='ENABLED'){ console.info('[DEBUG] [pokemon.js] Saw an Encounter. '+sighting.encounter_id); }

  // EStABLISH SIGHTING VARIABLES
  let timeNow = new Date().getTime(), pName=MAIN.pokemon[sighting.pokemon_id].name;
  let internalValue = (sighting.individual_defense+sighting.individual_stamina+sighting.individual_attack)/45;
  internalValue = Math.floor(internalValue*1000)/10;

  // CHECK ALL FILTERS
  MAIN.feeds.forEach((feed,index) => {
    if(MAIN.config.Cities.length==1 || city.name==feed.City){
      if(feed.Type == 'pokemon'){
        if(feed.Channel_ID && feed[pName] != 'False'){

          // CHECK IF POKEMON IS ENABLED OR SET TO A SPECIFIC IV
          if(feed[pName]=='True'){

            // CHECK IF THE POKEMON HAS BEEN IV SCANNED
            if(sighting.cp > 0){
              // CHECK THE MIN AND MAX IV SET FOR THE ENTIRE FEED
              if(feed.min_iv <= internalValue && feed.max_iv >= internalValue){
                parse_Pokemon(MAIN, internalValue ,sighting, feed.Channel_ID, timeNow, city);
              }
              else{
                // DEBUG
                if(MAIN.debug.Pokemon=='ENABLED'){ console.info('[DEBUG] [pokemon.js] Encounter Did Not Pass Filters. '+sighting.encounter_id); }
              }
            }
            else if(feed.Post_Without_IV == true){

              // POST WITHOUT IVS IF OVERRIDDEN BY THE USER
              send_Without_IV(MAIN, sighting, feed.Channel_ID, timeNow, city);
            }
          }
          else if(feed[pName].min_iv<=internalValue && feed.max_iv>=internalValue){

            // CHECK IF THE POKEMON HAS BEEN IV SCANNED OR TO POST WITHOUT IV
            if(sighting.cp>0){
              parse_Pokemon(MAIN, internalValue, sighting, feed.Channel_ID, timeNow, city);
            }
            else if(feed.Post_Without_IV==true){

              // POST WITHOUT IVS IF OVERRIDDEN BY THE USER
              sendWithoutIV(MAIN, sighting, feed.Channel_ID, time, city);
            }
          } return;
        }
      }
    }
  });
}

function parse_Pokemon(MAIN, iv, sighting, channelID, time, city){

  // DEBUG
  if(MAIN.debug.Pokemon=='ENABLED'){ console.info('[DEBUG] [pokemon.js] Encounter Received to Send to Discord. '+sighting.encounter_id); }

  // FETCH THE MAP TILE
  MAIN.Static_Map_Tile(sighting.latitude,sighting.longitude).then(async function(imgUrl){

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
    MAIN.pokemon[sighting.pokemon_id].types.forEach((type) => { pokemonType += type+' '+MAIN.emotes.types[type]+' / '; });
    pokemonType = pokemonType.slice(0,-3);
    let height = 'Height: '+Math.floor(sighting.height*100)/100+'m';
    let weight = 'Weight: '+Math.floor(sighting.weight*100)/100+'kg';


    // GET SPRITE IMAGE
    let pokemonUrl = await MAIN.Get_Sprite(sighting.form, sighting.pokemon_id);

    // GET THE GENERAL AREA
    let pokemonArea = await MAIN.Get_Area(sighting.latitude,sighting.longitude);

    // GET GENDER
    let gender = await MAIN.Get_Gender(sighting.gender);

    // GET WEATHER BOOST
    let weatherBoost = await MAIN.Get_Weather(sighting.weather);

    // CREATE AND SEND THE EMBED
    let pokemonEmbed=new Discord.RichEmbed().setColor('00ccff').setThumbnail(pokemonUrl)
      .setTitle(pokemonName+' '+sighting.individual_attack+'/'+sighting.individual_defense+'/'+sighting.individual_stamina+' ('+iv+'%)'+weatherBoost)
      .addField('Level '+sighting.pokemon_level+' | CP '+sighting.cp+gender, moveName1+' '+moveType1+' / '+moveName2+' '+moveType2, false)
      .addField('Disappears: '+dTime+' (*'+dMinutes+' Mins*)', height+' | '+weight+'\n'+pokemonType, false)
      .addField(pokemonArea.name+'| Directions:','[Google Maps](https://www.google.com/maps?q='+sighting.latitude+','+sighting.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+sighting.latitude+','+sighting.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+sighting.latitude+','+sighting.longitude+'&navigate=yes)')
      .attachFile(attachment)
      .setImage('attachment://Pokemon_Alert.png');

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
  });
}

async function send_Without_IV(MAIN, sighting, channelID, time, city){

  // FETCH THE MAP TILE
  MAIN.Static_Map_Tile(sighting.latitude,sighting.longitude).then(async function(imgUrl){

    // DEFINE VARIABLES
    let dTime = await MAIN.Bot_Time(sighting.disappear_time,'1');
    let dMinutes = Math.floor((sighting.disappear_time-(time/1000))/60);

    // ATTACH THE MAP TILE
    let attachment = new Discord.Attachment(imgUrl, 'Pokemon_Alert.png');

    // DETERMINE POKEMON NAME AND DETAILS
    let pokemonType = '';
    let pokemonName = MAIN.pokemon[sighting.pokemon_id].name;
    MAIN.pokemon[sighting.pokemon_id].types.forEach((type) => { pokemonType += type+' '+MAIN.emotes.types[type]+' / '; });
    pokemonType = pokemonType.slice(0,-3);

    // GET SPRITE IMAGE
    let pokemonUrl = await MAIN.Get_Sprite(sighting.form, sighting.pokemon_id);

    // GET THE GENERAL AREA
    let pokemonArea = await MAIN.Get_Area(sighting.latitude,sighting.longitude);

    // GET GENDER
    let gender = await MAIN.Get_Gender(sighting.gender);

    // GET WEATHER BOOST
    let weatherBoost = await MAIN.Get_Weather(sighting.weather);

    // CREATE AND SEND THE EMBED
    let pokemonEmbed=new Discord.RichEmbed().setColor('00ccff').setThumbnail(pokemonUrl)
      .setTitle('A Wild **'+pokemonName+'** has Appeared!')
      .addField('Disappears: '+dTime+' (*'+dMinutes+' Mins*)', pokemonArea.name+weatherBoost+'\n'+pokemonType, false)
      .addField('Directions:','[Google Maps](https://www.google.com/maps?q='+sighting.latitude+','+sighting.longitude+') | [Apple Maps](http://maps.apple.com/maps?daddr='+sighting.latitude+','+sighting.longitude+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+sighting.latitude+','+sighting.longitude+'&navigate=yes)')
      .attachFile(attachment)
      .setImage('attachment://Pokemon_Alert.png');

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
  });
}
