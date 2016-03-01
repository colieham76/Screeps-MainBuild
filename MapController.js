"use strict";

/**
 * @class
 * @constructor
 * @extends {Controller_prototype}
 */
var MapController =
{

    initController: function()
    {

        if(Memory.mapCheckTimer == undefined)
            Memory.mapCheckTimer = 0;
    },

    runController: function()
    {
        this.initController();

        if(Memory.mapCheckTimer > 0)
            Memory.mapCheckTimer--;
        else
        {
            Memory.mapCheckTimer = 500;

            let creepNameCheck = ["remMiner", "remMiner2", "remMiner3"];

            for(let i in creepNameCheck)
            {
                let k = creepNameCheck[i];
                if(Game.creeps[k] == undefined && Game.spawns["Spawn1"].spawning == null)
                {
                    if(Game.spawns["Spawn1"].canCreateCreep([MOVE, MOVE, CARRY, WORK], k) == OK)
                    {
                        let name = Game.spawns["Spawn1"].createCreep([MOVE, MOVE, CARRY, WORK], k, {role: "remote_miner", targetPos: {x: 42, y: 18, roomName: "W16N8"}, dropPos: {x: 8, y: 30, roomName: "W15N8"}});
                        if(typeof(name) == "string")
                        {
                            console.log("Spawning " + name + ", role: remote_miner");
                            Memory.mapCheckTimer = 20;
                            break;
                        }
                    }
                }
            }
        }

    },

    getName: function()
    {
        return "MapController";
    }
};

let proto = require('Controller_prototype');
let out = require("extend")(MapController, proto);
out = Object.create(out);

module.exports = out;