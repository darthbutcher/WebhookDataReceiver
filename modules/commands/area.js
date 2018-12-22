const Discord=require('discord.js');

module.exports.run = async (MAIN, message, args, prefix) => {
  let availableAreas='', subArea='', areaArray='';
  for(let gf=0; gf<MAIN.geofence.areas.length; gf++){
    availableAreas+=MAIN.geofence.areas[gf].name+'\n';
    areaArray+=MAIN.geofence.areas[gf].name+',';
  }
  areaArray=areaArray.split(',');
  switch(args[0]){
    case undefined:
    case 'help':
      let areaHelp=new Discord.RichEmbed().setColor('00ff00')
        .addField('Area Subscription Commands:', '`'+prefix+'area add [AREA]`\n`'+prefix+'area remove [AREA]`')
        .addField('Available Areas to Subscribe to:', availableAreas);
      return message.channel.send(areaHelp).then(m => m.delete(60000)).catch(console.error);
    case 'add':
      if(!args[1]){ message.reply('You didn\'t not specify an area to subscribe to.').then(m => m.delete(15000)).catch(console.error); }
      else{
        if(!args[2]){ subArea=args[1]; } else{ for(x=1; x<args.length; x++){ subArea+=args[x]+' '; } subArea=subArea.slice(0,-1); }
        subArea=subArea.toLowerCase();
        let subIndex=areaArray.toString().toLowerCase().split(','), sIndex=subIndex.indexOf(subArea);
        if(sIndex<0){ return message.reply('You didn\'t provide a valid area to subscribe to. Type ``'+prefix+'area help` for available areas.').then(m => m.delete(60000)).catch(console.error); }
        else{
          MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ?", [message.member.id], function (error, user, fields) {
            if(!user[0].geofence || user[0].geofence=='ALL'){ userAreas=[]; userAreas.push(areaArray[sIndex]); }
            else if(areaArray[sIndex]=='ALL'){ userAreas='ALL'; }
            else{
              userAreas=user[0].geofence.split(',');
              if(userAreas.indexOf(areaArray[sIndex])>=0){
                return message.reply('You are already subscribed to this area.').then(m => m.delete(15000)).catch(console.error);
              }
              else{ userAreas.push(areaArray[sIndex]); }
            }
            userAreas=userAreas.toString();
            MAIN.database.query("UPDATE pokebot.users SET geofence = ? WHERE user_id = ?", [userAreas,message.member.id], function (error, user, fields) {
              if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(15000)).catch(console.error); }
              else{ return message.reply('Success! You have successfully added `'+areaArray[sIndex]+'` to your areas to receive subscriptions.').then(m => m.delete(15000)).catch(console.error); }
            });
          });
        }
      } break;
    case 'remove':
      if(!args[1]){ message.reply('You didn\'t not specify an area to remove.').then(m => m.delete(15000)).catch(console.error); }
      else{
        // GET ALL ARGUMENTS TO COMBINE INTO THE AREA NAME STRING
        if(!args[2]){ subArea=args[1]; } else{ for(x=1; x<args.length; x++){ subArea+=args[x]+' '; } subArea=subArea.slice(0,-1); }

        // CHECK THE AREA ARRAY FOR THE AREA NAME
        subArea=subArea.toLowerCase();
        let subIndex=areaArray.toString().toLowerCase().split(','), sIndex=subIndex.indexOf(subArea);
        if(sIndex<0){ message.reply('You didn\'t provide a valid area to remove. Type ``'+prefix+'area help` for available areas.').then(m => m.delete(60000)).catch(console.error); }
        else{
          MAIN.database.query("SELECT * FROM pokebot.users WHERE user_id = ?", [message.member.id], function (error, user, fields) {
            if(!user[0].geofence){ return message.reply('You are not currently subscribed to any areas.').then(m => m.delete(15000)).catch(console.error); }
            else{
              userAreas=user[0].geofence.split(',');
              if(userAreas.indexOf(areaArray[sIndex])<0){ return message.reply('You are not subscribed to that area.').then(m => m.delete(15000)).catch(console.error); }
              else{  userAreas=userAreas.splice(sIndex,1); }
              userAreas=userAreas.toString();
              MAIN.database.query("UPDATE pokebot.users SET geofence = ? WHERE user_id = ?", [userAreas,message.member.id], function (error, user, fields) {
                if(error){ return message.reply('There has been an error, please contact an Admin to fix.').then(m => m.delete(15000)).catch(console.error); }
                else{ return message.reply('Success! You have successfully removed `'+areaArray[sIndex]+'` from your area subscriptions.').then(m => m.delete(15000)).catch(console.error); }
              });
            }
          });
        }
      } break;
    default: return;
  }
}
