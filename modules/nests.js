//    let NEST=event.affectedRows[0].after;
// 		if(!webhook_nests){console.error('##### NO WEBHOOK FOR NESTS HAS BEEN SET IN files/webhooks_config.json #####');return;}
// 		if(event.data.pokemon_id<1){return;}
// 		migrationDate=config.MIGRATION_DATE*1000; timeNow=new Date().getTime();
// 		if(migrationDate<timeNow){ //CHECK AND RESET MIGRATION DATE IF NECESSARY
// 			config.MIGRATION_DATE=config.MIGRATION_DATE+1209600; migrationDate=config.MIGRATION_DATE;
// 			fs.writeFile("./files/pokebot_config.json",JSON.stringify(config,null,4),"utf8",function(err){if(err)throw err;});
// 		}
// 		expireDate=moment(migrationDate).format('dddd, MMMM Do, h:mm A');
// 		richEmbed=new Discord.RichEmbed().setThumbnail(pokemonIcon+event.data.pokemon_id+iconFileType)
// 			.setTitle('A '+pokemon[event.data.pokemon_id]+' Nest has been Reported!')
// 			.addField('Directions:','[Google Maps](https://www.google.com/maps?q='+event.data.lat+','+event.data.lon+') | [Apple Maps](http://maps.apple.com/maps?daddr='+event.data.lat+','+event.data.lon+'&z=10&t=s&dirflg=w) | [Waze](https://waze.com/ul?ll='+event.data.lat+','+event.data.lon+'&navigate=yes)',false)
// 			.setImage('https://maps.googleapis.com/maps/api/staticmap?center='+event.data.lat+','+event.data.lon+'&markers='+event.data.lat+','+event.data.lon+'&size=450x220&zoom=16')
// 			.setFooter('This nest will expire on '+expireDate);
// 		if(event.data.submitted_by){richEmbed.setDescription('Submitted by '+event.data.submitted_by);}
// 		return webhook_nests.send(richEmbed).catch(console.error);
