"use strict";

var Spawner =
{
    /**
     * @type {Room}
     */
    room: null,

    /**
     * @param {Room} room
     */
    setRoom: function(room)
    {
        this.room = room;
    },

    _initRoom: function()
    {
        let room = this.room;

        if(room.controller == undefined || !room.controller.my)
            return;

        if(room.memory.spawnQueue == undefined)
            room.memory.spawnQueue = [];
        if(room.memory.prioSpawnQueue == undefined)
            room.memory.prioSpawnQueue = [];
        if(room.memory.lastCreepCheck == undefined)
            room.memory.lastCreepCheck = 0;
    },

    runRoom: function()
    {
        let room = this.room;
        this._initRoom();

        if(room.controller == undefined || !room.controller.my)
            return;

        if(room.memory.spawnQueue.length > 0 || room.memory.prioSpawnQueue.length > 0)
        {

            if(room.memory.timesSame == undefined || typeof(room.memory.timesSame != "object"))
                room.memory.timesSame = {energy: room.energyAvailable, times: 1};
            else if(room.memory.timesSame.energy == room.energyAvailable)
                room.memory.timesSame.times++;
            else if(room.memory.timesSame.energy != room.energyAvailable)
                room.memory.timesSame = {energy: room.energyAvailable, times: 1};


            /** @type {Spawn[]} **/
            let spawns = room.find(FIND_MY_SPAWNS);

            if(room.memory.timesSame.times >= 1000 && room.memory.timesSame.energy < 300)
            {
                room.memory.timesSame = 0;
                for(let i = 0; i < spawns.length; i++)
                {
                    let spawn = spawns[i];
                    if(spawn.spawning != null)
                        continue;
                    if(spawn.canCreateCreep([MOVE, CARRY, WORK]) == OK)
                    {
                        let ret = spawn.createCreep([MOVE, CARRY, WORK], undefined, {role: "harvester"});
                        if(typeof(ret) == "string")
                            break;
                    }
                }
            }


            for(let i = 0; i < spawns.length; i++)
            {
                let spawn = spawns[i];

                if(spawn.spawning != null)
                    continue;
                else
                    spawn.memory.spawning = undefined;

                if(room.memory.prioSpawnQueue.length > 0)
                {
                    if(spawn.canCreateCreep(room.memory.prioSpawnQueue[0].body) == OK)
                    {
                        let mem = room.memory.prioSpawnQueue[0].memory;
                        if(mem == undefined)
                            mem = {};

                        mem.role = room.memory.prioSpawnQueue[0].role;

                        let ret = spawn.createCreep(room.memory.prioSpawnQueue[0].body, undefined, mem);
                        if(typeof(ret) == "string")
                        {
                            spawn.memory.spawning = room.memory.prioSpawnQueue[0].role;
                            console.log("Spawning " + ret + ", role: " + room.memory.prioSpawnQueue[0].role);
                            room.memory.prioSpawnQueue.shift();
                        }
                    }
                }
                else if(room.memory.spawnQueue.length > 0)
                {
                    if(spawn.canCreateCreep(room.memory.spawnQueue[0].body) == OK)
                    {
                        let mem = room.memory.spawnQueue[0].memory;
                        if(mem == undefined)
                            mem = {};

                        mem.role = room.memory.spawnQueue[0].role;

                        let ret = spawn.createCreep(room.memory.spawnQueue[0].body, undefined, mem);
                        if(typeof(ret) == "string")
                        {
                            spawn.memory.spawning = room.memory.spawnQueue[0].role;
                            spawn.log("Spawning " + ret + ", role: " + room.memory.spawnQueue[0].role);
                            room.memory.spawnQueue.shift();
                        }
                    }
                }
                else
                    break;
            }
        }

        if(room.memory.lastCreepCheck <= 0)
        {
            room.memory.lastCreepCheck = 100;

            let harvesters = 0;
            let guards = 0;
            let builders = 0;
            let healers = 0;
            let miners = 0;
            let controllers = 0;
            let maintainers = 0;
            let carriers = 0;
            let helpers = 0;
            let storage_handlers = 0;

            let GPs = room.find(FIND_FLAGS, {
                filter: function(flag)
                {
                    return flag.memory.type == "guardpost";
                }
            });

            let numGPS = 0;

            GPs.forEach(function(gp){
                if(gp.memory.numGuards != undefined && gp.memory.assigned != undefined)
                    numGPS += gp.memory.numGuards;
                else
                    numGPS += 1;
            });

            let numEnemies = room.find(FIND_HOSTILE_CREEPS).length;

            let numDamagedCreeps = 0;

            let needBuilders = Math.max(0, room.find(FIND_MY_CONSTRUCTION_SITES).length);
            if(needBuilders > 0)
            {
                needBuilders = Math.ceil(needBuilders / 10);
                if(needBuilders < 1)
                    needBuilders = 1;
                else if(needBuilders > 4)
                    needBuilders = 5;
            }

            var neededMiners = 0;

            var miner_role = require('role_miner');
            let spwnr = this;
            room.find(FIND_SOURCES).forEach(function(source)
            {
                if(Memory.sources[source.id] != undefined)
                    neededMiners += Memory.sources[source.id].minersMax;
                else
                    neededMiners += miner_role.GetMineEntries(source).length;
            });


            var creeps = room.find(FIND_MY_CREEPS);

            for(let i = 0; i < creeps.length; i++)
            {
                /**
                 *
                 * @type {Creep}
                 */
                var creep = creeps[i];

                if(creep.hits < creep.hitsMax)
                    numDamagedCreeps++;

                switch(creep.memory.role)
                {
                    case "harvester":
                        harvesters++;
                        break;
                    case "guard":
                        guards++;
                        break;
                    case "builder":
                        builders++;
                        break;
                    case "healer":
                        healers++;
                        break;
                    case "miner":
                        miners++;
                        break;
                    case "controller":
                        controllers++;
                        break;
                    case "maintainer":
                        maintainers++;
                        break;
                    case "carrier":
                        carriers++;
                        break;
                    case "helper":
                        helpers++;
                        break;
                    case "storage_handler":
                        storage_handlers++;
                        break;
                }
            }

            //Search in queues
            for(let i = 0; i < room.memory.prioSpawnQueue.length; i++)
            {
                let role = room.memory.prioSpawnQueue[i].role;
                switch(role)
                {
                    case "harvester":
                        harvesters++;
                        break;
                    case "guard":
                        guards++;
                        break;
                    case "builder":
                        builders++;
                        break;
                    case "healer":
                        healers++;
                        break;
                    case "miner":
                        miners++;
                        break;
                    case "controller":
                        controllers++;
                        break;
                    case "maintainer":
                        maintainers++;
                        break;
                    case "carrier":
                        carriers++;
                        break;
                    case "helper":
                        helpers++;
                        break;
                    case "storage_handler":
                        storage_handlers++;
                        break;
                }
            }
            for(let i = 0; i < room.memory.spawnQueue.length; i++)
            {
                let role = room.memory.spawnQueue[i].role;
                switch(role)
                {
                    case "harvester":
                        harvesters++;
                        break;
                    case "guard":
                        guards++;
                        break;
                    case "builder":
                        builders++;
                        break;
                    case "healer":
                        healers++;
                        break;
                    case "miner":
                        miners++;
                        break;
                    case "controller":
                        controllers++;
                        break;
                    case "maintainer":
                        maintainers++;
                        break;
                    case "carrier":
                        carriers++;
                        break;
                    case "helper":
                        helpers++;
                        break;
                    case "storage_handler":
                        storage_handlers++;
                        break;
                }
            }

            room.find(FIND_MY_SPAWNS, {filter: function(spawn) { return spawn.spawning && spawn.memory.spawning != undefined }}).forEach(
                /** @param {Spawn} spawn **/
                function(spawn)
                {
                    let role = spawn.memory.spawning;
                    switch(role)
                    {
                        case "harvester":
                            harvesters++;
                            break;
                        case "guard":
                            guards++;
                            break;
                        case "builder":
                            builders++;
                            break;
                        case "healer":
                            healers++;
                            break;
                        case "miner":
                            miners++;
                            break;
                        case "controller":
                            controllers++;
                            break;
                        case "maintainer":
                            maintainers++;
                            break;
                        case "carrier":
                            carriers++;
                            break;
                        case "helper":
                            helpers++;
                            break;
                        case "storage_handler":
                            storage_handlers++;
                            break;
                    }
                }
            );

            /** @type {RoleBodyDefinitions} **/
            let RoleBodyDefinitions = require('RoleBodyDefinitions');

            if(miners < neededMiners)
            {
                this.addToQueue("miner", RoleBodyDefinitions.get("miner", room.energyCapacityAvailable), true);
            }

            if(controllers < 1)
                this.addToQueue("controller", RoleBodyDefinitions.get("controller", room.energyCapacityAvailable), true);

            /*if(harvesters < 4)
            {
                for(let i = 0; i < 4 - harvesters; i++)
                    this.addToQueue("harvester", RoleBodyDefinitions.get("harvester", room.energyCapacityAvailable), true);
            }*/

            if(guards < numGPS + numEnemies && room.controller.level > 1)
            {
                this.addToQueue("guard", RoleBodyDefinitions.get("guard", room.energyCapacityAvailable), numEnemies > 0, numEnemies > 0);
            }

            /*if(maintainers < 1 && room.controller.level > 1)
            {
                this.addToQueue("maintainer", RoleBodyDefinitions.get("maintainer", room.energyCapacityAvailable), true);
            }*/

            if(builders < needBuilders && room.controller.level > 1)
            {
                for (let i = 0; i < needBuilders - builders; i++)
                    this.addToQueue("builder", RoleBodyDefinitions.get("builder", room.energyCapacityAvailable));
            }

            if(healers == 0 && numDamagedCreeps > 0 && room.energyCapacityAvailable >= 300 && room.controller.level > 1)
                this.addToQueue("healer", RoleBodyDefinitions.get("healer", room.energyCapacityAvailable), true, true);

            if(carriers < neededMiners + 1)
                this.addToQueue("carrier", RoleBodyDefinitions.get("carrier", room.energyCapacityAvailable), false, false);

            if(helpers == 0)
                this.addToQueue("helper", [MOVE, MOVE, CARRY, CARRY, MOVE, CARRY], true, false, {type: "controller"});

            if(storage_handlers == 0)
                this.addToQueue("storage_handler", [MOVE, CARRY], false, false);

        }
        else
            room.memory.lastCreepCheck--;
    },

    /**
     *
     * @param {Source} source
     * @returns {Array}
     * @private
     */
    /*_getMineEntries: function(source)
    {
        let top = source.pos.y - 1;
        let left = source.pos.x - 1;
        let bottom = source.pos.y + 1;
        let right = source.pos.x + 1;

        let pos = source.room.lookAtArea(top, left, bottom, right);

        let freePositions = [];

        for(let y = top; y <= bottom; y++)
        {
            for(let x = left; x <= right; x++)
            {
                let isFree = true;
                for(let i in pos[y][x])
                {
                    let t = pos[y][x][i];
                    if(t.type == "structure")
                    {
                        if(t.structure.structureType == STRUCTURE_RAMPART && t.structure.my)
                            continue;

                        isFree = false;
                    }
                    else if(t.type == "terrain")
                    {
                        if(t.terrain == "wall")
                            isFree = false;
                    }
                }
                if(isFree)
                    freePositions.push({x: x, y: y});
            }
        }

        return freePositions;
    },*/

    /**
     *
     * @param {string} role
     * @param {string[]} body
     * @param {boolean} [prio]
     * @param {boolean} [superPrio]
     * @param {object} [memory]
     */
    addToQueue: function(role, body, prio, superPrio, memory)
    {
        if(prio == undefined)
            prio = false;

        let room = this.room;

        if(this.room == null || this.room == undefined)
            this.room = Game.rooms["W15N8"];

        this._initRoom();

        if(memory == undefined)
            memory = {};

        if(superPrio == true)
            room.memory.prioSpawnQueue.unshift({role: role, body: body, memory: memory});
        else if(prio)
            room.memory.prioSpawnQueue.push({role: role, body: body, memory: memory});
        else
            room.memory.spawnQueue.push({role: role, body: body, memory: memory});
    },

    /**
     *
     * @param {string} role
     * @param {object} [memory]
     *
     * @return {boolean}
     */
    inQueue: function(role, memory)
    {
        if(memory == undefined)
            memory = {};

        let room = this.room;
        for(let i = 0; i < room.memory.prioSpawnQueue.length; i++)
        {
            let obj = room.memory.prioSpawnQueue[i];
            if(obj.role == role)
            {
                let exact = true;
                for(let k in memory)
                {
                    if(room.memory.prioSpawnQueue[i].memory[k] != memory[k])
                    {
                        exact = false;
                        break;
                    }
                }
                if(exact)
                    return true;
            }
        }
        for(let i = 0; i < room.memory.spawnQueue.length; i++)
        {
            let obj = room.memory.spawnQueue[i];
            if(obj.role == role)
            {
                let exact = true;
                for(let k in memory)
                {
                    if(room.memory.spawnQueue[i].memory[k] != memory[k])
                    {
                        exact = false;
                        break;
                    }
                }
                if(exact)
                    return true;
            }
        }

        return false;
    }

};

module.exports = Spawner;