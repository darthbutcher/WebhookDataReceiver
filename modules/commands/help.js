const Discord=require('discord.js');

module.exports.run = async (MAIN, message, prefix, discord) => {
  let quest_help = new Discord.RichEmbed().setColor('00ff00')
    .setAuthor('Available Subscription Commands:')
    .setDescription('Type a Command to view category options.');
  if(MAIN.config.POKEMON.Subscriptions == 'ENABLED'){ quest_help.addField('`'+prefix+'pokemon`  |  `'+prefix+'p`', 'Initializes Pokemon Subscription Options.', false); }
  if(MAIN.config.QUEST.Subscriptions == 'ENABLED'){ quest_help.addField('`'+prefix+'quest` |  `'+prefix+'q` ', 'Initializes Quest Subscription Options.', false); }
  if(MAIN.config.RAID.Subscriptions == 'ENABLED'){ quest_help.addField('`'+prefix+'raid` |  `'+prefix+'r` ', 'Initializes Raid Subscription Options.', false); }
  quest_help.addField('`'+prefix+'area`', 'Shows Area subscription options.', false)
  quest_help.addField('`'+prefix+'pause` | `'+prefix+'resume`', 'Pause or Resume ALL subscription alerts.', false);
  quest_help.addBlankField(true)
  if(MAIN.config.pmsfDB.Search == 'ENABLED'){ quest_help.addField('`'+prefix+'nest` |  `'+prefix+'n` ', 'Initializes Nest Search.', false); }
  quest_help.addField('`'+prefix+'stats` |  `'+prefix+'s` ', 'Initializes Pokémon stats lookup.', false);
  quest_help.addField('`'+prefix+'cp` ', 'Initializes perfect Pokémon CP string lookup.', false);
  quest_help.addField('`'+prefix+'raidcp` ', 'Initializes raid Pokemon top CPs table.', false);
  quest_help.addField('`'+prefix+'questcp` ', 'Initializes quest Pokemon top CPs table.', false);
  quest_help.addField('`'+prefix+'dex` ', 'Initializes Pokedex search.', false);
  return message.channel.send(quest_help).catch(console.error);
}
