const Discord=require('discord.js');

module.exports.run = async (MAIN, message, args, prefix, city) => {
  if(args[0]=='admin'){
    let questHelp=new Discord.RichEmbed().setColor('00ff00')
      .setAuthor('Admin Commands:')
      .addField('`'+prefix+'config quest add [QUEST]`', 'Adds a quest that can be subscribed to.', false)
      .addField('`'+prefix+'config quest remove [QUEST]`', 'Removes a quest from being subscribed to', false);
    return message.channel.send(questHelp).then(m => m.delete(30000)).catch(console.error);
  }
  else{
    let questHelp=new Discord.RichEmbed().setColor('00ff00')
      .setAuthor('Available Subscription Commands:')
      .setDescription('Type a Command to view category options.');
    if(MAIN.p_config.Subscriptions == 'ENABLED'){ questHelp.addField('`'+prefix+'pokemon`  |  `'+prefix+'poke`  |  `'+prefix+'p`', 'Initializes Pokemon Subscription Options.', false); }
    if(MAIN.q_config.Subscriptions == 'ENABLED'){ questHelp.addField('`'+prefix+'quest` |  `'+prefix+'q` ', 'Initializes Quest Subscription Options.', false); }
    if(MAIN.r_config.Subscriptions == 'ENABLED'){ questHelp.addField('`'+prefix+'raid`', 'Initializes Raid Subscription Options.', false); }
    questHelp.addField('`'+prefix+'area`', 'Shows Area subscription options.', false)
      .addField('`'+prefix+'pause` | `'+prefix+'resume`', 'Pause or Resume ALL subscription alerts.', false);
    return message.channel.send(questHelp).catch(console.error);
  }
}
