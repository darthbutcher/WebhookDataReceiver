// MODULE REQUIREMENTS
const fs = require('fs');
const ini = require('ini');
const MySQL = require('mysql');
const GeoTz = require('geo-tz');
const Ontime = require('ontime');
const Express = require('express');
const Discord = require('discord.js');
const moment = require('moment-timezone');
const StaticMaps = require('staticmaps');
const BodyParser = require('body-parser');
const InsideGeojson = require('point-in-geopolygon');

// EVENTS TO DISABLE TO SAVE MEMORY AND CPU
var eventsToDisable = ['channelCreate','channelDelete','channelPinsUpdate','channelUpdate','clientUserGuildSettingsUpdate','clientUserSettingsUpdate',
  'debug','disconnect','emojiCreate','emojiDelete','emojiUpdate','guildBanAdd','guildBanRemove','guildCreate','guildDelete','guildMemberAdd',
  'guildMemberAvailable','guildMembersChunk','guildMemberSpeaking','guildMemberUpdate','guildUnavailable','guildUpdate','messageDelete',
  'messageDeleteBulk','messageReactionAdd','messageReactionRemove','messageReactionRemoveAll','messageUpdate','presenceUpdate','ready',
  'reconnecting','resume','roleCreate','roleDelete','roleUpdate','typingStart','typingStop','userNoteUpdate','userUpdate','voiceStateUpdate','warn'];

// DEFINE BOTS AND DISABLE ALL EVENTS TO SAVE MEMORY AND CPU
const MAIN = new Discord.Client({ disabledEvents: eventsToDisable });
const ALPHA = new Discord.Client({ disabledEvents: eventsToDisable });
const BRAVO = new Discord.Client({ disabledEvents: eventsToDisable });
const CHARLIE = new Discord.Client({ disabledEvents: eventsToDisable });
const DELTA = new Discord.Client({ disabledEvents: eventsToDisable });
const ECHO = new Discord.Client({ disabledEvents: eventsToDisable });
const FOXTROT = new Discord.Client({ disabledEvents: eventsToDisable });
const GULF = new Discord.Client({ disabledEvents: eventsToDisable });
const HOTEL = new Discord.Client({ disabledEvents: eventsToDisable });
const INDIA = new Discord.Client({ disabledEvents: eventsToDisable });
const JULIET = new Discord.Client({ disabledEvents: eventsToDisable });
const KILO = new Discord.Client({ disabledEvents: eventsToDisable });
const LIMA = new Discord.Client({ disabledEvents: eventsToDisable });
const MIKE = new Discord.Client({ disabledEvents: eventsToDisable });
const NOVEMBER = new Discord.Client({ disabledEvents: eventsToDisable });
const OSCAR = new Discord.Client({ disabledEvents: eventsToDisable });

// INITIAL LOAD OF CONFIG AND DISCORDS
MAIN.config = ini.parse(fs.readFileSync('./config/config.ini', 'utf-8'));
MAIN.Discord = require('./config/discords.json');

// CACHE DATA FROM JSONS
function load_files(){
  delete require.cache[require.resolve('./static/en.json')];
  MAIN.proto = require('./static/en.json');
  delete require.cache[require.resolve('./static/moves.json')];
  MAIN.moves = require('./static/moves.json');
  delete require.cache[require.resolve('./static/database.json')];
  MAIN.db = require('./static/database.json');
  delete require.cache[require.resolve('./static/types.json')];
  MAIN.types = require('./static/types.json');
  delete require.cache[require.resolve('./static/pokemon.json')];
  MAIN.pokemon = require('./static/pokemon.json');
  delete require.cache[require.resolve('./static/rewards.json')];
  MAIN.rewards = require('./static/rewards.json');
  delete require.cache[require.resolve('./config/discords.json')];
  MAIN.Discord = require('./config/discords.json');
  MAIN.config = ini.parse(fs.readFileSync('./config/config.ini', 'utf-8'));
  return console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Loaded all Configs and Static Files.');
}

// LOAD RAID FEED CHANNELS
const raid_channels = ini.parse(fs.readFileSync('./config/channels_raids.ini', 'utf-8'));
function load_raid_channels(){
  MAIN.Raid_Channels = [];
  for (var key in raid_channels){ MAIN.Raid_Channels.push([key, raid_channels[key]]); }
  return console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Loaded '+MAIN.Raid_Channels.length+' Raid Channels.');
}

// LOAD POKEMON FEED CHANNELS
const pokemon_channels = ini.parse(fs.readFileSync('./config/channels_pokemon.ini', 'utf-8'));
function load_pokemon_channels(){
  MAIN.Pokemon_Channels = [];
  for (var key in pokemon_channels){ MAIN.Pokemon_Channels.push([key, pokemon_channels[key]]); }
  return console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Loaded '+MAIN.Pokemon_Channels.length+' Pokémon Channels');
}

