"use strict";

/**
 * @class
 * @constructor
 */
var Controller_prototype =
{
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
    },

    getName: function()
    {
        return "undefined";
    }


};

module.exports = Controller_prototype;