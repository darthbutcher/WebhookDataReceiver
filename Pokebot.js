// MODULE REQUIREMENTS
const fs = require('fs');
const mysql = require('mysql');
const moment = require('moment');
const Discord = require('discord.js');
const insideGeofence = require('point-in-polygon');
const express = require('express');
const bodyParser = require('body-parser');

// LOAD MODULES
const StaticMaps = require('staticmaps');
const Emojis = require('./modules/emojis.js');
const Quests = require('./modules/quests.js');
const Pokemon = require('./modules/pokemon.js');
const Raids = require('./modules/raids.js');
const Commands = require('./modules/commands.js');


// EVENTS TO DISABLE TO SAVE MEMORY AND CPU
var eventsToDisable = ['channelCreate','channelDelete','channelPinsUpdate','channelUpdate','clientUserGuildSettingsUpdate','clientUserSettingsUpdate',
  'debug','disconnect','emojiCreate','emojiDelete','emojiUpdate','guildBanAdd','guildBanRemove','guildCreate','guildDelete','guildMemberAdd',
  'guildMemberAvailable','guildMembersChunk','guildMemberSpeaking','guildMemberUpdate','guildUnavailable','guildUpdate','messageDelete',
  'messageDeleteBulk','messageReactionAdd','messageReactionRemove','messageReactionRemoveAll','messageUpdate','presenceUpdate','ready',
  'reconnecting','resume','roleCreate','roleDelete','roleUpdate','typingStart','typingStop','userNoteUpdate','userUpdate','voiceStateUpdate','warn'];

// DEFINE BOTS AND DISABLE ALL EVENTS TO SAVE MEMORY AND CPU
const MAIN = new Discord.Client({ disabledEvents: eventsToDisable }); const ALPHA=new Discord.Client({ disabledEvents: eventsToDisable });
const BRAVO = new Discord.Client({ disabledEvents: eventsToDisable }); const CHARLIE=new Discord.Client({ disabledEvents: eventsToDisable });
const DELTA = new Discord.Client({ disabledEvents: eventsToDisable }); const ECHO=new Discord.Client({ disabledEvents: eventsToDisable });
const FOXTROT = new Discord.Client({ disabledEvents: eventsToDisable }); const GULF=new Discord.Client({ disabledEvents: eventsToDisable });
const HOTEL = new Discord.Client({ disabledEvents: eventsToDisable }); const INDIA=new Discord.Client({ disabledEvents: eventsToDisable });
const JULIET = new Discord.Client({ disabledEvents: eventsToDisable }); const KILO=new Discord.Client({ disabledEvents: eventsToDisable });
const LIMA = new Discord.Client({ disabledEvents: eventsToDisable }); const MIKE=new Discord.Client({ disabledEvents: eventsToDisable });
const NOVEMBER = new Discord.Client({ disabledEvents: eventsToDisable }); const OSCAR=new Discord.Client({ disabledEvents: eventsToDisable });

// CACHE DATA FROM JSONS
MAIN.config = require('./config/config.json');
MAIN.geofence = require('./config/geofences.json');
MAIN.q_config = require('./config/quest_config.json');
MAIN.r_config = require('./config/raid_config.json');
MAIN.p_config = require('./config/pokemon_config.json');
MAIN.pokemon = require('./static/pokemon.json');
MAIN.proto = require('./static/en.json');
MAIN.rewards = require('./static/rewards.json');
MAIN.moves = require('./static/moves.json');
MAIN.db = require('./static/database.json');
MAIN.types = require('./static/types.json');

// DATABASE CONNECTION
MAIN.database = mysql.createConnection({
  host: MAIN.config.DB.host,
  user: MAIN.config.DB.username,
  password: MAIN.config.DB.password,
  port: MAIN.config.DB.port
});
MAIN.database.connect();

// GLOBAL VARIABLES
MAIN.BOTS = [];

// DEFINE LOGGING & DEBUGGING
MAIN.logging = MAIN.config.CONSOLE_LOGS;
MAIN.debug = MAIN.config.DEBUG;

// DEFINE AND LOAD ALL FEEDS
MAIN.feeds = [];
fs.readdir('./feeds', (err,files) => {
  let feedFiles = files.filter(f => f.split('.').pop()==='json'), fCount=0;
  feedFiles.forEach((f,i) => {
    delete require.cache[require.resolve('./feeds/'+f)];
    let feed = require('./feeds/'+f); MAIN.feeds.push(feed); fCount++
  }); console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Loaded '+fCount+' Pokémon Feeds.');
});

// CREATE SERVER
const app=express().use(bodyParser.json());