// LOAD QUEST FEED CHANNELS
const quest_channels = ini.parse(fs.readFileSync('./config/channels_quests.ini', 'utf-8'));
function load_quest_channels(){
  MAIN.Quest_Channels = [];
  for (var key in quest_channels){ MAIN.Quest_Channels.push([key, quest_channels[key]]); }
  return console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Loaded '+MAIN.Quest_Channels.length+' Quest Channels.');
}

// DEFINE AND LOAD MODULES
var Raid_Feed, Raid_Subscription, Emojis, Quest_Feed, Quest_Subscription, Pokemon_Feed, Pokemon_Subscription, Commands;
function load_modules(){
  delete require.cache[require.resolve('./modules/raids.js')];
  Raid_Feed = require('./modules/raids.js');
  delete require.cache[require.resolve('./modules/subscriptions/raids.js')];
  Raid_Subscription = require('./modules/subscriptions/raids.js');
  delete require.cache[require.resolve('./modules/quests.js')];
  Quest_Feed = require('./modules/quests.js');
  delete require.cache[require.resolve('./modules//subscriptions/quests.js')];
  Quest_Subscription = require('./modules//subscriptions/quests.js');
  delete require.cache[require.resolve('./modules/pokemon.js')];
  Pokemon_Feed = require('./modules/pokemon.js');
  delete require.cache[require.resolve('./modules//subscriptions/pokemon.js')];
  Pokemon_Subscription = require('./modules//subscriptions/pokemon.js');
  delete require.cache[require.resolve('./modules/emojis.js')];
  Emojis = require('./modules/emojis.js');
  delete require.cache[require.resolve('./modules/commands.js')];
  Commands = require('./modules/commands.js');
  return console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Loaded 5 Modules.');
}

// LOAD Commands
MAIN.Commands = new Discord.Collection();
function load_commands(){
  fs.readdir('./modules/commands', (err,files) => {
    let command_files = files.filter(f => f.split('.').pop()==='js'), command_count = 0;
    command_files.forEach((f,i) => {
      delete require.cache[require.resolve('./modules/commands/'+f)]; command_count++;
      let command = require('./modules/commands/'+f); MAIN.Commands.set(f.slice(0,-3), command);
    }); return console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Loaded '+command_count+' Command Files.')
  });
}

// LOAD FILTERS
MAIN.Filters = new Discord.Collection();
function load_filters(){
  fs.readdir('./filters', (err,filters) => {
    let filter_files = filters.filter(f => f.split('.').pop()==='json'), filter_count = 0;
    filter_files.forEach((f,i) => {
      delete require.cache[require.resolve('./filters/'+f)]; filter_count++;
      let filter = require('./filters/'+f); MAIN.Filters.set(f, filter);
    }); return console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Loaded '+filter_count+' Feed Filters.');
  });
}

// LOAD GEOFENECS
MAIN.Geofences = new Discord.Collection();
function load_geofences(){
  fs.readdir('./geofences', (err,geofences) => {
    let geofence_files = geofences.filter(g => g.split('.').pop()==='json'), geofence_count = 0;
    geofence_files.forEach((g,i) => {;
      delete require.cache[require.resolve('./geofences/'+g)]; geofence_count++;
      let geofence = require('./geofences/'+g); MAIN.Geofences.set(g, geofence);
    }); return console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Loaded '+geofence_count+' Geofence files.');
  });
}

// DATABASE CONNECTION
MAIN.database = MySQL.createConnection({
  host: MAIN.config.DB.host, user: MAIN.config.DB.username, password: MAIN.config.DB.password, port: MAIN.config.DB.port
});

// GLOBAL VARIABLES, LOGGING, & DEBUGGING
MAIN.BOTS = [];
MAIN.logging = MAIN.config.CONSOLE_LOGS;
MAIN.debug = MAIN.config.DEBUG;

// CREATE SERVER
const app = Express().use(BodyParser.json());

