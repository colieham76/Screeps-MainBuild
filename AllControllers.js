"use strict";

/**
 * @class
 * @constructor
 */
var Controller_prototype =
{
    /** @type {Room} **/
    room: null,

    cpuBefore: 0,
    cpuAfter: 0,

    setRoom: function(room)
    {
        this.room = room;
    },

    initController: function() { },

    runController: function() { },

    onRun: function()
    {

    },

    beforeController: function()
    {
        this.cpuBefore = Game.cpu.getUsed();
    },

    afterController: function()
    {
        this.cpuAfter = Game.cpu.getUsed() - this.cpuBefore;

        if(Memory.stats == undefined)
            Memory.stats = {};

        if(Memory.stats.controllers == undefined)
            Memory.stats.controllers = {};

        if(Memory.stats.controllers[this.getName()] == undefined)
            Memory.stats.controllers[this.getName()] = [];

        Memory.stats.controllers[this.getName()].push({time: Game.time, val: this.cpuAfter});

        if(Memory.showCPU == true)
            console.log(this.getName() + ": CPU Usage: " + this.cpuAfter);
    },

    getName: function()
    {
        return "undefined";
    }


};

/**
 * @class
 * @constructor
 * @extends {Controller_prototype}
 */
var AttackController =
{

    /**
     *
     * @param num
     * @returns {{found: Array, spawn: number}}
     * @private
     */
    _getAttackers: function(num)
    {
        let ret = {found: [], spawn: 0};
        for(let k in Game.creeps)
        {
            if(Game.creeps[k].memory != undefined && Game.creeps[k].memory.role == "attacker" && Game.creeps[k].memory.attack_id == undefined)
                ret.found.push(Game.creeps[k].id);

            if(ret.found.length >= num)
                break;
        }

        if(ret.found.length < num)
        {
            for(let i = ret.found.length; i < num; i++)
                ret.spawn++;
        }

        return ret;
    },

    /**
     *
     * @param {number} id
     * @returns {*}
     */
    getAttack: function(id)
    {

    },

    initController: function()
    {

    },

    removeAttack: function(id)
    {
        let flag = Game.getObjectById(id);
        if(flag != null)
        {
            let waitFlag = Game.flags[flag.name + "_wait"];
            if(waitFlag != null)
            {
                waitFlag.memory = undefined;
                waitFlag.remove();
            }

            console.log(flag.name + ": ATTACK FINISHED");
            flag.memory = undefined;
            flag.remove();
        }
    },

    runController: function()
    {
        this.initController();

        /** @type {Flag[]} **/
        let attackFlags = [];
        for(let k in Game.flags)
        {
            if(Game.flags[k].memory.type == "attack")
                attackFlags.push(Game.flags[k]);
        }

        let attacks = [];

        for(let i = 0; i < attackFlags.length; i++)
        {
            let flag = attackFlags[i];
            let wait = Game.flags[flag.name + "_wait"];

            //flag Memory: { type: "attack", attackBegun: undefined, attackContinuously: false }
            //wait Memory: { type: "wait", spawning: undefined, needed: { attacker: 0 } }

            if(flag.memory.attackers != undefined)
            {
                let allDead = true;
                for(let i = 0; i < flag.memory.attackers.length; i++)
                {
                    let id = flag.memory.attackers[i];
                    if(Game.getObjectById(id) != null && Game.getObjectById(id) != undefined)
                    {
                        allDead = false;
                        break;
                    }
                }

                if(allDead && flag.memory.attackContinuously == true)
                {
                    console.log(flag.name + ": Attack failed!");
                    flag.memory.attackBegun = undefined;
                    flag.memory.attackers = undefined;
                }
                else if(allDead)
                {
                    console.log(flag.name + ": Attack failed!");
                    flag.memory.attackers = undefined;
                }
            }


            if(wait != undefined && (flag.memory.attackBegun == undefined || flag.memory.attackContinuously == true))
            {
                let creeps = [];

                try
                {
                    creeps = wait.pos.findInRange(FIND_MY_CREEPS, 5, {filter: c => { return c.memory.attack_id == flag.id; }});
                }
                catch(e)
                {
                    creeps = [];
                }

                let roles = {};
                creeps.forEach(function(c)
                {
                    if(roles[c.memory.role] == undefined)
                        roles[c.memory.role] = [];

                    roles[c.memory.role].push(c);
                });

                let allFound = true;
                let creepsNeeded = [];

                if(wait.memory.needed != undefined)
                {
                    for(let role in wait.memory.needed)
                    {
                        if(roles[role] == undefined || roles[role].length < wait.memory.needed[role])
                        {
                            allFound = false;
                            let count = 0;
                            if(roles[role] != undefined)
                                count = roles[role].length;
                            for(let x = 0; x < wait.memory.needed[role] - count; x++)
                                creepsNeeded.push(role);
                        }
                    }
                }

                if(creeps.length > 0 && allFound)
                {
                    flag.memory.attackers = [];
                    console.log(flag.name + ": ATTACK!!");
                    for(let role in roles)
                    {
                        roles[role].forEach(
                            /** @param {Creep} c **/
                            function(c)
                            {
                                flag.memory.attackers.push(c.id);
                                c.memory.attack = true;
                                c.log("Attacking!");
                            }
                        );
                    }
                    flag.memory.attackBegun = true;
                    wait.memory.spawning = undefined;
                }
                else if(wait.memory.spawning == undefined)
                {
                    /** @type {Spawner} **/
                    let Spawner = require('Spawner');
                    /** @type {RoleBodyDefinitions} **/
                    let RBD = require('RoleBodyDefinitions');
                    //todo: Create at the closest spawn
                    Spawner.setRoom(Game.rooms["W15N8"]);

                    for(let x in creepsNeeded)
                    {
                        let role = creepsNeeded[x];
                        Spawner.addToQueue(role, RBD.getLevel(role, 4), true, false,
                            {
                                role: role, wait_id: wait.id, attack_id: flag.id
                            }
                        );
                    }
                    wait.memory.spawning = true;
                }
            }
        }


    },

    getName: function()
    {
        return "AttackController";
    }

};

