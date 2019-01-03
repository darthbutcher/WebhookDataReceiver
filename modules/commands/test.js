const Discord=require('discord.js');

module.exports.run = async (MAIN, message, prefix, discord) => {

  MAIN.Static_Map_Tile(52.4945528,13.437524,"123456789").then(function(imgUrl){

    const attachment = new Discord.Attachment(imgUrl, 'maptile.jpg');
    const embed = new Discord.RichEmbed()
        .setTitle('Wicked Sweet Title')
        .attachFile(attachment)
        .setImage('attachment://maptile.jpg');
    message.channel.send({embed}).catch(console.error);

  });
}
