const Discord = require('discord.js');

module.exports.run = async (MAIN, target, lure, type, main_area, sub_area, embed_area, server, timezone, role_id, embed) => {
  let Embed_Config = require('../../embeds/'+embed);

  // CHECK IF THE TARGET IS A USER
  let member = MAIN.guilds.get(server.id).members.get(target.user_id);
  let pokestop = {type: type, color: '', map_img: ''};
  pokestop.area = embed_area;
  pokestop.lat = lure.latitude;
  pokestop.lon = lure.longitude;

  // GET STATIC MAP TILE
  if(MAIN.config.Map_Tiles == 'ENABLED'){
    pokestop.map_img = await MAIN.Static_Map_Tile(lure.latitude, lure.longitude, 'raid');
  }

  // DETERMINE STOP NAME
  pokestop.name = lure.name;
  pokestop.url = lure.url;

  // DEFINE VARIABLES
  let time_now = new Date().getTime();
  pokestop.time = await MAIN.Bot_Time(lure.lure_expiration, '1', timezone);
  pokestop.mins = Math.floor((lure.lure_expiration-(time_now/1000))/60);
  pokestop.secs = Math.floor((lure.lure_expiration-(time_now/1000)) - (pokestop.mins*60));
  pokestop.map_url = MAIN.config.FRONTEND_URL;

  // GET LURE TYPE, COLOR, AND SPRITE
  switch(type){
    case 'Normal':
      pokestop.color = 'ec78ea';
      pokestop.sprite = 'https://raw.githubusercontent.com/ZeChrales/PogoAssets/master/static_assets/png/TroyKey.png';
    break;
    case 'Glacial':
      pokestop.color = '5feafd';
      pokestop.sprite = 'https://raw.githubusercontent.com/ZeChrales/PogoAssets/master/static_assets/png/TroyKey_glacial.png';
    break;
    case 'Mossy':
      pokestop.color = '72ea38';
      pokestop.sprite = 'https://raw.githubusercontent.com/ZeChrales/PogoAssets/master/static_assets/png/TroyKey_moss.png';
    break;
    case 'Magnetic':
      pokestop.color = 'fac036';
      pokestop.sprite = 'https://raw.githubusercontent.com/ZeChrales/PogoAssets/00dd14bec9d3e17f89ddb021d71853c8b4667cf0/static_assets/png/TroyKey_magnetic.png'
    break;
    default:
      pokestop.color = '188ae2';
      pokestop.sprite = 'https://raw.githubusercontent.com/ZeChrales/PogoAssets/master/static_assets/png/Badge_Pokestop_SILVER_01.png';
    break;
  }
  lure_embed = await Embed_Config(pokestop);
  send_embed(pokestop.mins);

  function send_embed(minutes){
  if(member){
    if(MAIN.config.DEBUG.Lure == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Embed] [lure.js] Sent a '+pokestop.name+' to '+member.user.tag+' ('+member.id+').'); }
    return MAIN.Send_DM(server.id, member.id, lure_embed, target.bot);
  } else if(MAIN.config.LURE.Discord_Feeds == 'ENABLED'){
    if (minutes < MAIN.config.TIME_REMAIN) { return console.error('Timer ('+minutes+') is less than '+MAIN.config.TIME_REMAIN+' '+pokestop.name); }
    if(MAIN.config.DEBUG.Lure == 'ENABLED'){ console.info('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Embed] [lure.js] Sent a '+pokestop.name+' to '+target.guild.name+' ('+target.id+').'); }
    return MAIN.Send_Embed('lure', 0, server, role_id, lure_embed, target.id);
  } else{ return; }}

}
