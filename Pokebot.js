// MODULE REQUIREMENTS
const fs=require('fs');
const mysql = require('mysql');
const moment=require('moment');
const Discord=require('discord.js');
const insideGeofence=require('point-in-polygon');
const express=require('express');
const bodyParser=require('body-parser');

// EVENTS TO DISABLE TO SAVE MEMORY AND CPU
var eventsToDisable = ['channelCreate','channelDelete','channelPinsUpdate','channelUpdate','clientUserGuildSettingsUpdate','clientUserSettingsUpdate',
  'debug','disconnect','emojiCreate','emojiDelete','emojiUpdate','guildBanAdd','guildBanRemove','guildCreate','guildDelete','guildMemberAdd',
  'guildMemberAvailable','guildMembersChunk','guildMemberSpeaking','guildMemberUpdate','guildUnavailable','guildUpdate','messageDelete',
  'messageDeleteBulk','messageReactionAdd','messageReactionRemove','messageReactionRemoveAll','messageUpdate','presenceUpdate','ready',
  'reconnecting','resume','roleCreate','roleDelete','roleUpdate','typingStart','typingStop','userNoteUpdate','userUpdate','voiceStateUpdate','warn'];

// DEFINE BOTS AND DISABLE ALL EVENTS TO SAVE MEMORY AND CPU
const MAIN=new Discord.Client({ disabledEvents: eventsToDisable });
const ALPHA=new Discord.Client({ disabledEvents: eventsToDisable }); const BRAVO=new Discord.Client({ disabledEvents: eventsToDisable });
const CHARLIE=new Discord.Client({ disabledEvents: eventsToDisable }); const DELTA=new Discord.Client({ disabledEvents: eventsToDisable });
const ECHO=new Discord.Client({ disabledEvents: eventsToDisable }); const FOXTROT=new Discord.Client({ disabledEvents: eventsToDisable });
const GULF=new Discord.Client({ disabledEvents: eventsToDisable }); const HOTEL=new Discord.Client({ disabledEvents: eventsToDisable });
const INDIA=new Discord.Client({ disabledEvents: eventsToDisable }); const JULIET=new Discord.Client({ disabledEvents: eventsToDisable });

// GLOBAL VARIABLES
MAIN.BOTS=[];
var urlString;

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
MAIN.feeds=require('./config/feeds.json');

// DATABASE CONNECTION
const dbconfig=require('./config/pokebot_config.json');
MAIN.database = mysql.createConnection({ host: MAIN.config.DB.host, user: MAIN.config.DB.username, password: MAIN.config.DB.password, });

// DEFINE LOGGING & DEBUGGING
MAIN.logging=MAIN.config.CONSOLE_LOGS;
MAIN.debug = {
  "quests": "ENABLED",
  "pokemon": "DISABLED",
  "raids": "DISABLED",
  "detailed": "DISABLED"
};

// DEFINE AND LOAD ALL MODULES
MAIN.modules=new Discord.Collection();
fs.readdir('./modules', (error,files) => {
	let moduleFiles=files.filter(f => f.split('.').pop()==='js'), mCount=0;
	moduleFiles.forEach((script,index) => {
		delete require.cache[require.resolve('./modules/'+script)]; mCount++
		let module=require('./modules/'+script); MAIN.modules.set(script, module);
	}); console.info('[Pokébot] Loaded '+mCount+' Modules.');
});

// DEFINE AND LOAD ALL COMMANDS
MAIN.commands=new Discord.Collection();
fs.readdir('./commands', (err,commands) => {
  let commandFiles=commands.filter(f => f.split('.').pop()==='js'), cCount=0;
  commandFiles.forEach((f,i) => {
    delete require.cache[require.resolve('./commands/'+f)]; cCount++;
    let command=require('./commands/'+f); MAIN.commands.set(f.slice(0,-3), command);
  }); console.log('[Pokébot] Loaded '+cCount+' Commands.');
});

// CREATE SERVER
const app=express().use(bodyParser.json());

// LISTEN FOR PAYLOADS
app.listen(MAIN.config.LISTENING_PORT, () => console.log('[Pokébot] Now listening for payloads on port '+MAIN.config.LISTENING_PORT+'.'));

