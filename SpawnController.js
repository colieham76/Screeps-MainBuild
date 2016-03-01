"use strict";


var SpawnController =
{

    runController: function()
    {

        for(let k in Game.spawns)
        {
            let spawn = Game.spawns[k];

            if(spawn.spawning == null && spawn.energy >= 100)
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

                    spawn.renewCreep(creepsWithLowHealth[0]);
                }
            }
        }

    }

};

module.exports = SpawnController;