// LISTEN FOR PAYLOADS
app.listen(MAIN.config.LISTENING_PORT, () => console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Now listening for payloads on port '+MAIN.config.LISTENING_PORT+'.'));

// ACCEPT AND SEND PAYLOADS TO ITS PARSE FUNCTION
app.post('/', (webhook, resolve) => {
  let PAYLOAD = webhook.body;
  if(MAIN.Active != true){ return; }
  // SEPARATE EACH PAYLOAD AND SORT
  PAYLOAD.forEach( async (data,index) => {
    let city = await MAIN.Get_City(data.message);
		switch(data.type){

      // SEND TO POKEMON MODULE
			case 'pokemon':
				Pokemon.run(MAIN, data.message, city); return;

      // SEND TO RAIDS MODULE
			case 'raid':
        Raids.run(MAIN, data.message, city); return;

      // SEND TO QUESTS MODULE
			case 'quest':
				Quests.run(MAIN, data.message, city); return;
			default: return;
		}
	});
});

// DETERMINE OBJECT CITY
MAIN.Get_City = (object) => {
  return new Promise(function(resolve, reject) {
    MAIN.config.Cities.forEach((city,index) => {
      if(insideGeofence([object.latitude,object.longitude], city.geofence)){ resolve(city); }
    }); resolve(undefined);
  });
}

// SEND MESSAGE TO COMMAND MODULE
MAIN.on('message', message => {
  Commands.run(MAIN, message); return;
});

// SAVE A USER IN THE USER TABLE
MAIN.Save_Sub = (message,area) => {
  if(MAIN.User_Bot == MAIN.BOTS.length-1){ MAIN.User_Bot = 0; } else{ MAIN.User_Bot++; }
  MAIN.database.query(`INSERT INTO pokebot.users (user_id, user_name, geofence, pokemon, quests, raids, status, bot, alert_time, city, pokemon_status, raids_status, quests_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [message.member.id, message.member.user.tag, 'ALL', , , , 'ACTIVE', MAIN.User_Bot, '07:00', area, 'ACTIVE', 'ACTIVE', 'ACTIVE'], function (error, user, fields) {
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
	return MAIN.BOTS[MAIN.Next_Bot].channels.get(channelID).send(embed).catch( error => { pokebotRestart(); console.error(embed,error); });
}

// CHOOSE NEXT BOT AND SEND EMBED
MAIN.Send_DM = (guild_id, user_id, embed, bot) => {
  MAIN.BOTS[bot].guilds.get(guild_id).fetchMember(user_id).then( TARGET => {
    TARGET.send(embed).catch(console.error);
  });
}

// GET QUEST REWARD ICON
MAIN.Get_Icon = (object, questReward) => {
  let questUrl='';
  MAIN.rewards.array.forEach((reward,index) => {
    if(questReward.indexOf(reward.name)>=0){ questUrl=reward.url; }
  }); return questUrl;
}

// CHECK FOR OR CREATE MAP TILES FOR EMBEDS
MAIN.Static_Map_Tile = (lat,lon,type) => {
  return new Promise(function(resolve, reject) {
    let path='./static/'+type+'_tiles/'+lat+','+lon+'.png';
    if(fs.existsSync(path)){ resolve(path); /*console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] USED AN EXISTING MAP TILE FOR '+lat+','+lon+'.');*/ }
    else{
      const zoom = 16, center = [lon,lat], options = { width: 400, height: 220 };
      const map = new StaticMaps(options);
      const marker = { img: `https://i.imgur.com/OGMRWnh.png`, width: 40, height: 40 };
      marker.coord = [lon,lat]; map.addMarker(marker);
      map.render(center, zoom)
        .then(() => map.image.save('./static/'+type+'_tiles/'+lat+','+lon+'.png'))
        //.then(() => console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] New Map Tile Saved for '+lat+','+lon+'.'))
        .then(() => resolve('./static/'+type+'_tiles/'+lat+','+lon+'.png'))
        .catch(function(error){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Unable To Save Map Tile.',error); });
    }
  });
}
// GET WEATHER BOOST
MAIN.Get_Weather = (weather) => {
  return new Promise(resolve => {
    let weatherBoost = '';
    switch(weather){
      case 1: weatherBoost = ' '+MAIN.emotes.clear+' *Boosted*'; break;
      case 2: weatherBoost = ' '+MAIN.emotes.rain+' *Boosted*'; break;
      case 3: weatherBoost = ' '+MAIN.emotes.partlyCloudy+' *Boosted*'; break;
      case 4: weatherBoost = ' '+MAIN.emotes.cloudy+' *Boosted*'; break;
      case 5: weatherBoost = ' '+MAIN.emotes.windy+' *Boosted*'; break;
      case 6: weatherBoost = ' '+MAIN.emotes.snow+' *Boosted*'; break;
      case 7: weatherBoost = ' '+MAIN.emotes.fog+' *Boosted*'; break;
    } resolve(weatherBoost);
  });
}

MAIN.Get_Team = (team_id) => {
  return new Promise(resolve => {
    let weatherBoost = '';
    switch(team_id){
      case 1: defendingTeam = MAIN.emotes.mystic+' Gym'; break;
      case 2: defendingTeam = MAIN.emotes.valor+' Gym'; break;
      case 3: defendingTeam = MAIN.emotes.instinct+' Gym'; break;
      default: defendingTeam='Uncontested Gym';
    } resolve(defendingTeam);
  });
}

// GET WEATHER BOOST
MAIN.Get_Move_Type = (moveNum) => {
  return new Promise(resolve => {
    let emote = '';
    switch(MAIN.moves[moveNum].type){
      case 'Normal': emote = MAIN.emotes.normal; break;
      case 'Grass': emote = MAIN.emotes.grass; break;
      case 'Fire': emote = MAIN.emotes.fire; break;
      case 'Water': emote = MAIN.emotes.water; break;
      case 'Electric': emote = MAIN.emotes.electric; break;
      case 'Ground': emote = MAIN.emotes.ground; break;
      case 'Steel': emote = MAIN.emotes.steel; break;
      case 'Rock': emote = MAIN.emotes.rock; break;
      case 'Psychic': emote = MAIN.emotes.psychic; break;
      case 'Poison': emote = MAIN.emotes.poison; break;
      case 'Fairy': emote = MAIN.emotes.fairy; break;
      case 'Fighting': emote = MAIN.emotes.fighting; break;
      case 'Dark': emote = MAIN.emotes.dark; break;
      case 'Ghost': emote = MAIN.emotes.ghost; break;
      case 'Bug': emote = MAIN.emotes.bug; break;
      case 'Dragon': emote = MAIN.emotes.dragon; break;
      case 'Ice': emote = MAIN.emotes.ice; break;
      case 'Flying': emote = MAIN.emotes.flying; break;
    }
    resolve(emote);
  });
}
// INTERVAL FUNCTION TO SEND QUEST SUBSCRIPTION DMS
setInterval(function() {
  let timeNow=new Date().getTime();
  MAIN.database.query("SELECT * FROM pokebot.quest_alerts WHERE alert_time < "+timeNow, function (error, alerts, fields) {
    if(alerts && alerts[0]){
      alerts.forEach( async (alert,index) => {
        setTimeout(async function() {
          let quest = JSON.parse(alert.quest);
          let city = await MAIN.Get_City(quest);
          MAIN.BOTS[alert.bot].guilds.get(city.discord_id).fetchMember(alert.user_id).then( TARGET => {
            let quest_embed = JSON.parse(alert.embed);
            let attachment = new Discord.Attachment(quest_embed.file.attachment, quest_embed.file.name);
            let alert_embed = new Discord.RichEmbed()
              .setColor(quest_embed.color)
              .setThumbnail(quest_embed.thumbnail.url)
              .addField(quest_embed.fields[0].name, quest_embed.fields[0].value, false)
              .addField(quest_embed.fields[1].name, quest_embed.fields[1].value, false)
              .addField(quest_embed.fields[2].name, quest_embed.fields[2].value, false)
              .setImage(quest_embed.image.url)
              .attachFile(attachment)
              .setImage('attachment://'+quest_embed.file.name)
              .setFooter(quest_embed.footer.text);
            TARGET.send(alert_embed).catch( error => {
              console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+']'+TARGET.user.tag+' ('+alert.user_id+') , Cannot send this user a message.',error);
            });
          });
        }, 2000*index);
      });
      console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Sent '+alerts.length+' Quest Alerts.');
      MAIN.database.query("DELETE FROM pokebot.quest_alerts WHERE alert_time < "+timeNow, function (error, alerts, fields) { if(error){ console.error; } });
    }
  });
}, 60000);

