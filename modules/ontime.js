const ontime = require('ontime');
const discords = require('../config/discords.json');

function clear_channel(channel_id){
	let channel = MAIN.channels.get(channel_id);
	if(!channel){ return console.error('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] Could not find a quest channel with ID: '+channel_id); }
	channel.fetchMessages({limit:99}).then(messages => {
		if(messages.size > 0){ channel.bulkDelete(messages); }
		else{ return clear_channel(channel_id); }
	}).catch(console.error);
}

function start_ontime(){
	discords.servers.forEach(function(server){
		if(server.research_channels){
			console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Ontime] Ontime has been set to purge quests for '+server.name+' daily at '+server.quest_reset_time);
			ontime({ cycle: server.quest_reset_time }, function(ot){
				console.log('[Pokébot] ['+MAIN.Bot_Time(null,'stamp')+'] [Ontime] Ontime quest purge has started for '+server.name);
				server.research_channels.forEach((channel_id) => {
					clear_channel(channel_id);
				}); ot.done();
			});
		}
	});
}

module.exports.run = () => {
	start_ontime();
}
