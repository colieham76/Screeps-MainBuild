"use strict";

var HelpFuncs =
{
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

    GetOppositeDir: function(dir)
    {
        dir -= 4;
        if(dir <= 0)
            dir += 8;

        return dir;
    }
};

module.exports = HelpFuncs;