// LISTEN FOR PAYLOADS
app.listen(MAIN.config.LISTENING_PORT, () => console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Now listening for payloads on port '+MAIN.config.LISTENING_PORT+'.'));

// ACCEPT AND SEND PAYLOADS TO ITS PARSE FUNCTION
app.post('/', async (webhook, resolve) => {

  let PAYLOAD = webhook.body;
  let discord_match = false;
  let proper_data = false;

  // IGNORE IF BOT HAS NOT BEEN FINISHED STARTUP
  if(MAIN.Active != true){ return; }

  // SEPARATE EACH PAYLOAD AND SORT
  await PAYLOAD.forEach( async (data,index) => {

    // IGNORE IF NOT A SPECIFIED OBJECT
    if(data.type == 'pokemon' || data.type == 'raid' || data.type == 'quest'){

      proper_data = true;

      MAIN.Discord.Servers.forEach( async (server,index) => {

        if(InsideGeojson.polygon(server.geofence, [data.message.longitude,data.message.latitude])){

          // DEFINE AND DETERMINE TIMEZONE
          let timezone = GeoTz(server.geofence[0][1][1], server.geofence[0][1][0])[0]; discord_match = true;

          // DEFINE AREAS FROM GEOFENCE FILE
          let main_area = '', sub_area = '', embed_area = '';
          if(server.geojson_file){
            let geofence = await MAIN.Geofences.get(server.geojson_file);
            await geofence.features.forEach((geo,index) => {
              if(InsideGeojson.polygon(geo.geometry.coordinates, [data.message.longitude,data.message.latitude])){
                if(geo.properties.sub_area != 'true'){ main_area = geo.properties.name; }
                else if(geo.properties.sub_area == 'false'){  sub_area = geo.properties.name; }
              }
            });
          }

          // ASSIGN AREA TO VARIABLES
          if(sub_area){ embed_area = sub_area; }
          if(main_area && !sub_area){ embed_area = main_area; }
          if(!sub_area && !main_area){ embed_area = server.name; }

          // SEND TO OBJECT MODULES
      		switch(data.type){
            // SEND TO POKEMON MODULES
      			case 'pokemon':
              Pokemon_Feed.run(MAIN, data.message, main_area, sub_area, embed_area, server, timezone);
              Pokemon_Subscription.run(MAIN, data.message, main_area, sub_area, embed_area, server, timezone); break;
            // SEND TO RAIDS MODULES
      			case 'raid':
              Raid_Feed.run(MAIN, data.message, main_area, sub_area, embed_area, server, timezone);
              Raid_Subscription.run(MAIN, data.message, main_area, sub_area, embed_area, server, timezone); break;
            // SEND TO QUESTS MODULES
      			case 'quest':
              Quest_Feed.run(MAIN, data.message, main_area, sub_area, embed_area, server, timezone);
              Quest_Subscription.run(MAIN, data.message, main_area, sub_area, embed_area, server, timezone); break;
      		}
        }
      }); return;
    }
	});
  // DEBUG
  if(discord_match == false && proper_data == true){ console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] None of the items contained in the RDM payload matched your discords.json geofences. This error is thrown for multiple reasons. You could be scanning an area outside of your discords.json geofences, your geofences within discords.json are in not in geojson format, or not big enough for your area.',PAYLOAD); }
  return;
});

// SEND MESSAGES TO COMMAND MODULE
MAIN.on('message', message => { return Commands.run(MAIN, message); });
// ALPHA.on('message', message => { return Commands.run(MAIN, message); });
// BRAVO.on('message', message => { return Commands.run(MAIN, message); });
// CHARLIE.on('message', message => { return Commands.run(MAIN, message); });
// DELTA.on('message', message => { return Commands.run(MAIN, message); });
// ECHO.on('message', message => { return Commands.run(MAIN, message); });
// FOXTROT.on('message', message => { return Commands.run(MAIN, message); });
// GULF.on('message', message => { return Commands.run(MAIN, message); });
// HOTEL.on('message', message => { return Commands.run(MAIN, message); });
// INDIA.on('message', message => { return Commands.run(MAIN, message); });
// JULIET.on('message', message => { return Commands.run(MAIN, message); });
// KILO.on('message', message => { return Commands.run(MAIN, message); });
// LIMA.on('message', message => { return Commands.run(MAIN, message); });
// MIKE.on('message', message => { return Commands.run(MAIN, message); });
// NOVEMBER.on('message', message => { return Commands.run(MAIN, message); });
// OSCAR.on('message', message => { return Commands.run(MAIN, message); });

// SAVE A USER IN THE USER TABLE
MAIN.Save_Sub = (message,server) => {
  MAIN.database.query('SELECT * FROM '+MAIN.config.DB.pokebot_db_name+'.info', function (error, info, fields) {
    let next_bot = info[0].user_next_bot, split = MAIN.config.QUEST.Default_Delivery.split(':');
    if(next_bot == MAIN.BOTS.length-1){ next_bot = 0; } else{ next_bot++; }
    let quest_time = moment(), timezone = GeoTz(server.geofence[0][0][1], server.geofence[0][0][0]);
    quest_time = moment.tz(quest_time, timezone[0]).set({hour: split[0], minute: split[1] ,second:0 ,millisecond:0});
    quest_time = moment.tz(quest_time, MAIN.config.TIMEZONE).format('HH:mm');
    MAIN.database.query('INSERT INTO '+MAIN.config.DB.pokebot_db_name+'.users (user_id, user_name, geofence, pokemon, quests, raids, status, bot, alert_time, discord_id, pokemon_status, raids_status, quests_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [message.member.id, message.member.user.tag, server.name, , , , 'ACTIVE', next_bot, quest_time, message.guild.id, 'ACTIVE', 'ACTIVE', 'ACTIVE'], function (error, user, fields) {
      if(error){ return console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO ADD USER TO '+MAIN.config.DB.pokebot_db_name+'.users',error); }
      else{
        MAIN.sqlFunction('UPDATE '+MAIN.config.DB.pokebot_db_name+'.info SET user_next_bot = ?',[next_bot],undefined,undefined);
        return console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Added '+message.member.user.tag+' to the '+MAIN.config.DB.pokebot_db_name+'.user database.');
      }
    });
  }); return;
}

// RETURN TIME FUNCTION
MAIN.Bot_Time = (time,type,timezone) => {
	let now = new Date().getTime();
	if(type == 1){ return moment.unix(time).tz(timezone).format('h:mm A');  }
	if(type == 2){ return moment(now).tz(timezone).format('HHmm'); }
	if(type == 3){ return moment(time).tz(timezone).format('HHmm'); }
  if(type == 'quest'){ return moment(now).tz(timezone).format('dddd, MMMM Do')+' @ Midnight'; }
  if(type == 'stamp'){ return moment(now).format('HH:mmA'); }
}

// OBTAIN POKEMON SPRITE
MAIN.Get_Sprite = (form, id) => {
  let sprite_url = '';
  switch(id.toString().length){
    case 1: sprite_url = 'https://www.serebii.net/sunmoon/pokemon/00'+id+'.png'; break;
    case 2: sprite_url = 'https://www.serebii.net/sunmoon/pokemon/0'+id+'.png'; break;
    case 3: sprite_url = 'https://www.serebii.net/sunmoon/pokemon/'+id+'.png'; break;
  }
  // CHECK FOR ALOLAN
  if(form > 0 && MAIN.pokemon.alolan_forms.indexOf(form) >= 0){ sprite_url = sprite_url.toString().slice(0,-4)+'-a.png'; }
  if(form == 'shiny'){ sprite_url = 'https://www.serebii.net/Shiny/SM/'+id+'.png'; }
  return sprite_url;
}

// CHOOSE NEXT BOT AND SEND EMBED
MAIN.Send_Embed = (embed, channel_id) => {
  if(MAIN.Next_Bot == MAIN.BOTS.length-1 && MAIN.BOTS[0]){ MAIN.Next_Bot = 0; } else{ MAIN.Next_Bot++; }
	return MAIN.BOTS[MAIN.Next_Bot].channels.get(channel_id).send(embed).catch( error => { console.error('['+channel_id+'] ['+MAIN.BOTS[MAIN.Next_Bot].id+']',error); pokebotRestart(); });
}

// CHOOSE NEXT BOT AND SEND EMBED
MAIN.Send_DM = (guild_id, user_id, embed, bot) => {
  MAIN.BOTS[bot].guilds.get(guild_id).fetchMember(user_id).then( TARGET => {
    return TARGET.send(embed).catch(console.error);
  });
}

// GET QUEST REWARD ICON
MAIN.Get_Icon = (object, quest_reward) => {
  let questUrl = '';
  MAIN.rewards.array.forEach((reward,index) => {
    if(quest_reward.indexOf(reward.name) >= 0){ questUrl = reward.url; }
  }); return questUrl;
}

// CHECK FOR OR CREATE MAP TILES FOR EMBEDS
MAIN.Static_Map_Tile = (lat,lon,type) => {
  return new Promise(function(resolve, reject) {
    let path = MAIN.config.IMAGE_DIR+type+'_tiles/'+lat+','+lon+'.png';
    let url = MAIN.config.HOST+type+'_tiles/'+lat+','+lon+'.png';
    if(fs.existsSync(path)){ return resolve(url); }
    else{
      let zoom = 16, center = [lon,lat], options = { width: parseInt(MAIN.config.Tile_Width), height: parseInt(MAIN.config.Tile_Height) }, map = new StaticMaps(options);
      let marker = { img: `https://i.imgur.com/OGMRWnh.png`, width: 40, height: 40 }; marker.coord = [lon,lat];
      map.addMarker(marker);
      map.render(center, zoom)
        .then(() => { map.image.save('./static/images/'+type+'_tiles/'+lat+','+lon+'.png'); })
        .then(() => { console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Map Tiles] Saved a new map tile to '+type+'_images.'); return resolve(url); })
        .catch(function(err){ console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO SAVE MAP TILE'); return resolve(undefined); });
    } return;
  });
}

// GET EMOTE
MAIN.Get_Type = (variable) => {
  return new Promise(resolve => {
    switch(MAIN.moves[variable].type){
      case 'Normal': return resolve(MAIN.emotes.normal); break;
      case 'Grass': return resolve(MAIN.emotes.grass); break;
      case 'Fire': return resolve(MAIN.emotes.fire); break;
      case 'Water': return resolve(MAIN.emotes.water); break;
      case 'Electric': return resolve(MAIN.emotes.electric); break;
      case 'Ground': return resolve(MAIN.emotes.ground); break;
      case 'Steel': return resolve(MAIN.emotes.steel); break;
      case 'Rock': return resolve(MAIN.emotes.rock); break;
      case 'Psychic': return resolve(MAIN.emotes.psychic); break;
      case 'Poison': return resolve(MAIN.emotes.poison); break;
      case 'Fairy': return resolve(MAIN.emotes.fairy); break;
      case 'Fighting': return resolve(MAIN.emotes.fighting); break;
      case 'Dark': return resolve(MAIN.emotes.dark); break;
      case 'Ghost': return resolve(MAIN.emotes.ghost); break;
      case 'Bug': return resolve(MAIN.emotes.bug); break;
      case 'Dragon': return resolve(MAIN.emotes.dragon); break;
      case 'Ice': return resolve(MAIN.emotes.ice); break;
      case 'Flying': return resolve(MAIN.emotes.flying); break;
      default: return resolve(undefined);
    }
  });
}

// INTERVAL FUNCTION TO SEND QUEST SUBSCRIPTION DMS
setInterval(function() {
  let timeNow = new Date().getTime();
  MAIN.database.query('SELECT * FROM '+MAIN.config.DB.pokebot_db_name+'.quest_alerts WHERE alert_time < '+timeNow, function (error, alerts, fields) {
    if(alerts && alerts[0]){
      alerts.forEach( async (alert,index) => {
        setTimeout(async function() {
          let guild = MAIN.BOTS[alert.bot].guilds.get(alert.discord_id);
          let user = guild.fetchMember(alert.user_id).catch(error => { console.error('[BAD USER ID] '+alert.user_id, error); });
          MAIN.BOTS[alert.bot].guilds.get(alert.discord_id).fetchMember(alert.user_id).then( TARGET => {
            let quest_embed = JSON.parse(alert.embed);
            let alert_embed = new Discord.RichEmbed()
              .setColor(quest_embed.color)
              .setThumbnail(quest_embed.thumbnail.url)
              .addField(quest_embed.fields[0].name, quest_embed.fields[0].value, false)
              .addField(quest_embed.fields[1].name, quest_embed.fields[1].value, false)
              .addField(quest_embed.fields[2].name, quest_embed.fields[2].value, false)
              .setImage(quest_embed.image.url)
              .setFooter(quest_embed.footer.text);
            TARGET.send(alert_embed).catch( error => {
              return console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] '+TARGET.user.tag+' ('+alert.user_id+') , Cannot send this user a message.',error);
            });
          });
        }, 2000*index);
      });
      console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Sent '+alerts.length+' Quest Alerts out.');
      return MAIN.database.query('DELETE FROM '+MAIN.config.DB.pokebot_db_name+'.quest_alerts WHERE alert_time < '+timeNow, function (error, alerts, fields) { if(error){ console.error; } });
    }
  }); return;
}, 60000);

// SQL QUERY FUNCTION
MAIN.sqlFunction = (sql,data,logSuccess,logError) => {
  return new Promise(resolve => {
  	MAIN.database.query(sql, data, function (error, result, fields) {
  		if(error){ console.error(logError,error); }
      if(logSuccess){ console.info(logSuccess); }
      return resolve(result);
  	}); return;
  });
}

// PERFORM AN UPDATE FOR EACH VERSION UP TO LATEST
async function update_each_version(version){
  return new Promise(async (resolve) => {
    for(let u = version; u <= MAIN.db.LATEST; u++){
      if(u == MAIN.db.LATEST){ resolve('DONE'); }
      else{
        let update_to = u+1;
        await MAIN.db[update_to].forEach(async (update,index) => {
          await MAIN.sqlFunction(update.sql, update.data, '[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] '+update.gLog, update.bLog);
          await MAIN.sqlFunction('UPDATE '+MAIN.config.DB.pokebot_db_name+'.info SET db_version = ? WHERE db_version = ?', [update_to,u], undefined, '[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO UPDATE THE '+MAIN.config.DB.pokebot_db_name+'.info TABLE.')
        });
        await console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Database updated to Version '+update_to+'.');
      }
    } return;
  });
}

// CREATE DATABASE, TABLES, AND CHECK FOR UPDATES
async function update_database(){
  return new Promise(async function(resolve, reject) {
    await MAIN.sqlFunction('CREATE DATABASE IF NOT EXISTS pokebot', undefined, undefined,'[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO CREATE THE Pokébot DATABASE.');
    await MAIN.sqlFunction('CREATE TABLE IF NOT EXISTS '+MAIN.config.DB.pokebot_db_name+'.users (user_id TEXT, user_name TEXT, geofence TEXT, pokemon TEXT, quests TEXT, raids TEXT, paused TEXT, bot TEXT, alert_time TEXT, city TEXT)', undefined, undefined,'[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO CREATE THE '+MAIN.config.DB.pokebot_db_name+'.user TABLE.');
    await MAIN.sqlFunction('CREATE TABLE IF NOT EXISTS '+MAIN.config.DB.pokebot_db_name+'.quest_alerts (user_id TEXT, quest TEXT, embed TEXT, area TEXT, bot TEXT, alert_time bigint, city text)', undefined, undefined,'[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO CREATE THE '+MAIN.config.DB.pokebot_db_name+'.quest_alerts TABLE.');
    await MAIN.sqlFunction('CREATE TABLE IF NOT EXISTS '+MAIN.config.DB.pokebot_db_name+'.info (db_version INT)', undefined, undefined,'[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO CREATE THE '+MAIN.config.DB.pokebot_db_name+'.info TABLE.');
    await MAIN.database.query('SELECT * FROM '+MAIN.config.DB.pokebot_db_name+'.info', async function (error, row, fields) {
      if(!row || !row[0]){
        await MAIN.sqlFunction('INSERT INTO '+MAIN.config.DB.pokebot_db_name+'.info (db_version) VALUES (?)', [1], undefined,'[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] UNABLE TO INSERT INTO THE '+MAIN.config.DB.pokebot_db_name+'.info TABLE.')
          .then(async (db) => {
            let version = await update_each_version(1);
            return resolve(version);
          });
      }
      else if(row[0].db_version < MAIN.db.LATEST){
        await console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Database Update Found. Updating...');
        let version = await update_each_version(row[0].db_version);
        return resolve(version);
      }
      else{ return resolve(false); }
    }); return;
  });
}

// SET ALL TO INVISIBLE ON READY
MAIN.on('ready', () => {
  return console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Main is logged in.');
});
ALPHA.on('ready', () => {
  console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Alpha is logged in.');
  return ALPHA.user.setPresence({ status: 'invisible' });
});
BRAVO.on('ready', () => {
  console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Bravo is logged in.');
  return BRAVO.user.setPresence({ status: 'invisible' });
});
CHARLIE.on('ready', () => {
  console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Charlie is logged in.');
  return CHARLIE.user.setPresence({ status: 'invisible' });
});
DELTA.on('ready', () => {
  console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Delta is logged in.');
  return DELTA.user.setPresence({ status: 'invisible' });
});
ECHO.on('ready', () => {
  console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Echo is logged in.');
  return ECHO.user.setPresence({ status: 'invisible' });
});
FOXTROT.on('ready', () => {
  console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Foxtrot is logged in.');
  return FOXTROT.user.setPresence({ status: 'invisible' });
});
GULF.on('ready', () => {
  console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Gulf is logged in.');
  return GULF.user.setPresence({ status: 'invisible' });
});
HOTEL.on('ready', () => {
  console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Hotel is logged in.');
  return HOTEL.user.setPresence({ status: 'invisible' });
});
INDIA.on('ready', () => {
  console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] India is logged in.');
  return INDIA.user.setPresence({ status: 'invisible' });
});
JULIET.on('ready', () => {
  console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Juliet is logged in.');
  return JULIET.user.setPresence({ status: 'invisible' });
});
KILO.on('ready', () => {
  console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Kilo is logged in.');
  return KILO.user.setPresence({ status: 'invisible' });
});
LIMA.on('ready', () => {
  console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Lima is logged in.');
  return LIMA.user.setPresence({ status: 'invisible' });
});
MIKE.on('ready', () => {
  console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Mike is logged in.');
  return MIKE.user.setPresence({ status: 'invisible' });
});
NOVEMBER.on('ready', () => {
  console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] November is logged in.');
  return NOVEMBER.user.setPresence({ status: 'invisible' });
});
OSCAR.on('ready', () => {
  console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Oscar is logged in.');
  return OSCAR.user.setPresence({ status: 'invisible' });
});

// LOG IN BOTS AND ADD TO BOT ARRAY
async function bot_login(){
  let token = MAIN.config.TOKENS;
  console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Logging in Main...');
  await MAIN.login(token.MAIN);
  if(token.BOT_TOKENS[0] && token.BOT_TOKENS[0] != 'TOKEN'){
    await MAIN.BOTS.push(ALPHA);
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Logging in Alpha...');
    await ALPHA.login(token.BOT_TOKENS[0]);
  }
  if(token.BOT_TOKENS[1] && token.BOT_TOKENS[1] != 'TOKEN'){
    MAIN.BOTS.push(BRAVO);
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Logging in Bravo...');
    await BRAVO.login(token.BOT_TOKENS[1]);
  }
  if(token.BOT_TOKENS[2] && token.BOT_TOKENS[2] != 'TOKEN'){
    MAIN.BOTS.push(CHARLIE);
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Logging in Charlie...');
    await CHARLIE.login(token.BOT_TOKENS[2]);
  }
  if(token.BOT_TOKENS[3] && token.BOT_TOKENS[3] != 'TOKEN'){
    MAIN.BOTS.push(DELTA);
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Logging in Delta...');
    await DELTA.login(token.BOT_TOKENS[3]);
  }
  if(token.BOT_TOKENS[4] && token.BOT_TOKENS[4] != 'TOKEN'){
    MAIN.BOTS.push(ECHO);
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Logging in Echo...');
    await ECHO.login(token.BOT_TOKENS[4]);
  }
  if(token.BOT_TOKENS[5] && token.BOT_TOKENS[5] != 'TOKEN'){
    MAIN.BOTS.push(FOXTROT);
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Logging in Foxtrot...');
    await FOXTROT.login(token.BOT_TOKENS[5]);
  }
  if(token.BOT_TOKENS[6] && token.BOT_TOKENS[6] != 'TOKEN'){
    MAIN.BOTS.push(GULF);
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Logging in Gulf...');
    await GULF.login(token.BOT_TOKENS[6]); }
  if(token.BOT_TOKENS[7] && token.BOT_TOKENS[7] != 'TOKEN'){
    MAIN.BOTS.push(HOTEL);
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Logging in Hotel...');
    await HOTEL.login(token.BOT_TOKENS[7]);
  }
  if(token.BOT_TOKENS[8] && token.BOT_TOKENS[8] != 'TOKEN'){
    MAIN.BOTS.push(INDIA);
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Logging in India...');
    await INDIA.login(token.BOT_TOKENS[8]);
  }
  if(token.BOT_TOKENS[9] && token.BOT_TOKENS[9] != 'TOKEN'){
    MAIN.BOTS.push(JULIET);
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Logging in Juliet...');
    await JULIET.login(token.BOT_TOKENS[9]);
  }
  if(token.BOT_TOKENS[10] && token.BOT_TOKENS[10] != 'TOKEN'){
    MAIN.BOTS.push(KILO);
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Logging in Kilo...');
    await KILO.login(token.BOT_TOKENS[10]);
  }
  if(token.BOT_TOKENS[11] && token.BOT_TOKENS[11] != 'TOKEN'){
    MAIN.BOTS.push(LIMA);
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Logging in Lima...');
    await LIMA.login(token.BOT_TOKENS[11]);
  }
  if(token.BOT_TOKENS[12] && token.BOT_TOKENS[12] != 'TOKEN'){
    MAIN.BOTS.push(MIKE);
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Logging in Mike...');
    await MIKE.login(token.BOT_TOKENS[12]);
  }
  if(token.BOT_TOKENS[13] && token.BOT_TOKENS[13] != 'TOKEN'){
    MAIN.BOTS.push(NOVEMBER);
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Logging in November...');
    await NOVEMBER.login(token.BOT_TOKENS[13]);
  }
  if(token.BOT_TOKENS[14] && token.BOT_TOKENS[14] != 'TOKEN'){
    MAIN.BOTS.push(OSCAR);
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Logging in Oscar...');
    await OSCAR.login(token.BOT_TOKENS[14]); }
  if(MAIN.config.DEBUG.Quests == 'ENABLED'){
    await console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Quest Debugging is ENABLED.');
  }
  if(MAIN.config.DEBUG.Raids == 'ENABLED'){
    await console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Raid Debugging is ENABLED.');
  }
  if(MAIN.config.DEBUG.Pokemon == 'ENABLED'){
    await console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Pokemon Debugging is ENABLED.');
  }
  if(MAIN.config.DEBUG.Subscriptions == 'ENABLED'){
    await console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Subscription Debugging is ENABLED.');
  }
  if(MAIN.config.CONSOLE_LOGS == 'ENABLED'){
    await console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Console Logging is ENABLED');
  }
  console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Start-Up] Pokébot is Ready.');

  // SET ACTIVE BOOLEAN TO TRUE AND BOT POOL TO ZERO
  MAIN.Active = true; MAIN.Next_Bot = 0;

  // CHECK FOR CUSTOM EMOTES (CHUCKLESLOVE MERGE)
  if(MAIN.config.EMOTES.Custom == false){
    MAIN.emotes = new Emojis.DiscordEmojis();
    MAIN.emotes.Load(MAIN);
  } else{ MAIN.emotes = ini.parse(fs.readFileSync('./config/emotes.ini', 'utf-8')); }
  return;
}

