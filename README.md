# Pokebot

## Join my discord server: https://discord.gg/NnujtZ4

### This bot requires intermediate knowledge of discord and bots. This is **not** for a beginner user.

## This project is in Beta. So you will see errors at some point. 

# Installation:
### 1: `git clone https://github.com/RussellG89/Pokebot.git` to desired location or download the zip and unzip.

### 2: cd to the new Pokebot folder

### 3: Type `node -v` in your terminal to determine if node is installed on your machine.
  - If not or version is less than 10.14, upate or download node.js from here: https://nodejs.org/en/
  - Type `node -v` again in your terminal post install to confirm installation.
  
### 4: Install npm package requirements.
  - `npm install [package]` Replace [package] with the names above on by one.
    Packages: 
    - discord.js
    - moment
    - mysql
    - fs
    - point-in-polygon
    - express
    - body-parser
    - rimraf
    - staticmaps
    - pm2 (must be installed with -g flag and sometimes as sudo. `npm install -g pm2`.
    
### 5: Edit the Config files and save them without the `.example` on them.
  - Emotes.json
      - This will be the emotes the bot uses for the embed posts (team emblems and Ex Icon. Images you can upload to your discord server are in the files folder under emotes. To get the emote IDs in you server, type \:youremotename: in discord. This will output something like `<:instinct:499334776189091871>`. Paste those into the emotes.json.example and save as emotes.json.
      - These are pokemon filters based on PA type, also with a min_iv and max_iv override. If you do not include a Channel_ID, the bot will ignore the filter. 
  - Geofences.json
      - Geofences of areas to label your pokemon/raid/quest posts with and for users to subscribe to alerts with.
  - Pokebot_config.json
      - Contains the meat and potato configs. Main token will be the main bot to respond in the subscription channel. The array of other bot tokens are for channel posts and DMs to avoid rate limits. Up to 10 bot tokens can be used at this time. If you have less than 10, delete the other example numbers or you will get invalid credential errors when starting the script. For "Cities", you only need to put one City if you scan only one. If you have multiple cities and want separate feeds, then you would add more cities. The geofence for this city is to identify the City. 
      - The Main Bot requires at minimum Manage Messages, View Channel, and Manage Channel permissions for the subscription channel.
  
## 6: Feeds
  In /feeds you will find examples of pokemon, quest, and raid feeds. These files can be named whatever you want, there is no more name requirement.
  #### Quests
   - The "Type" field must be "quest".
   - Quest feeds can be filtered by reward and/or encounter. Add each reward our encounter to the "Rewards" array.
   - They are case sensitive, so please see examples. 
   - The "Type" must be set to "quest" and the "City" must match what you put in your pokebot_config.json for the "name" field. This requirement is so that this Pokebot can be used across multiple cities in one instance.
    
  #### Raids
   - The "Type field must be "raid".
   - Raids can be filtered by type, levels, and ex eligibility. 
   - If you DO NOT want to filter by Ex Eligibility, REMOVE the "Ex_Eligible" field completely from the filter. 
   - You can add as many or as few levels to the filter as you with 1-5 as the examples show. 
   - The "Egg_Or_Boss" field must be set to either "boss" or "egg".
  
  #### Pokemon
   - This Pokebot uses PA type filters with some overrides in the config.
   - The "Type" field must be "pokemon".
   - You must set the min_iv and max_iv for the filter. Defaults `0` and `100`. 
   - You must set the min_level and max_level for the filter. Defaults `0` and `35`. 
   - More specific IVs can be set for each pokemon (replace `True`/`False` with `{"min_iv":"80"}`), but that value must be within the min_iv and max_iv you set.
   - You can set the bot to post without IVs using the "Post_Without_IV" field. Set this to `true` or `false`.

## 7: Start the bot. `pm2 start Pokebot.js`
  - If you get errors that are not because of missing configs, Contact me via discord. 
  - PM2 Docs http://pm2.keymetrics.io/docs/usage/cluster-mode/

(This is a work in progress guide. This bot is still technically in Beta as well)

## Join my discord server: https://discord.gg/NnujtZ4

# Subscriptions

- Subscription commands can only be used in the command channel set in the pokebot_config.json.
- Type `.subhelp` (or whatever prefix you set) for command instructions.
- Rewards that users can subscribe to are set in `quest_config.json` in the configs folder. These are case sensitive and the Encounter rewards must state "Encounter" after the pokemon name just as the example shows. 



  
