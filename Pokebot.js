// MODULE REQUIREMENTS
const fs=require('fs');
const mysql = require('mysql');
const moment=require('moment');
const Discord=require('discord.js');
const insideGeofence=require('point-in-polygon');
const express=require('express');
const bodyParser=require('body-parser');
const StaticMaps=require('staticmaps');

// EVENTS TO DISABLE TO SAVE MEMORY AND CPU
var eventsToDisable = ['channelCreate','channelDelete','channelPinsUpdate','channelUpdate','clientUserGuildSettingsUpdate','clientUserSettingsUpdate',
  'debug','disconnect','emojiCreate','emojiDelete','emojiUpdate','guildBanAdd','guildBanRemove','guildCreate','guildDelete','guildMemberAdd',
  'guildMemberAvailable','guildMembersChunk','guildMemberSpeaking','guildMemberUpdate','guildUnavailable','guildUpdate','messageDelete',
  'messageDeleteBulk','messageReactionAdd','messageReactionRemove','messageReactionRemoveAll','messageUpdate','presenceUpdate','ready',
  'reconnecting','resume','roleCreate','roleDelete','roleUpdate','typingStart','typingStop','userNoteUpdate','userUpdate','voiceStateUpdate','warn'];

// DEFINE BOTS AND DISABLE ALL EVENTS TO SAVE MEMORY AND CPU
const MAIN=new Discord.Client({ disabledEvents: eventsToDisable }); const ALPHA=new Discord.Client({ disabledEvents: eventsToDisable });
const BRAVO=new Discord.Client({ disabledEvents: eventsToDisable }); const CHARLIE=new Discord.Client({ disabledEvents: eventsToDisable });
const DELTA=new Discord.Client({ disabledEvents: eventsToDisable }); const ECHO=new Discord.Client({ disabledEvents: eventsToDisable });
const FOXTROT=new Discord.Client({ disabledEvents: eventsToDisable }); const GULF=new Discord.Client({ disabledEvents: eventsToDisable });
const HOTEL=new Discord.Client({ disabledEvents: eventsToDisable }); const INDIA=new Discord.Client({ disabledEvents: eventsToDisable });
const JULIET=new Discord.Client({ disabledEvents: eventsToDisable }); const KILO=new Discord.Client({ disabledEvents: eventsToDisable });
const LIMA=new Discord.Client({ disabledEvents: eventsToDisable }); const MIKE=new Discord.Client({ disabledEvents: eventsToDisable });
const NOVEMBER=new Discord.Client({ disabledEvents: eventsToDisable }); const OSCAR=new Discord.Client({ disabledEvents: eventsToDisable });

// CACHE DATA FROM JSONS
MAIN.config=require('./config/pokebot_config.json');
MAIN.geofence=require('./config/geofences.json');
MAIN.qConfig=require('./config/quest_config.json');
MAIN.rConfig=require('./config/raid_config.json');
MAIN.pConfig=require('./config/pokemon_config.json');
MAIN.pokemon=require('./static/pokemon.json');
MAIN.proto=require('./static/en.json');
MAIN.emotes=require('./config/emotes.json');
MAIN.rewards=require('./static/rewards.json');
MAIN.moves=require('./static/moves.json');
MAIN.update=require('./static/database.json')

// DATABASE CONNECTION
MAIN.database = mysql.createConnection({
  host: MAIN.config.DB.host,
  user: MAIN.config.DB.username,
  password: MAIN.config.DB.password,
  port: MAIN.config.DB.port
});
MAIN.database.connect();

// GLOBAL VARIABLES
MAIN.BOTS=[];

// DEFINE LOGGING & DEBUGGING
MAIN.logging=MAIN.config.CONSOLE_LOGS;
MAIN.debug=MAIN.config.DEBUG;

// DEFINE AND LOAD ALL MODULES
MAIN.modules=new Discord.Collection();
fs.readdir('./modules', (error,files) => {
	let moduleFiles=files.filter(f => f.split('.').pop()==='js'), mCount=0;
	moduleFiles.forEach((script,index) => {
		delete require.cache[require.resolve('./modules/'+script)]; mCount++
		let module=require('./modules/'+script); MAIN.modules.set(script, module);
	}); console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Loaded '+mCount+' Modules.');
});

