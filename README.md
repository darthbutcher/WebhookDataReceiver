# Pokebot

## Join my discord server: https://discord.gg/BthYK68

## Installation:
1: `git clone https://github.com/RussellG89/Pokebot.git` to desired location or download the zip and unzip.
2: cd to the new Pokebot folder
3: Type `node -v` in your terminal to determine if node is installed on your machine.
  - If not or version is less than 10.14, upate or download node.js from here: https://nodejs.org/en/
  - Type `node -v` again in your terminal post install to confirm installation.
4: Install npm package requirements.
  - `npm install [package]` Replace [package] with the names above on by one.
    Packages: 
    - discord.js
    - moment
    - mysql
    - fs
    - point-in-polygon
    - express
    - body-parser
    - pm2
5: Edit the Config files and save them without the `.example` on them.
  - Emotes.json
      > This will be the emotes the bot uses for the embed posts (team emblems and Ex Icon. Images you can upload to your discord server are in the files folder under emotes. To get the emote IDs in you server, type \:youremotename: in discord. This will output something like `<:instinct:499334776189091871>`. Paste those into the emotes.json.example and save as emotes.json.
  - Feed_x.json
      > These are pokemon filters based on PA type, also with a min_iv and max_iv override. If you do not include a Channel_ID, the bot will ignore the filter. 
  - 



  
