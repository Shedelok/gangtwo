# Sound Details

This file describes the sounds used in the game.

## Sounds

All sounds are preloaded when the application starts and are kept always ready to be played so that there is never
a delay between an action and a corresponding sound.

## Steal From You

When someone steals the chip from the current player, the current player hears the sound "STEAL_FROM_YOU" which defaults
to spec/resources/bell-1.mp3.

## Chip Move

When any chip moves, all players hear "CHIP_MOVE" sound at which defaults to spec/resources/fast-woosh.mp3. The volume
of CHIP_MOVE sound is multiplied by 0.2.