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

        if(Memory.showCPU == true)
            console.log(this.getName() + ": CPU Usage: " + this.cpuAfter);
    },

    getName: function()
    {
        return "undefined";
    }


};

module.exports = Controller_prototype;