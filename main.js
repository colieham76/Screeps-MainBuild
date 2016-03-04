"use strict";
let startTicks = Game.cpu.getUsed();
let requireTicks = Game.cpu.getUsed();

let roleTick = Game.cpu.getUsed();
var RoleManager = require('RoleManager');
roleTick = Game.cpu.getUsed() - roleTick;

let spawnTick = Game.cpu.getUsed();
var Spawner = require('Spawner');
spawnTick = Game.cpu.getUsed() - spawnTick;
require('extensions');

let allControllersTick = Game.cpu.getUsed();
var AllControllers = require('AllControllers');
requireTicks = Game.cpu.getUsed() - requireTicks;

let assignTick = Game.cpu.getUsed();
var RoomController = AllControllers["RoomController"];
var TowerController = AllControllers["TowerController"];
var MapController = AllControllers["MapController"];
var SpawnController = AllControllers["SpawnController"];
var AttackController = AllControllers["AttackController"];
assignTick = Game.cpu.getUsed() - assignTick;

allControllersTick = Game.cpu.getUsed() - allControllersTick;

if(Memory.showCPU)
{
    console.log("At start: " + startTicks);
    console.log("Requirement Ticks: " + requireTicks);
    console.log("RoleManager Ticks: " + roleTick);
    console.log("Spawner Ticks: " + spawnTick);
    console.log("Assign Ticks: " + assignTick);
    console.log("All Controllers Ticks: " + allControllersTick);
    Memory.showCPU = undefined;
}

if(Memory.sources == undefined)
    Memory.sources = {};

module.exports.loop = function ()
{
    let mainLoopTicks = Game.cpu.getUsed();
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
            let numCreeps = 0;
            for(let k in Memory.creeps)
            {
                if(Game.creeps[k] == undefined)
                {
                    numCreeps++;
                    Memory.creeps[k] = undefined;
                }
            }
            let numFlags = 0;
            for(let k in Memory.flags)
            {
                if(Game.flags[k] == undefined)
                {
                    numFlags++;
                    Memory.flags[k] = undefined;
                }
            }
            let numRooms = 0;
            for(let k in Memory.rooms)
            {
                if(Game.rooms[k] == undefined)
                {
                    numRooms++;
                    Memory.rooms[k] = undefined;
                }
            }
            let numSpawns = 0;
            for(let k in Memory.spawns)
            {
                if(Game.spawns[k] == undefined)
                {
                    numSpawns++;
                    Memory.spawns[k] = undefined;
                }
            }
            console.log("Cleaned Memory. Removed " + numCreeps + " Creeps, " + numFlags + " Flags, " + numRooms + " Rooms and " + numSpawns + " Spawns");
        }
        else if(cmd == "cleanConstructionSites")
        {
            for(let roomName in Game.rooms)
            {
                let sites = Game.rooms[roomName].find(FIND_MY_CONSTRUCTION_SITES);
                sites.forEach(
                    function(site)
                    {
                        if(site.progress == 0)
                            site.remove();
                    }
                );
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
        else if(cmd == "toggleCPU")
        {
            if(Memory.showCPU == undefined)
                Memory.showCPU = true;
            else
                Memory.showCPU = undefined;
        }
    }

    if(Game.cpu.bucket <= 5000)
    {
        if(Memory.waitForCPU == undefined)
            console.log("SAVING CPU");
        Memory.waitForCPU = true;
    }
    else
    {
        if(Memory.waitForCPU != undefined)
            console.log("CPU Restored!");
        Memory.waitForCPU = undefined;
    }

    RoleManager.work();
    //CarrierController.initController();
    TowerController.initController();
    AttackController.initController();

    _.forEach(Game.rooms, function(room)
    {
        let spawnerTick = Game.cpu.getUsed();
        Spawner.setRoom(room);
        Spawner.runRoom();
        if(Memory.showCPU)
            console.log("Spawner: " + (Game.cpu.getUsed() - spawnerTick));
        RoomController.beforeController();
        RoomController.setRoom(room);
        RoomController.runController();
        RoomController.afterController();


        if(Memory.waitForCPU == undefined)
        {
            TowerController.beforeController();
            TowerController.setRoom(room);
            TowerController.runController();
            TowerController.afterController();
        }
    });

    MapController.beforeController();
    MapController.runController();
    MapController.afterController();
    SpawnController.beforeController();
    SpawnController.runController();
    SpawnController.afterController();

    if(Memory.waitForCPU == undefined)
    {
        AttackController.beforeController();
        AttackController.runController();
        AttackController.afterController();
    }

    if(Memory.showCPU)
        console.log("Main Loop: " + (Game.cpu.getUsed() - mainLoopTicks));

    if(Game.cpu.getUsed() > Game.cpu.limit)
        console.log("HIGH CPU: " + Game.cpu.getUsed());
};