// ACCEPT AND SEND PAYLOADS TO ITS PARSE FUNCTION
app.post('/', (webhook, resolve) => {
  let PAYLOAD=webhook.body;
  //if(MAIN.logging=='ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Received a Payload of '+PAYLOAD.length+' objects.'); }
	PAYLOAD.forEach((data,index) => {
    let city = MAIN.Get_City(data.message);
		switch(data.type){
			case 'pokemon':
        // SEND TO POKEMON MODULE
				let pokemon=MAIN.modules.get('pokemon.js');
				if(pokemon){ pokemon.run(MAIN, data.message, city); } return;
			case 'raid':
        // SEND TO RAIDS MODULE
				let raids=MAIN.modules.get('raids.js');
				if(raids){ raids.run(MAIN, data.message, city); } return;
			case 'quest':
        // SEND TO QUESTS MODULE
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

MAIN.Save_Sub = (message,area) => {
  if(MAIN.User_Bot==MAIN.BOTS.length-1){ MAIN.User_Bot=0; } else{ MAIN.User_Bot++; }
  MAIN.database.query(`INSERT INTO pokebot.users (user_id, user_name, geofence, pokemon, quests, raids, paused, bot, alert_time, city) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [message.member.id, message.member.user.tag, 'ALL', , , , 'NO', MAIN.User_Bot, '07:00', area], function (error, user, fields) {
    if(error){ console.error('[Pokébot] UNABLE TO ADD USER TO pokebot.users',error); }
    else{
      console.log('[Pokébot] Added '+message.member.user.tag+' to the pokebot.user database.');
      return message.reply('You did not have a subscription record. One has now been created. Please try the command again.').then(m => m.delete(15000)).catch(console.error);
    }
  });
}

// TIME FUNCTION
MAIN.Bot_Time = (time,type) => {
	let now=new Date().getTime();
	if(type==1){ return moment.unix(time).format('h:mm A'); }
	if(type==2){ return moment(now).format('HHmm'); }
	if(type==3){ return moment(time).format('HHmm'); }
  if(type=='quest'){ return moment(now).format('dddd, MMMM Do')+' @ Midnight'; }
  if(type=='stamp'){ return moment(now).format('HH:mmA'); }
}

// GENDER function
MAIN.Get_Gender = (genderID) => {
  let gender='';
  switch(genderID){
    case 1: gender=' | ♂Male'; break;
    case 2: gender=' | ♀Female'; break;
    default: gender='No Gender';
  } return gender;
}

// OBTAIN THE SPRITE FOR THE POKEMON
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

// OBTAIN THE GEOFENCE FOR THE OBJECT
MAIN.Get_Area = (lat,lon) => {
  let area='';
  for(let gf=0; gf<MAIN.geofence.areas.length; gf++){
    if(insideGeofence([lat,lon], MAIN.geofence.areas[gf].coords)){
      area=MAIN.geofence.areas[gf]; if(area.sub_area==true){ return area; }
    }
  } return area;
}

// CHOOSE NEXT BOT AND SEND EMBED
MAIN.Send_Embed = (embed, channelID) => {
  if(MAIN.Next_Bot==MAIN.BOTS.length-1 && MAIN.BOTS[0]){ MAIN.Next_Bot=0; } else{ MAIN.Next_Bot++; }
	return MAIN.BOTS[MAIN.Next_Bot].channels.get(channelID).send(embed).catch( error => {
    pokebotRestart();
    console.error(embed,error);
  });
}

MAIN.Get_City = (object) => {
  let city='';
  for(let c=0;c<MAIN.config.Cities.length; c++){
    if(insideGeofence([object.latitude,object.longitude], MAIN.config.Cities[c].coords)){
      city=MAIN.config.Cities[c]; return city
    }
  }
}

MAIN.Get_Icon = (object, questReward) => {
  let questUrl='';
  MAIN.rewards.array.forEach((reward,index) => {
    console.info(questReward+' '+reward.name);
    console.info(questReward.indexOf(reward.name)>=0);
    if(questReward.indexOf(reward.name)>=0){ console.log('***** MATCHED REWARD *****'); questUrl=reward.url; }
  }); return questUrl;
}

// SQL FUNCTION
MAIN.sqlFunction = (sql,logError,logSuccess) => {
	MAIN.database.query(sql, function (error, result, fields) {
		if(error){ console.error(logError,error); } else{ if(logSuccess){ console.info(logSuccess); } } return result;
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
  setTimeout(function() { message.channel.send('Quest Scanning Progress: ```'+scanned+'/'+total+'```'); }, 2000);
}

// SEND STATUS
function sendStatus(bot, delay, message, THEBOT){
	setTimeout(function() {
		if(bot=='ALL SYSTEMS ARE GO'){
			let botStatus=new Discord.RichEmbed().setColor('00ff00')
				.setAuthor(bot);
			message.channel.send(botStatus).catch( error => { console.error('[LINE575]',error); });
		}
		else{
			let botStatus=new Discord.RichEmbed().setColor('00ccff')
				.setAuthor('Pokébot '+bot+', Standing By.')
			message.channel.send(botStatus).catch( error => { console.error('[LINE580]',error); });
		}
	}, delay);
}

// RESTART FUNCTION
function pokebotRestart(){ process.exit(1); }

// CREATE DATABASE AND TABLE
MAIN.database.query("CREATE DATABASE IF NOT EXISTS pokebot", function (error, results, fields) {
  if(error){ return console.error('[Pokébot] UNABLE TO CREATE THE Pokébot DATABASE.',error); }
  else{
    MAIN.database.query("CREATE TABLE IF NOT EXISTS pokebot.users (user_id TEXT, geofence TEXT, pokemon TEXT, quests TEXT, raids TEXT, paused TEXT, bot TEXT, alert_time TEXT)", function (error, results, fields) {
      if(error){ return console.error('[Pokébot] UNABLE TO CREATE THE pokebot.user TABLE.',error); }
      MAIN.database.query(`CREATE TABLE IF NOT EXISTS pokebot.quest_alerts (user_id TEXT, quest TEXT, embed TEXT, area TEXT, bot TEXT, alert_time bigint)`, function (error, results, fields) {
        if(error){ return console.error('[Pokébot] UNABLE TO CREATE THE pokebot.quest_alerts TABLE.',error); }
      });
    });
  }
});

// INTERVAL FUNCTION TO SEND QUEST SUBSCRIPTION DMS
setInterval(function() {
  let timeNow=new Date().getTime();
  MAIN.database.query("SELECT * FROM pokebot.quest_alerts WHERE alert_time < "+timeNow, function (error, alerts, fields) {
    if(alerts && alerts[0]){
      alerts.forEach((alert,index) => {
        setTimeout(function() {
          MAIN.BOTS[alert.bot].guilds.get('266738315380785152').fetchMember(alert.user_id).then( TARGET => {
            let questEmbed=JSON.parse(alert.embed);
            let alertEmbed=new Discord.RichEmbed()
              .setColor(questEmbed.color)
              .setThumbnail(questEmbed.thumbnail.url)
              .addField(questEmbed.fields[0].name, questEmbed.fields[0].value, false)
              .addField(questEmbed.fields[1].name, questEmbed.fields[1].value, false)
              .addField(questEmbed.fields[2].name, questEmbed.fields[2].value, false)
              .setImage(questEmbed.image.url)
              .setFooter(questEmbed.footer.text);
            TARGET.send(alertEmbed).catch( error => {
              console.error('[Pokébot] '+TARGET.user.tag+' ('+alert.user_id+') , Cannot send this user a message.');
            });
          });
        }, 2000*index);
      });
      console.log('[Pokébot] Sent '+alerts.length+' Quest Alerts.');
      MAIN.database.query("DELETE FROM pokebot.quest_alerts WHERE alert_time < "+timeNow, function (error, alerts, fields) { if(error){ console.error; } });
    }
  });
}, 60000);

// BOT READY
MAIN.on('ready', async () => { MAIN.Next_Bot=0; MAIN.User_Bot=0; console.log('[Pokébot] Logging is set to: '+MAIN.config.CONSOLE_LOGS); console.log('[Pokébot] MAIN is Standing By.'); });
ALPHA.on('ready', async () => { setTimeout(function(){ console.log('[Pokébot] ALPHA is Standing By.'); }, 250); ALPHA.user.setPresence({ status: 'invisible'}); });
BRAVO.on('ready', async () => { setTimeout(function(){ console.log('[Pokébot] BRAVO is Standing By.'); }, 500); BRAVO.user.setPresence({ status: 'invisible'}); });
CHARLIE.on('ready', async () => { setTimeout(function(){ console.log('[Pokébot] CHARLIE is Standing By.');}, 750); CHARLIE.user.setPresence({ status: 'invisible'}); });
DELTA.on('ready', async () => { setTimeout(function(){ console.log('[Pokébot] DELTA is Standing By.'); }, 1000); DELTA.user.setPresence({ status: 'invisible'}); });
ECHO.on('ready', async () => { setTimeout(function(){ console.log('[Pokébot] ECHO is Standing By.'); }, 1250); ECHO.user.setPresence({ status: 'invisible'}); });
FOXTROT.on('ready', async () => { setTimeout(function(){ console.log('[Pokébot] FOXTROT is Standing By.'); }, 1500); FOXTROT.user.setPresence({ status: 'invisible'}); });
GULF.on('ready', async () => { setTimeout(function(){ console.log('[Pokébot] GULF is Standing By.'); }, 1750); GULF.user.setPresence({ status: 'invisible'}); });
HOTEL.on('ready', async () => { setTimeout(function(){ console.log('[Pokébot] HOTEL is Standing By.'); },2000); HOTEL.user.setPresence({ status: 'invisible'}); });
INDIA.on('ready', async () => { setTimeout(function(){ console.log('[Pokébot] INDIA is Standing By.');}, 2250); INDIA.user.setPresence({ status: 'invisible'}); });
JULIET.on('ready', async () => { setTimeout(function(){ console.log('[Pokébot] JULIET is Standing By.'); }, 2500); JULIET.user.setPresence({ status: 'invisible'}); });

// LOG IN BOTS AND ADD TO BOT ARRAY
MAIN.login(MAIN.config.MAIN_BOT_TOKEN);
if(MAIN.config.BOT_TOKENS[0]){ MAIN.BOTS.push(ALPHA); ALPHA.login(MAIN.config.BOT_TOKENS[0]); }
if(MAIN.config.BOT_TOKENS[1]){ MAIN.BOTS.push(BRAVO); BRAVO.login(MAIN.config.BOT_TOKENS[1]); }
if(MAIN.config.BOT_TOKENS[2]){ MAIN.BOTS.push(CHARLIE); CHARLIE.login(MAIN.config.BOT_TOKENS[2]); }
if(MAIN.config.BOT_TOKENS[3]){ MAIN.BOTS.push(DELTA); DELTA.login(MAIN.config.BOT_TOKENS[3]); }
if(MAIN.config.BOT_TOKENS[4]){ MAIN.BOTS.push(ECHO); ECHO.login(MAIN.config.BOT_TOKENS[4]); }
if(MAIN.config.BOT_TOKENS[5]){ MAIN.BOTS.push(FOXTROT); FOXTROT.login(MAIN.config.BOT_TOKENS[5]); }
if(MAIN.config.BOT_TOKENS[6]){ MAIN.BOTS.push(GULF); GULF.login(MAIN.config.BOT_TOKENS[6]); }
if(MAIN.config.BOT_TOKENS[7]){ MAIN.BOTS.push(HOTEL); HOTEL.login(MAIN.config.BOT_TOKENS[7]); }
if(MAIN.config.BOT_TOKENS[8]){ MAIN.BOTS.push(INDIA); INDIA.login(MAIN.config.BOT_TOKENS[8]); }
if(MAIN.config.BOT_TOKENS[9]){ MAIN.BOTS.push(JULIET); JULIET.login(MAIN.config.BOT_TOKENS[9]); }