/**
 * @class
 * @constructor
 * @extends {Controller_prototype}
 */
var MapController =
{

    _handleRemoteMiners: function()
    {
        let creepNameCheck = ["remMiner", "remMiner2", "remMiner3", "remMiner4", "remMiner5"];
        /** @type {RoleBodyDefinitions} **/
        let RBD = require('RoleBodyDefinitions');

        for(let i in creepNameCheck)
        {
            let k = creepNameCheck[i];
            if(Game.creeps[k] == undefined && Game.spawns["Spawn1"].spawning == null)
            {
                if(Game.spawns["Spawn1"].canCreateCreep([MOVE, MOVE, CARRY, WORK], k) == OK/* && Game.spawns["Spawn1"].room.memory.prioSpawnQueue.length == 0*/)
                {
                    let name = Game.spawns["Spawn1"].createCreep(RBD.get("remote_miner", Game.spawns["Spawn1"].room.energyCapacityAvailable), k, {role: "remote_miner", targetPos: {x: 42, y: 18, roomName: "W16N8"}, dropPos: {x: 8, y: 30, roomName: "W15N8"}});
                    if(typeof(name) == "string")
                    {
                        console.log("Spawning " + name + ", role: remote_miner");
                        Memory.mapCheckTimer = 20;
                        break;
                    }
                }
            }
        }

        if(Game.creeps["claimer"] == undefined && Game.spawns["Spawn1"].canCreateCreep([MOVE, CLAIM]) == OK)
        {
            let name = Game.spawns["Spawn1"].createCreep([MOVE, CLAIM], "claimer", {role: "claimer"});
            if(typeof(name) == "string")
            {
                console.log("Spawning " + name + ", role: claimer");
            }
        }
},

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
            Memory.mapCheckTimer = 250;
            this._handleRemoteMiners();

        }

    },

    getName: function()
    {
        return "MapController";
    }
};

/**
 * @class
 * @constructor
 * @extends {Controller_prototype}
 */
