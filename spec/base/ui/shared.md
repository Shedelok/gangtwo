# About This File

This file describes the UI that is shared across multiple places (multiple pages, etc.).

# Sound Bar

Each player has a bar to control the volume of all sounds in the game. The default value of the volume is 0.5.

Each player has a button that opens/closes a panel in which for each sound in the game the player has a drop-down box
of all mp3 files available (from spec/base/resources/sounds). The player can assign any of the mp3 files to any of the
sounds (one mp3 can be used any number of times).

All sounds are preloaded when the application starts and are kept always ready to be played so that there is never
a delay between an action and a corresponding sound.

# Hand Rankings Hint

To the right of the sound control elements there is a hoverable "Hand Ranking" text. When hovered over that text,
spec/base/resources/images/hand-ranking.png is displayed to the user. The hand ranking should be
displayed on top of any other
UI element (including table and players), so it's fully visible and nothing blocks it.

# Stop and Restart Buttons

The Stop Game and Restart buttons are displayed side by side with a gap between them.

The Restart button works similar to the "Move to the next round" button. All players must press it for it to take
effect. Each player can press and unpress it. Each player sees how many players have the button pressed.
When the button is pressed by the player it reads "Waiting", still displays number of players who pressed it and has
a less bright color.
After the game is over and none of the players has any available action (including revealing cards) besides restart/stop
the game, each player has a tick right next to their name indicating that they have Restart button pressed. The tick
should not move the name horizontally, it should appear to the right from the name, but the name should still be
centered as if there was no tick. Players who are not ready have a red cross (U+2715) next to their name instead. This
helps players to see who hasn't pressed the Restart button yet, but not before the game is over, not to reveal
additional meta-information.

# Card Flip

When a card is flipped there's an animation that lasts 1 second and turns the card. The animation is played for
all players at the same time. If a player was in
a different tab when the animation was played, they just won't see it, they would see the card already in the final
state. When there are multiple cards being flipped, their animations are played at the same time (they all flip
together).

Every time a player sees a card flip animation (regardless of where it is: on the table, in their hand, in other
player's hand, etc.), they hear "CARD_FLIP" sound which defaults to
spec/base/resources/sounds/card-flip.mp3.