"use strict";
/**
 * @class
 * @constructor
 * @extends {role_prototype}
 *
 */
var role_miner =
{
    /**
     * @param {Creep} [creep]
     * @returns {Source}
     */
    FindSource: function(creep)
    {
        if(creep == undefined)
            creep = this.creep;

        /** @type {Source[]} **/
        var sources = creep.room.find(FIND_SOURCES, {

            /** @param {Source} source **/
            filter: function(source)
            {
                return Memory.sources[source.id] == undefined || Memory.sources[source.id].miners.length < Memory.sources[source.id].minersMax;
            }
        });

        if(sources.length == 0)
            return null;

        var m = this;
        sources.forEach(
            /** @param {Source} source **/
            function(source)
            {
                if(Memory.sources[source.id] == undefined)
                {
                    let freeSpaces = m.GetMineEntries(source);
                    Memory.sources[source.id] = {
                        miners: [],
                        minersMax: freeSpaces.length
                    };
                }
            }
        );

        sources.sort(function(a, b)
        {
            return Memory.sources[a.id].miners.length - Memory.sources[b.id].miners.length;
        });

        return sources[0];
    },

    /**
     *
     * @param {Source} source
     *
     * @return {object[]}
     */
    GetMineEntries: function(source)
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
                        if(t.structure.structureType == STRUCTURE_ROAD || (t.structure.structureType == STRUCTURE_RAMPART && t.structure.my))
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
    },

    /**
     *
     * @returns {Creep[]}
     * @private
     */
    _findIdleCarrier: function()
    {
        return this.creep.room.find(FIND_MY_CREEPS, {
            /** @param {Creep} creep **/
            filter: function(creep)
            {
                return !creep.spawning && creep.memory.role == "carrier" && (creep.memory.miner == undefined || Game.getObjectById(creep.memory.miner) == null);
            }
        });
    },

    _findAndSetCarrier()
    {
        let creep = this.creep;

        let carriers = this._findIdleCarrier();
        if(carriers.length > 0)
        {
            creep.memory.carriers.push(carriers[0].id);
            carriers[0].memory.miner = creep.id;
        }
        else
        {
            /** @type {Spawner} **/
            let Spawner = require('Spawner');
            /** @type {RoleBodyDefinitions} **/
            let RoleBodyDefinitions = require('RoleBodyDefinitions');
            Spawner.addToQueue("carrier", RoleBodyDefinitions.get("carrier", creep.room.energyCapacityAvailable), true, true, { miner: creep.id });
            creep.memory.carrierSpawning = true;
        }
    },

    onSpawn: function()
    {
        var creep = this.creep;

        let source = this.FindSource();
        let closestSpawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS);
        if(source != null && source != undefined)
        {
            if(Memory.sources[source.id] == undefined)
                Memory.sources[source.id] = {miners: [], minersMax: this.GetMineEntries(source).length};

            Memory.sources[source.id].miners.push(creep.id);
            creep.memory.source = source.id;
            creep.memory.carriers = [];

            let steps = creep.pos.findPathTo(closestSpawn).length;
            let parts = 0;
            let RoleBodyDefinitions = require('RoleBodyDefinitions');
            let body = RoleBodyDefinitions.get("carrier", creep.room.energyCapacityAvailable);
            body.forEach(function(part){ if(part == CARRY) parts++; });


            creep.memory.carriersNeeded = Math.max( 1, Math.ceil( ( 10 * ( 2 * steps ) ) / ( 50 * parts ) ) );
            creep.memory.isNearSource = false;
        }
    },

    run: function()
    {
        var creep = this.creep;
        if(creep == null)
            return;

        if(creep.memory.wait == undefined)
            creep.memory.wait = 0;

        if(creep.memory.wait > 0)
        {
            creep.memory.wait--;
            return;
        }

        if(creep.memory.carriersNeeded == undefined)
        {
            let closestSpawn = creep.room.controller.pos.findClosestByPath(FIND_MY_SPAWNS);
            if(closestSpawn == null || closestSpawn == undefined)
                closestSpawn = creep.room.controller.pos.findClosestByRange(FIND_MY_SPAWNS);
            if(closestSpawn == null || closestSpawn == undefined)
            {
                creep.memory.wait = 10;
                return;
            }
            creep.memory.carriersNeeded = Math.max(1, Math.ceil(creep.pos.findPathTo(closestSpawn).length / 20));
        }

        if(creep.memory.carriers == undefined)
            creep.memory.carriers = [];

        if(creep.memory.carriers.length < creep.memory.carriersNeeded && creep.memory.carrierSpawning == undefined)
            this._findAndSetCarrier();

        if(creep.memory.source != undefined)
        {
            /** @type {Source} **/
            let source = Game.getObjectById(creep.memory.source);
            if(source == undefined || source == null)
            {
                creep.log("My source doesn't exist!");
                this.onDeath();
                creep.suicide();
            }

            if(!creep.pos.isNearTo(source.pos))
            {
                creep.memory.isNearSource = false;
                creep.gotoTarget(source.pos);
            }
            else
            {
                creep.memory.isNearSource = true;
                creep.memory.goto = undefined;

                if(source.energy == 0)
                    creep.memory.wait = source.ticksToRegeneration;

                creep.harvest(source);
                if(creep.carryCapacity > 0)
                    creep.drop(RESOURCE_ENERGY);
            }
        }
        else
        {
            let source = this.FindSource();
            let closestSpawn = creep.pos.findClosestByPath(FIND_MY_SPAWNS);
            if(source != null && source != undefined)
            {
                Memory.sources[source.id].miners.push(creep.id);
                creep.memory.source = source.id;
                creep.memory.carriers = [];
                creep.memory.carriersNeeded = Math.max(1, Math.ceil(creep.pos.findPathTo(closestSpawn).length / 20));
                creep.memory.isNearSource = false;
            }
        }
    },

    onDeath: function()
    {
        var creep = this.creep;
        if(creep == null || creep == undefined || creep.memory == undefined)
            return;

        if(creep.memory.carriers.length > 0)
        {
            creep.memory.carriers.forEach(function(id)
            {
                let carrier = Game.getObjectById(id);
                if(carrier == null)
                    return true;
                if(carrier.memory.miner == creep.id)
                    carrier.memory.miner = undefined;
            });
        }

        if(creep.memory.source != undefined && Memory.sources[creep.memory.source] != undefined)
        {
            var nArr = [];
            Memory.sources[creep.memory.source].miners.forEach(function(miner)
            {
                if(miner != creep.id)
                    nArr.push(miner);
            });
            Memory.sources[creep.memory.source].miners = nArr;
        }

        creep.memory = undefined;
    },

    onRenew: function()
    {
        this.creep.memory.isNearSource = false;
    }
};

module.exports = role_miner;