var RoomController =
{
    initController: function()
    {
        if(this.room.memory.roomCheck == undefined)
            this.room.memory.roomCheck = 0;
    },

    runController: function()
    {
        this.initController();
        let room = this.room;


        if(room.controller != undefined && !room.controller.my && room.controller.reservation == undefined)
        {
            let enemies = room.find(FIND_HOSTILE_CREEPS).length;
            if(enemies.length > 0)
            {
                let flags = room.find(FIND_FLAGS, {filter: f => { return f.memory != undefined && f.memory.type == "guardpost" }}).length;
                if(flags.length == 0)
                {
                    room.getPositionAt(24, 24).createFlag(room.name + "_defence",  COLOR_RED, COLOR_RED);
                    Game.flags[room.name + "_defence"].memory = {type: "guardpost", numGuards: 1};
                }
            }
        }


        if(room.controller == undefined || !room.controller.my)
            return;

        if(room.memory.roomCheck <= 0)
        {
            room.memory.roomCheck = 500;

            var spawn = room.find(FIND_MY_SPAWNS)[0];
            if(spawn == null || spawn == undefined)
            {
                room.memory.roomCheck = 50;
                return;
            }

            if(room.find(FIND_MY_CONSTRUCTION_SITES).length > 0)
            {
                room.memory.roomCheck = 100;
                return;
            }

            if(room.energyCapacityAvailable == 300)
                return;

            var activeSourcesId = {};
            _.forEach(room.find(FIND_MY_CREEPS, {

                    filter: function(creep)
                    {
                        return creep.memory.role == "harvester" && creep.memory.source != undefined;
                    }
                }),
                function(creep)
                {
                    activeSourcesId[creep.memory.source] = {id: creep.memory.source};
                }
            );

            let activeSources = [];

            for(let k in activeSourcesId)
            {
                let source = Game.getObjectById(k);
                activeSources.push({ pos: source.pos, range: 1 });
            }

            PathFinder.use(true);

            let roomCallback = function(roomName)
            {
                let r = Game.rooms[roomName];
                if(!r)
                    return;

                let costs = new PathFinder.CostMatrix();
                r.find(FIND_STRUCTURES).forEach(function(structure)
                {
                    if(structure.structureType == STRUCTURE_ROAD)
                        costs.set(structure.pos.x, structure.pos.y, 1);
                    else if(structure.structureType !== STRUCTURE_RAMPART || !structure.my)
                        costs.set(structure.pos.x, structure.pos.y, 255);
                });

                return costs;
            };

            let ret = PathFinder.search(spawn.pos, activeSources,
                {
                    plainCost: 2,
                    swampCost: 10,
                    maxRooms: 1,

                    roomCallback: roomCallback
                });

            ret.path.forEach(/** @param {RoomPosition} pos **/function(pos)
            {
                pos.createConstructionSite(STRUCTURE_ROAD);
            });

            ret = PathFinder.search(spawn.pos, room.controller.pos,
                {
                    plainCost: 2,
                    swampCost: 10,
                    maxRooms: 1,

                    roomCallback: roomCallback
                });

            PathFinder.use(false);


            ret.path.forEach(/** @param {RoomPosition} pos **/function(pos)
            {
                pos.createConstructionSite(STRUCTURE_ROAD);
            });

            room.find(FIND_FLAGS,
                {
                    filter: function(flag)
                    {
                        return flag.memory.type == "guardpost";
                    }
                }).forEach(function(flag)
                {
                    if(flag.memory.assigned != undefined)
                    {
                        var nArr = [];
                        for(let k in flag.memory.assigned)
                        {
                            let id = flag.memory.assigned[k];
                            if(Game.getObjectById(id) != null)
                                nArr.push(id);
                        }
                        flag.memory.assigned = nArr;
                    }
                });



        }
        else
            room.memory.roomCheck--;
    },

    getName: function()
    {
        return "RoomController";
    }
};

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

/**
 * @class
 * @constructor
 * @extends {Controller_prototype}
 */