// INTERVAL TO CLEAR MAP TILES TO SAVE DISK SPACE
// schedule.scheduleJob('* * 1 * * *', function(){
//   console.log('Today is recognized by Rebecca Black!');
// });
// setInterval(function() {
//   rimraf('./static/files/*', function () { console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Map Tiles Directory Has Been Cleared.'); });
// }, 86400000);

// SQL QUERY FUNCTION
MAIN.sqlFunction = (sql,data,logSuccess,logError) => {
  return new Promise(resolve => {
  	MAIN.database.query(sql, data, function (error, result, fields) {
  		if(error){ console.error(logError,error); }
      if(logSuccess){ console.info(logSuccess); }
      resolve(result);
  	});
  });
}

// PERFORM AN UPDATE FOR EACH VERSION UP TO LATEST
async function updateEachVersion(version){
  return new Promise(async (resolve) => {
    for(let u = version; u <= MAIN.db.LATEST; u++){
      if(u == MAIN.db.LATEST){ resolve('DONE'); }
      else{
        let updateTo = u+1;
        await MAIN.db[updateTo].forEach(async (update,index) => {
          await MAIN.sqlFunction(update.sql, update.data, '[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] '+update.gLog, update.bLog);
          await MAIN.sqlFunction(`UPDATE pokebot.info SET db_version = ? WHERE db_version = ?`, [updateTo,u], undefined, '[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO UPDATE THE pokebot.info TABLE.')
        });
        await console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Database updated to Version '+updateTo+'.');
      }
    }
  });
}

