"use strict";

/**
 * @class
 * @constructor
 */
var Stat =
{

    /**
     *
     * @param {string} group
     * @param {string} name
     * @param {boolean} [start]
     */
    set: function(group, name, start)
    {
        return "DISABLED";
        if (Memory.stats.stat == undefined)
            Memory.stats.stat = {};

        if (start === true || Memory.stats.stat[group] == undefined)
            Memory.stats.stat[group] = [{name: name, cpu: Game.cpu.getUsed()}];
        else
            Memory.stats.stat[group].push({name: name, cpu: Game.cpu.getUsed()});
    },

    done: function(group)
    {
        return "DISABLED";
        if(Memory.stats.stat[group] == undefined)
            return null;

        let stats = Memory.stats.stat[group];
        let min = 1000;
        let max = 0;
        let avg = 0;

        let x = [];

        for(let i = 0; i < stats.length; i++)
        {
            if(i == 0)
                continue;

            let cpu = stats[i].cpu - stats[i - 1].cpu;

            if(cpu < min)
                min = cpu;
            if(cpu > max)
                max = cpu;
            avg += cpu;

            if(i > 0)
                x.push({from: stats[i - 1].name, to: stats[i].name, cpu: stats[i].cpu - stats[i - 1].cpu});
        }

        avg /= stats.length;

        Memory.stats.stat[group] = undefined;

        if(max >= 10)
        {
            console.log("GOT HIGH: " + Game.time);
            if(Memory.stats.xHigh == undefined)
                Memory.stats.xHigh = {};

            Memory.stats.xHigh[Game.time] = {name: group, min: min.toFixed(2), max: max.toFixed(2), avg: avg.toFixed(2), all: stats, x: x};
        }

        return {name: group, min: min.toFixed(2), max: max.toFixed(2), avg: avg.toFixed(2), all: stats, x: x};
    }


};

module.exports = Stat;