var TowerController =
{
    /**
     *
     * @param {Structure_Tower} tower
     * @private
     */
    _assignHelper: function(tower)
    {
        /** @type {Spawner} **/
        let Spawner = require('Spawner');

        if(!Spawner.inQueue("helper", {type: "tower", help_id: tower.id}))
        {
            Spawner.addToQueue("helper", [MOVE, CARRY, CARRY, MOVE, CARRY, MOVE], false, false, {type: "tower", help_id: tower.id});
            Memory.structures[tower.id].helperComing = true;
        }
    },

    setRoom: function(room)
    {
        this.room = room;
    },

    initController: function()
    {
        if(Memory.structures == undefined)
            Memory.structures = {};
    },

    runController: function()
    {
        this.initController();
        let room = this.room;

        if(room.controller.level < 3)
            return;

        let towers = room.find(FIND_MY_STRUCTURES,
            {
                filter: function(struct)
                {
                    return struct.structureType == STRUCTURE_TOWER;
                }
            });

        if(towers.length == 0)
            return;

        let enemies = room.find(FIND_HOSTILE_CREEPS);
        let damaged = [];
        let structures = [];

        if(enemies.length == 0)
            damaged = room.find(FIND_MY_CREEPS, {filter: function(creep) { return creep.hits < creep.hitsMax; }});

        if(enemies.length == 0 && damaged.length == 0)
        {
            structures = room.find(FIND_STRUCTURES, {filter: function(struct) { return struct.hits < struct.hitsMax - (struct.hitsMax / 4); }});

            structures.sort(function(a, b)
            {
                if(a.structureType == b.structureType && a.structureType == STRUCTURE_ROAD)
                    return a.hits - b.hits;

                let aX = a.hits / a.hitsMax;
                let bX = b.hits / b.hitsMax;
                if(a.structureType == b.structureType)
                {
                    return aX - bX;
                }

                if(a.structureType == STRUCTURE_RAMPART && a.hits < 250)
                    return -1;
                else if(b.structureType == STRUCTURE_RAMPART && a.hits < 250)
                    return 1;

                if(a.structureType == STRUCTURE_ROAD && a.hits < 250)
                    return -1;
                else if(b.structureType == STRUCTURE_ROAD && a.hits < 250)
                    return 1;

                return bX - aX;
            });
        }


        var ctrl = this;
        towers.forEach(
            /** @param {Structure_Tower} tower **/
            function(tower)
            {
                if(Memory.structures[tower.id] == undefined)
                    Memory.structures[tower.id] = {};

                /*if((Memory.structures[tower.id].helper == undefined && Memory.structures[tower.id].helperComing == undefined) ||
                 (Game.getObjectById(Memory.structures[tower.id].helper) == null))
                 ctrl._assignHelper(tower);*/

                let target = null;
                let type = "";
                if(Memory.structures[tower.id].target == undefined)
                {
                    if(enemies.length > 0)
                    {
                        target = tower.pos.findClosestByRange(enemies);
                        type = "damage";
                    }
                    else if(damaged.length > 0)
                    {
                        target = tower.pos.findClosestByRange(damaged);
                        type = "heal";
                    }
                    else if(structures.length > 0)
                    {
                        target = structures[0];
                        type = "repair";
                    }

                    if(target != null && target != undefined)
                    {
                        Memory.structures[tower.id].target = target.id;
                        Memory.structures[tower.id].type = type;
                    }
                }
                else
                {
                    target = Game.getObjectById(Memory.structures[tower.id].target);
                    type = Memory.structures[tower.id].type;
                }

                if(target == null || target == undefined)
                {
                    Memory.structures[tower.id].target = undefined;
                    Memory.structures[tower.id].type = undefined;
                }
                else if(tower.energy >= 10)
                {
                    if(tower.energy < 210 && (type == "heal" || type == "repair"))
                        return;

                    switch(type)
                    {
                        case "damage":
                            console.log("Tower attacking " + target.owner.username);
                            tower.attack(target);
                            break;
                        case "heal":
                            console.log("Tower healing " + target.name);
                            tower.heal(target);

                            if(target.hits == target.hitsMax)
                            {
                                Memory.structures[tower.id].target = undefined;
                                Memory.structures[tower.id].type = undefined;
                            }

                            break;
                        case "repair":
                            tower.repair(target);

                            if(target.hits == target.hitsMax)
                            {
                                Memory.structures[tower.id].target = undefined;
                                Memory.structures[tower.id].type = undefined;
                            }
                            break;
                    }

                    if(type == "heal" || type == "repair")
                    {
                        if(Memory.structures[tower.id].sameTarget == undefined)
                            Memory.structures[tower.id].sameTarget = {id: target.id, times: 0};

                        if(Memory.structures[tower.id].sameTarget.id == target.id)
                            Memory.structures[tower.id].sameTarget.times++;
                        else
                            Memory.structures[tower.id].sameTarget = {id: target.id, times: 0};

                        if(Memory.structures[tower.id].sameTarget.times >= 10)
                        {
                            Memory.structures[tower.id].target = undefined;
                            Memory.structures[tower.id].type = undefined;
                        }
                    }

                }
            }
        );
    },

    getName: function()
    {
        return "TowerController";
    }

};

let extend = require('extend');
let proto = require('Controller_prototype');

let out_AttackController = extend(AttackController, proto);
let out_MapController = extend(MapController, proto);
let out_RoomController = extend(RoomController, proto);
let out_SpawnController = extend(SpawnController, proto);
let out_TowerController = extend(TowerController, proto);

out_AttackController = Object.create(out_AttackController);
out_MapController = Object.create(out_MapController);
out_RoomController = Object.create(out_RoomController);
out_SpawnController = Object.create(out_SpawnController);
out_TowerController = Object.create(out_TowerController);

let out = {
    AttackController: out_AttackController,
    MapController: out_MapController,
    RoomController: out_RoomController,
    SpawnController: out_SpawnController,
    TowerController: out_TowerController
};

module.exports = out;