var ontime_servers = [], ontime_times = [];
MAIN.Discord.Servers.forEach(function(server){
  let server_purge = moment(), timezone = GeoTz(server.geofence[0][0][1], server.geofence[0][0][0]);
  server_purge = moment.tz(server_purge, timezone[0]).set({hour:23,minute:50,second:0,millisecond:0});
  server_purge = moment.tz(server_purge, MAIN.config.TIMEZONE).format('HH:mm:ss');
  if(server.purge_channels == 'ENABLED'){
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Ontime] Channel purge set for '+server.name+' at '+server_purge);
  }
  ontime_times.push(server_purge); ontime_servers.push(server);
});

Ontime({ cycle: ontime_times }, function(ot) {
  let now = moment().format('HH:mm')+':00';
	ontime_servers.forEach(function(server){
    if(server.purge_channels == 'ENABLED'){
      let purge_time = moment(), timezone = GeoTz(server.geofence[0][1][1], server.geofence[0][1][0]);
      purge_time = moment.tz(purge_time, timezone[0]).set({hour:23,minute:50,second:0,millisecond:0});
      purge_time = moment.tz(purge_time, MAIN.config.TIMEZONE).format('HH:mm:ss');
      if(now == purge_time){
        console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Ontime] Ontime channel purge has started for '+server.name);
    		for(var i = 0; i < server.channels_to_purge.length; i++){ clear_channel(server.channels_to_purge[i]); }
      }
    }
	}); return ot.done();
});

