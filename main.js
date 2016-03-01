"use strict";
var RoleManager = require('RoleManager');
var Spawner = require('Spawner');
var RoomController = require('RoomController');
//var CarrierController = require('CarrierController');
var TowerController = require('TowerController');
var MapController = require('MapController');
var SpawnController = require('SpawnController');
var AttackController = require('AttackController');
require('extensions');

if(Memory.sources == undefined)
    Memory.sources = {};


module.exports.loop = function ()
{
    if(Memory.command != undefined)
    {
        let cmd = Memory.command;
        Memory.command = undefined;

        if(cmd == "resetBuilders")
        {
            _.forEach(Game.creeps, function(c)
            {
                if(c.memory.role == "builder")
                    c.memory = {role: "builder"};
            });
            console.log("Reset Builders");
        }
        else if(cmd == "cleanMemory")
        {
            for(let k in Memory.creeps)
            {
                if(Game.creeps[k] == undefined)
                    Memory.creeps[k] = undefined;
            }
            for(let k in Memory.flags)
            {
                if(Game.flags[k] == undefined)
                    Memory.flags[k] = undefined;
            }
            for(let k in Memory.rooms)
            {
                if(Game.rooms[k] == undefined)
                    Memory.rooms[k] = undefined;
            }
            for(let k in Memory.spawns)
            {
                if(Game.spawns[k] == undefined)
                    Memory.spawns[k] = undefined;
            }
            console.log("Cleaned Memory");
        }
        else if(cmd == "cleanConstructionSites")
        {
            for(let roomName in Game.rooms)
            {
                let sites = Game.rooms[roomName].find(FIND_MY_CONSTRUCTION_SITES);
                sites.forEach(function(site)
                {
                    site.remove();
                });
            }

            console.log("All construction sites cleared");
        }
        else if(cmd == "who")
        {
            for(let k in Game.creeps)
            {
                let creep = Game.creeps[k];
                let role = RoleManager.getRole(creep.memory.role);
                if(role != null)
                {
                    role = Object.create(role);
                    role.setCreep(creep);
                    creep.say(role.getWho());
                }
                else
                    creep.say(Game.creeps[k].memory.role);

            }
        }
        else if(cmd == "recheckSources")
        {
            let mine_role = require('role_miner');
            for(let roomName in Game.rooms)
            {
                let sources = Game.rooms[roomName].find(FIND_SOURCES);
                sources.forEach(function(source){
                    if(Memory.sources[source.id] == undefined)
                        Memory.sources[source.id] = {miners: [], minersMax: 0};

                    Memory.sources[source.id].minersMax = mine_role.GetMineEntries(source).length;
                    for(let i = 0; i < Memory.sources[source.id].miners.length; i++)
                    {
                        if(Game.getObjectById(Memory.sources[source.id].miners[i]) == null)
                            Memory.sources[source.id].miners[i] = undefined;
                    }
                });
            }
        }
    }

    RoleManager.work();
    //CarrierController.initController();
    TowerController.initController();
    AttackController.initController();

    _.forEach(Game.rooms, function(room)
    {
        Spawner.setRoom(room);
        Spawner.runRoom();
        RoomController.beforeController();
        RoomController.setRoom(room);
        RoomController.runController();
        RoomController.afterController();
        TowerController.beforeController();
        TowerController.setRoom(room);
        TowerController.runController();
        TowerController.afterController();
    });

    MapController.beforeController();
    MapController.runController();
    MapController.afterController();
    SpawnController.beforeController();
    SpawnController.runController();
    SpawnController.afterController();

    AttackController.beforeController();
    AttackController.runController();
    AttackController.afterController();

    if(Game.cpu.getUsed() > Game.cpu.limit)
        console.log("HIGH CPU: " + Game.cpu.getUsed());
};