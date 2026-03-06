# Sound Details

## About This File

This file describes the sounds used in the game.

## Sounds

All sounds are preloaded when the application starts and are kept always ready to be played so that there is never
a delay between an action and a corresponding sound.

## Steal From You

When someone steals the chip from the current player, the current player hears the sound "STEAL_FROM_YOU" which defaults
to spec/resources/bell-1.mp3.

## Chip Move

When any chip moves, all players hear "CHIP_MOVE" sound which defaults to spec/resources/fast-woosh.mp3. The volume
of CHIP_MOVE sound is multiplied by 0.2.

## Card Flip

When a card is flipped (regardless of where it is: on the table, in hand, etc.), all players hear "CARD_FLIP" sound
which defaults to spec/resources/card-flip.mp3.

## Game Start

At the beginning of the game, all players hear "GAME_START" sound which defaults to spec/resources/car-engine-start.mp3.
This sound is also played after a restart, even if a restart happens immediately after the game starts (on the first
round).

## Action Card Played

When any player commits an action of an action card, all players hear "ACTION_CARD_PLAYED" sound which defaults to
spec/resources/magic-1.mp3.