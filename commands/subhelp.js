const Discord=require('discord.js');

module.exports.run = async (MAIN, message, args, prefix) => {
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
      .addField('`'+prefix+'mysubs`', 'Shows your current subscriptions and settings.', false);
    if(MAIN.qConfig.Subscriptions=='ENABLED'){ questHelp.addField('`'+prefix+'quest help`', 'Shows **Quest** subscription options.', false); }
    if(MAIN.pConfig.Subscriptions=='ENABLED'){ questHelp.addField('`'+prefix+'pokemon help` | NOT YET ACTIVE', 'Shows **Pokémon** subscription options.', false); }
    if(MAIN.rConfig.Subscriptions=='ENABLED'){ questHelp.addField('`'+prefix+'raid help` | NOT YET ACTIVE', 'Shows **Raid** subscription options.', false); }
    questHelp.addField('`'+prefix+'area help`', 'Shows **Area** subscription options.', false)
      .addField('`'+prefix+'time help`', 'Shows **Quest** subscription delivery time options.', false)
      .addField('`'+prefix+'pause` | `'+prefix+'resume`', 'Pause or Resume your subscription alerts.', false);
    return message.channel.send(questHelp).then(m => m.delete(30000)).catch(console.error);
  }
}