// CREATE DATABASE, TABLES, AND CHECK FOR UPDATES
async function updateDatabase(){
  return new Promise(async function(resolve, reject) {
    await MAIN.sqlFunction('CREATE DATABASE IF NOT EXISTS pokebot', undefined, undefined,'[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO CREATE THE Pokébot DATABASE.');
    await MAIN.sqlFunction('CREATE TABLE IF NOT EXISTS pokebot.users (user_id TEXT, user_name TEXT, geofence TEXT, pokemon TEXT, quests TEXT, raids TEXT, paused TEXT, bot TEXT, alert_time TEXT, city TEXT)', undefined, undefined,'[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO CREATE THE pokebot.user TABLE.');
    await MAIN.sqlFunction('CREATE TABLE IF NOT EXISTS pokebot.quest_alerts (user_id TEXT, quest TEXT, embed TEXT, area TEXT, bot TEXT, alert_time bigint, city text)', undefined, undefined,'[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO CREATE THE pokebot.quest_alerts TABLE.');
    await MAIN.sqlFunction(`CREATE TABLE IF NOT EXISTS pokebot.info (db_version INT)`, undefined, undefined,'[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO CREATE THE pokebot.info TABLE.');
    await MAIN.database.query(`SELECT * FROM pokebot.info`, async function (error, row, fields) {
      if(!row || !row[0]){
        await MAIN.sqlFunction(`INSERT INTO pokebot.info (db_version) VALUES (?)`,[1], undefined,'[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO INSERT INTO THE pokebot.info TABLE.')
          .then(async (db) => { let version = await updateEachVersion(1); resolve(version); });
      }
      else if(row[0].db_version < MAIN.db.LATEST){
        await console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Database Update Found. Updating...');
        let version = await updateEachVersion(row[0].db_version); resolve(version);
      }
      else{ resolve(false); }
    });
  });
}

// SET ALL TO INVISIBLE ON READY
ALPHA.on('ready', () => { ALPHA.user.setPresence({ status: 'invisible' }); });
BRAVO.on('ready', () => { BRAVO.user.setPresence({ status: 'invisible' }); });
CHARLIE.on('ready', () => { CHARLIE.user.setPresence({ status: 'invisible' }); });
DELTA.on('ready', () => { DELTA.user.setPresence({ status: 'invisible' }); });
ECHO.on('ready', () => { ECHO.user.setPresence({ status: 'invisible' }); });
FOXTROT.on('ready', () => { FOXTROT.user.setPresence({ status: 'invisible' }); });
GULF.on('ready', () => { GULF.user.setPresence({ status: 'invisible' }); });
HOTEL.on('ready', () => { HOTEL.user.setPresence({ status: 'invisible' }); });
INDIA.on('ready', () => { INDIA.user.setPresence({ status: 'invisible' }); });
JULIET.on('ready', () => { JULIET.user.setPresence({ status: 'invisible' }); });
KILO.on('ready', () => { KILO.user.setPresence({ status: 'invisible' }); });
LIMA.on('ready', () => { LIMA.user.setPresence({ status: 'invisible' }); });
MIKE.on('ready', () => { MIKE.user.setPresence({ status: 'invisible' }); });
NOVEMBER.on('ready', () => { NOVEMBER.user.setPresence({ status: 'invisible' }); });
OSCAR.on('ready', () => { OSCAR.user.setPresence({ status: 'invisible' }); });

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
  await console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Logging is set to: '+MAIN.config.CONSOLE_LOGS);
  await console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Pokébot is Ready.');

  // SET ACTIVE BOOLEAN TO TRUE AND BOT POOL TO ZERO
  MAIN.Active = true; MAIN.Next_Bot = 0; MAIN.User_Bot = 0;

  // CHECK FOR CUSTOM EMOTES (CHUCKLESLOVE MERGE)
  if(MAIN.config.Custom_Emotes == false){
    MAIN.emotes = new Emojis.DiscordEmojis();
    MAIN.Custom_Emotes = true;
    MAIN.emotes.Load(MAIN);
  }
  else{
    MAIN.Custom_Emotes = false;
    MAIN.emotes = require('./config/emotes.json'); }
}

// RESTART FUNCTION
function pokebotRestart(){ process.exit(1); }

// CRANK UP THE BOT
async function start(){
  await updateDatabase();
  await botLogin();
}
start();
