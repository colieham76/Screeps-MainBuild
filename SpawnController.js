"use strict";

/**
 * @class
 * @constructor
 * @extends {Controller_prototype}
 */
var SpawnController =
{

    runController: function()
    {

        for(let k in Game.spawns)
        {
            let spawn = Game.spawns[k];

            if(spawn.spawning == null)
            {
                let creeps = spawn.room.lookForAtArea("creep", spawn.pos.y - 1, spawn.pos.x - 1, spawn.pos.y + 1, spawn.pos.x + 1);

                let creepsWithLowHealth = [];

                for(let y = spawn.pos.y - 1; y <= spawn.pos.y + 1; y++)
                {
                    for(let x = spawn.pos.x - 1; x <= spawn.pos.x + 1; x++)
                    {
                        /** @type {Creep[]|Creep} **/
                        let creep = creeps[y][x];
                        if(creep != undefined && creep.length)
                            creep = creep[0];
                        else
                            continue;

                        if(creep.ticksToLive <= 100 || creep.memory.renewing != undefined)
                            creepsWithLowHealth.push(creep);
                    }
                }


                if(creepsWithLowHealth.length > 0)
                {
                    creepsWithLowHealth.sort(function(a, b)
                    {
                        if(a.ticksToLive <= 20)
                            return -1;
                        else if(b.ticksToLive <= 20)
                            return 1;

                        return 0;

                        //return a.ticksToLive - b.ticksToLive;
                    });

                    if(spawn.energy < 100)
                    {
                        /*creepsWithLowHealth.forEach(function(creep)
                        {
                            creep.memory.renewing = undefined;
                        });*/
                        return;
                    }

                    spawn.renewCreep(creepsWithLowHealth[0]);
                }
            }
        }
    },

    getName: function()
    {
        return "SpawnController";
    }
};

let proto = require('Controller_prototype');
let out = require("extend")(SpawnController, proto);
out = Object.create(out);

module.exports = out;