function clear_channel(channel_id){
  return new Promise( async function(resolve) {
    let channel = await MAIN.channels.get(channel_id);
    if(!channel) { resolve(false); return console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Ontime] Could not find a channel with ID: '+channel_id); }
    channel.fetchMessages({limit:99}).then(messages => {
      channel.bulkDelete(messages).then(deleted => {
        if(messages.size > 0){ clear_channel(channel_id).then(result => { return resolve(true); }); }
        else{
          console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Ontime] Purged all messages in '+channel.name+' ('+channel.id+')');
          return resolve(true);
        }
      }).catch(console.error);
    });
  });
}

// CHECK DATABASE FOR UPGRADED OR REMOVED POKESTOPS
let check_time = moment();
check_time = moment.tz(check_time, 'America/Los_Angeles').set({hour:23,minute:40,second:0,millisecond:0});
check_time = moment.tz(check_time, MAIN.config.TIMEZONE).format('HH:mm:ss');
Ontime({ cycle: check_time }, function(ot) {
  if(MAIN.config.DB.Remove_Upgraded_Pokestops == 'ENABLED'){
    MAIN.sqlFunction('UPDATE '+MAIN.config.DB.rdm_db_name+'.gym INNER JOIN pokestop ON gym.id = pokestop.id SET gym.name=pokestop.name, gym.url=pokestop.url WHERE gym.id = pokestop.id; DELETE FROM pokestop WHERE id IN (SELECT id FROM gym);',undefined,undefined,undefined);
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Ontime] Ran Query to remove Upgraded Pokestops.');
  }
  if(MAIN.config.DB.Remove_Unseen_Pokestops == 'ENABLED'){
    MAIN.sqlFunction('DELETE FROM '+MAIN.config.DB.rdm_db_name+'.pokestop WHERE updated < UNIX_TIMESTAMP()-90000',undefined,undefined,undefined);
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Ontime] Ran Query to remove Stale Pokestops.');
  }
  if(MAIN.config.DB.Trim_Pokemon_Table == 'ENABLED'){
    let prune_time = parseInt(MAIN.config.DB.Trim_Days)*86400;
    MAIN.sqlFunction('DELETE FROM '+MAIN.config.DB.rdm_db_name+'.pokemon WHERE updated < UNIX_TIMESTAMP()-'+prune_time,undefined,undefined,undefined);
    console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Ontime] Ran Query to trim Pokemon table.');
  }
  return ot.done();
});

// RESTART FUNCTION
function pokebotRestart(){ process.exit(1); }

// CRANK UP THE BOT
MAIN.start = async (type) => {
  await load_files();
  await load_filters();
  await load_modules();
  await load_commands();
  await load_geofences();
  await update_database();
  await load_raid_channels();
  await load_quest_channels();
  await load_pokemon_channels();
  switch(type){
    case 'startup': return bot_login(); break;
    case 'reload': return console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Re-Load] Pokébot has re-loaded.'); break;
  } return;
}
MAIN.start('startup');