// DEFINE AND LOAD ALL COMMANDS
MAIN.commands=new Discord.Collection();
fs.readdir('./commands', (err,files) => {
  let commandFiles=files.filter(f => f.split('.').pop()==='js'), cCount=0;
  commandFiles.forEach((f,i) => {
    delete require.cache[require.resolve('./commands/'+f)]; cCount++;
    let command=require('./commands/'+f); MAIN.commands.set(f.slice(0,-3), command);
  }); console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Loaded '+cCount+' Commands.');
});

// DEFINE AND LOAD ALL FEEDS
MAIN.feeds=[];
fs.readdir('./feeds', (err,files) => {
  let feedFiles=files.filter(f => f.split('.').pop()==='json'), fCount=0;
  feedFiles.forEach((f,i) => {
    delete require.cache[require.resolve('./feeds/'+f)];
    let feed=require('./feeds/'+f); MAIN.feeds.push(feed); fCount++
  }); console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Loaded '+fCount+' Pokémon Feeds.');
});

// CREATE SERVER
const app=express().use(bodyParser.json());

// LISTEN FOR PAYLOADS
app.listen(MAIN.config.LISTENING_PORT, () => console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Now listening for payloads on port '+MAIN.config.LISTENING_PORT+'.'));

// ACCEPT AND SEND PAYLOADS TO ITS PARSE FUNCTION
app.post('/', (webhook, resolve) => {
  let PAYLOAD=webhook.body;

  // SEPARATE EACH PAYLOAD AND SORT
  PAYLOAD.forEach((data,index) => {
    let city = MAIN.Get_City(data.message);
		switch(data.type){

      // SEND TO POKEMON MODULE
			case 'pokemon':
				let pokemon=MAIN.modules.get('pokemon.js');
				if(pokemon){ pokemon.run(MAIN, data.message, city); } return;

      // SEND TO RAIDS MODULE
			case 'raid':
        let raids=MAIN.modules.get('raids.js');
				if(raids){ raids.run(MAIN, data.message, city); } return;

      // SEND TO QUESTS MODULE
			case 'quest':
				let quests=MAIN.modules.get('quests.js');
				if(quests){ quests.run(MAIN, data.message, city); } return;
			default: return;
		}
	});
});

// SEND MESSAGE TO COMMAND MODULE
MAIN.on('message', message => {
  let commands=MAIN.modules.get('commands.js');
  if(commands){ commands.run(MAIN, message); } return;
});

// SAVE A USER IN THE USER TABLE
MAIN.Save_Sub = (message,area) => {
  if(MAIN.User_Bot==MAIN.BOTS.length-1){ MAIN.User_Bot=0; } else{ MAIN.User_Bot++; }
  MAIN.database.query(`INSERT INTO pokebot.users (user_id, user_name, geofence, pokemon, quests, raids, paused, bot, alert_time, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [message.member.id, message.member.user.tag, 'ALL', , , , 'NO', MAIN.User_Bot, '07:00', area], function (error, user, fields) {
    if(error){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO ADD USER TO pokebot.users',error); }
    else{
      console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+']Added '+message.member.user.tag+' to the pokebot.user database.');
      return message.reply('You did not have a subscription record. One has now been created. Please try the command again.').then(m => m.delete(15000)).catch(console.error);
    }
  });
}

// RETURN TIME FUNCTION
MAIN.Bot_Time = (time,type) => {
	let now=new Date().getTime();
	if(type==1){ return moment.unix(time).format('h:mm A'); }
	if(type==2){ return moment(now).format('HHmm'); }
	if(type==3){ return moment(time).format('HHmm'); }
  if(type=='quest'){ return moment(now).format('dddd, MMMM Do')+' @ Midnight'; }
  if(type=='stamp'){ return moment(now).format('HH:mmA'); }
}

// TRANSLATE GENDER FUNCTION
MAIN.Get_Gender = (genderID) => {
  let gender='';
  switch(genderID){
    case 1: gender=' | ♂Male'; break;
    case 2: gender=' | ♀Female'; break;
    default: gender='No Gender';
  } return gender;
}

// OBTAIN POKEMON SPRITE
MAIN.Get_Sprite = (form,id) => {
  let spriteUrl='';
  switch(id.toString().length){
    case 1: spriteUrl='https://www.serebii.net/sunmoon/pokemon/00'+id+'.png'; break;
    case 2: spriteUrl='https://www.serebii.net/sunmoon/pokemon/0'+id+'.png'; break;
    case 3: spriteUrl='https://www.serebii.net/sunmoon/pokemon/'+id+'.png'; break;
  }
  // CHECK FOR ALOLAN
  if(form>0 && MAIN.pokemon.alolan_forms.indexOf(form)>=0){ spriteUrl=spriteUrl.toString().slice(0,-4)+'-a.png'; }
  return spriteUrl;
}

// OBTAIN OBECT GEOFENCE
MAIN.Get_Area = (lat,lon) => {
  let area='';
  for(let gf=0; gf<MAIN.geofence.areas.length; gf++){
    if(insideGeofence([lat,lon], MAIN.geofence.areas[gf].coords)){
      area=MAIN.geofence.areas[gf];
      if(area.sub_area==true){ return area; }
    }
  } return area;
}

// CHOOSE NEXT BOT AND SEND EMBED
MAIN.Send_Embed = (embed, channelID) => {
  if(MAIN.Next_Bot==MAIN.BOTS.length-1 && MAIN.BOTS[0]){ MAIN.Next_Bot=0; } else{ MAIN.Next_Bot++; }
	return MAIN.BOTS[MAIN.Next_Bot].channels.get(channelID).send(embed).catch( error => {
    //pokebotRestart();
    console.error(embed,error);
  });
}

// DETERMINE OBJECT CITY
MAIN.Get_City = (object) => {
  let city='';
  for(let c=0;c<MAIN.config.Cities.length; c++){
    if(insideGeofence([object.latitude,object.longitude], MAIN.config.Cities[c].coords)){
      city=MAIN.config.Cities[c]; return city
    }
  }
}

// GET QUEST REWARD ICON
MAIN.Get_Icon = (object, questReward) => {
  let questUrl='';
  MAIN.rewards.array.forEach((reward,index) => {
    if(questReward.indexOf(reward.name)>=0){ questUrl=reward.url; }
  }); return questUrl;
}

// CHECK FOR OR CREATE MAP TILES FOR EMBEDS
MAIN.Static_Map_Tile = (lat,lon,object_id) => {
  return new Promise(function(resolve, reject) {
    let path='.static/files/'+lat+','+lon+'.png';
    if(fs.existsSync(path)){ resolve(path); console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] USED AN EXISTING MAP TILE FOR '+lat+','+lon+'.'); }
    else{ MAIN.Render_Map_Tile(lat,lon,object_id).then((location) => { resolve(location); }); }
  });
}

// MAP TILE RENDER, CREATE, AND SAVE FUNCTION
MAIN.Render_Map_Tile = (lat,lon,object_id) => {
  return new Promise(function(resolve, reject) {
    const zoom = 16, center = [lon,lat], options = { width: 400, height: 220 };
    const map = new StaticMaps(options);
    const marker = { img: `https://i.imgur.com/OGMRWnh.png`, width: 40, height: 40 };
    marker.coord = [lon,lat]; map.addMarker(marker);
    map.render(center, zoom)
      .then(() => map.image.save('./static/files/'+lat+','+lon+'.png'))
      //.then(() => console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] New Map Tile Saved for '+lat+','+lon+'.'))
      .then(() => resolve('./static/files/'+lat+','+lon+'.png'))
      .catch(function(error){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Unable To Save Map Tile.',error); });
  });
}

// GET WEATHER BOOST
MAIN.Get_Weather = (weather) => {
  return new Promise(resolve => {
    let weatherBoost = '';
    switch(weather){
      case 1: weatherBoost = ' | '+MAIN.emotes.weather.clear+' *Boosted*'; break;
      case 2: weatherBoost = ' | '+MAIN.emotes.weather.rain+' *Boosted*'; break;
      case 3: weatherBoost = ' | '+MAIN.emotes.weather.partly_cloudy+' *Boosted*'; break;
      case 4: weatherBoost = ' | '+MAIN.emotes.weather.mostly_cloudy+' *Boosted*'; break;
      case 5: weatherBoost = ' | '+MAIN.emotes.weather.windy+' *Boosted*'; break;
      case 6: weatherBoost = ' | '+MAIN.emotes.weather.snow+' *Boosted*'; break;
      case 7: weatherBoost = ' | '+MAIN.emotes.weather.fog+' *Boosted*'; break;
    }
    resolve(weatherBoost);
  });
}

// GET WEATHER BOOST
MAIN.Get_Move_Type = (moveNum) => {
  return new Promise(resolve => {
    let emote = '';
    switch(MAIN.moves[moveNum].type){
      case 'Normal': emote = MAIN.emotes.types.Normal; break;
      case 'Grass': emote = MAIN.emotes.types.Grass; break;
      case 'Fire': emote = MAIN.emotes.types.Fire; break;
      case 'Water': emote = MAIN.emotes.types.Water; break;
      case 'Electric': emote = MAIN.emotes.types.Electric; break;
      case 'Ground': emote = MAIN.emotes.types.Ground; break;
      case 'Steel': emote = MAIN.emotes.types.Steel; break;
      case 'Rock': emote = MAIN.emotes.types.Rock; break;
      case 'Psychic': emote = MAIN.emotes.types.Psychic; break;
      case 'Poison': emote = MAIN.emotes.types.Poison; break;
      case 'Fairy': emote = MAIN.emotes.types.Fairy; break;
      case 'Fighting': emote = MAIN.emotes.types.Fighting; break;
      case 'Dark': emote = MAIN.emotes.types.Dark; break;
      case 'Ghost': emote = MAIN.emotes.types.Ghost; break;
      case 'Bug': emote = MAIN.emotes.types.Bug; break;
      case 'Dragon': emote = MAIN.emotes.types.Dragon; break;
      case 'Ice': emote = MAIN.emotes.types.Ice; break;
      case 'Flying': emote = MAIN.emotes.types.Flying; break;
    }
    resolve(emote);
  });
}

// GET QUEST SCANNING STATUS
function questStatus(message){
  let scanned, total;
  MAIN.database.query(`SELECT * from rdmdb.pokestop WHERE quest_type IS NOT NULL`, function (error, result, fields) {
    console.log(result.length); scanned=result.length;
  });
  MAIN.database.query(`SELECT * FROM rdmdb.pokestop`, function (error, result, fields) {
    console.log(result.length); total=result.length;
  });
  setTimeout(function() { message.channel.send('Quest Scanning Progress: ```'+scanned+'/'+total+'```'); }, 5000);
}

// RESTART FUNCTION
function pokebotRestart(){ process.exit(1); }

// INTERVAL FUNCTION TO SEND QUEST SUBSCRIPTION DMS
setInterval(function() {
  let timeNow=new Date().getTime();
  MAIN.database.query("SELECT * FROM pokebot.quest_alerts WHERE alert_time < "+timeNow, function (error, alerts, fields) {
    if(alerts && alerts[0]){
      alerts.forEach((alert,index) => {
        setTimeout(function() {
          MAIN.BOTS[alert.bot].guilds.get('266738315380785152').fetchMember(alert.user_id).then( TARGET => {
            let questEmbed=JSON.parse(alert.embed);
            let attachment = new Discord.Attachment(questEmbed.file.attachment, questEmbed.file.name);
            let alertEmbed=new Discord.RichEmbed()
              .setColor(questEmbed.color)
              .setThumbnail(questEmbed.thumbnail.url)
              .addField(questEmbed.fields[0].name, questEmbed.fields[0].value, false)
              .addField(questEmbed.fields[1].name, questEmbed.fields[1].value, false)
              .addField(questEmbed.fields[2].name, questEmbed.fields[2].value, false)
              .setImage(questEmbed.image.url)
              .attachFile(attachment)
              .setImage('attachment://'+questEmbed.file.name)
              .setFooter(questEmbed.footer.text);
            TARGET.send(alertEmbed).catch( error => {
              console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+']'+TARGET.user.tag+' ('+alert.user_id+') , Cannot send this user a message.');
            });
          });
        }, 2000*index);
      });
      console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Sent '+alerts.length+' Quest Alerts.');
      MAIN.database.query("DELETE FROM pokebot.quest_alerts WHERE alert_time < "+timeNow, function (error, alerts, fields) { if(error){ console.error; } });
    }
  });
}, 60000);

function performUpdate(){
  return new Promise(resolve => {
    MAIN.update[MAIN.update.LATEST].forEach((update) => {
      MAIN.sqlFunction(update.sql, update.data, update.gLog, update.bLog);
    });
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Database updated to Version '+MAIN.update.LATEST+'.');
    resolve('DONE');
  });
}

// SQL FUNCTION
MAIN.sqlFunction = (sql,data,logSuccess,logError) => {
  return new Promise(resolve => {
  	MAIN.database.query(sql, data, function (error, result, fields) {
  		if(error){ console.error(logError,error); }
      if(logSuccess){ console.info(logSuccess); }
      resolve(result);
  	});
  });
}

// CREATE DATABASE, TABLES, AND CHECK FOR UPDATES
function updateDatabase(){
  return new Promise(async function(resolve, reject) {
    await MAIN.sqlFunction('CREATE DATABASE IF NOT EXISTS pokebot', undefined, undefined,'[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO CREATE THE Pokébot DATABASE.');
    await MAIN.sqlFunction('CREATE TABLE IF NOT EXISTS pokebot.users (user_id TEXT, user_name TEXT, geofence TEXT, pokemon TEXT, quests TEXT, raids TEXT, paused TEXT, bot TEXT, alert_time TEXT, city TEXT)', undefined, undefined,'[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO CREATE THE pokebot.user TABLE.');
    await MAIN.sqlFunction('CREATE TABLE IF NOT EXISTS pokebot.quest_alerts (user_id TEXT, quest TEXT, embed TEXT, area TEXT, bot TEXT, alert_time bigint, city text)', undefined, undefined,'[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO CREATE THE pokebot.quest_alerts TABLE.');
    await MAIN.sqlFunction(`CREATE TABLE IF NOT EXISTS pokebot.info (db_version TEXT)`, undefined, undefined,'[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO CREATE THE pokebot.info TABLE.');
    await MAIN.database.query(`SELECT * FROM pokebot.info`, async function (error, row, fields) {
      if(!row || !row[0]){ await MAIN.sqlFunction(`INSERT INTO pokebot.info (db_version) VALUES (?)`,['1'], undefined,'[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO INSERT INTO THE pokebot.info TABLE.'); }
      if(row[0].db_version!=MAIN.update.LATEST){
        await console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Database UPDATE found.'); console.info('Updating...');
        await MAIN.sqlFunction(`UPDATE pokebot.info SET db_version = ? WHERE db_version = ?`, [MAIN.update.LATEST,row[0].db_version], undefined, '[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO UPDATE THE pokebot.info TABLE.');
        await performUpdate().then((location) => { resolve('Done'); });
      }
      else{ resolve('Done'); }
    });
  });
}

async function botReady(){
  MAIN.Next_Bot=0; MAIN.User_Bot=0;
  updateDatabase().then(async function(updated){
    await console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Logging is set to: '+MAIN.config.CONSOLE_LOGS);
    await console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Pokébot is Ready.');

    // SET ALL TO INVISIBLE
    await MAIN.BOTS.forEach((bot,index) => { if(bot.user){ bot.user.setPresence({ status: 'invisible' }); } });
    if(ALPHA){ await ALPHA.login(MAIN.config.BOT_TOKENS[0]); }
    if(BRAVO){ await BRAVO.user.setPresence({ status: 'invisible' }); }
    if(CHARLIE){ await CHARLIE.setPresence({ status: 'invisible' }); }
    if(DELTA){ await DELTA.setPresence({ status: 'invisible' }); }
    if(ECHO){ await ECHO.setPresence({ status: 'invisible' }); }
    if(FOXTROT){ await FOXTROT.setPresence({ status: 'invisible' }); }
    if(GULF){ await GULF.setPresence({ status: 'invisible' }); }
    if(HOTEL){ await HOTEL.setPresence({ status: 'invisible' }); }
    if(INDIA){ await INDIA.setPresence({ status: 'invisible' }); }
    if(JULIET){ await JULIET.setPresence({ status: 'invisible' }); }
    if(KILO){ await KILO.setPresence({ status: 'invisible' }); }
    if(LIMA){ await LIMA.setPresence({ status: 'invisible' }); }
    if(MIKE){ await MIKE.setPresence({ status: 'invisible' }); }
    if(NOVEMBER){ await NOVEMBER.setPresence({ status: 'invisible' }); }
    if(OSCAR){ await OSCAR.setPresence({ status: 'invisible' }); }
  });
}

// LOG IN BOTS AND ADD TO BOT ARRAY
async function botLogin(){
  await MAIN.login(MAIN.config.MAIN_BOT_TOKEN);
  if(MAIN.config.BOT_TOKENS[0]){ await MAIN.BOTS.push(ALPHA); ALPHA.login(MAIN.config.BOT_TOKENS[0]); }
  if(MAIN.config.BOT_TOKENS[1]){ await MAIN.BOTS.push(BRAVO); BRAVO.login(MAIN.config.BOT_TOKENS[1]); }
  if(MAIN.config.BOT_TOKENS[2]){ await MAIN.BOTS.push(CHARLIE); CHARLIE.login(MAIN.config.BOT_TOKENS[2]); }
  if(MAIN.config.BOT_TOKENS[3]){ await MAIN.BOTS.push(DELTA); DELTA.login(MAIN.config.BOT_TOKENS[3]); }
  if(MAIN.config.BOT_TOKENS[4]){ await MAIN.BOTS.push(ECHO); ECHO.login(MAIN.config.BOT_TOKENS[4]); }
  if(MAIN.config.BOT_TOKENS[5]){ await MAIN.BOTS.push(FOXTROT); FOXTROT.login(MAIN.config.BOT_TOKENS[5]); }
  if(MAIN.config.BOT_TOKENS[6]){ await MAIN.BOTS.push(GULF); GULF.login(MAIN.config.BOT_TOKENS[6]); }
  if(MAIN.config.BOT_TOKENS[7]){ await MAIN.BOTS.push(HOTEL); HOTEL.login(MAIN.config.BOT_TOKENS[7]); }
  if(MAIN.config.BOT_TOKENS[8]){ await MAIN.BOTS.push(INDIA); INDIA.login(MAIN.config.BOT_TOKENS[8]); }
  if(MAIN.config.BOT_TOKENS[9]){ await MAIN.BOTS.push(JULIET); JULIET.login(MAIN.config.BOT_TOKENS[9]); }
  if(MAIN.config.BOT_TOKENS[10]){ await MAIN.BOTS.push(KILO); KILO.login(MAIN.config.BOT_TOKENS[10]); }
  if(MAIN.config.BOT_TOKENS[11]){ await MAIN.BOTS.push(LIMA); LIMA.login(MAIN.config.BOT_TOKENS[11]); }
  if(MAIN.config.BOT_TOKENS[12]){ await MAIN.BOTS.push(MIKE); MIKE.login(MAIN.config.BOT_TOKENS[12]); }
  if(MAIN.config.BOT_TOKENS[13]){ await MAIN.BOTS.push(NOVEMBER); NOVEMBER.login(MAIN.config.BOT_TOKENS[13]); }
  if(MAIN.config.BOT_TOKENS[14]){ await MAIN.BOTS.push(OSCAR); OSCAR.login(MAIN.config.BOT_TOKENS[14]); }
  await botReady();
}

botLogin();
