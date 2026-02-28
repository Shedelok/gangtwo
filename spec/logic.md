# Gang Game

## Lobby

This is a very simple web-based game. Exactly 1 lobby exists at any time.
Initially, when the game is not started yet, any player opening the home page joins the lobby.
In the lobby, there's a "Start Game" button that any player can press at any time.

## Game

Once the "Start Game" button is pressed, the game begins and the set of players is fixed. Let N be
the number of players in the game.

The game uses standard deck of 52 cards. As soon as the game begins, each player is dealt a pair of
cards. After that there are 4 rounds of bidding.

At the beginning of each round, there are N chips placed at the middle of the table. The chips have round-specific
color (white, yellow, orange, red). The chips have numbers on them (1, 2, ..., N). The players can only interact
with the chips for the current round, all chips from the previous rounds stay fixed.

At any moment, any player can make one of three moves:

* If the player has a chip for the current round, they can place it back to the middle of the table (return it to where
  it was initially)
* If the player has no chip for the current round, they can take any of the chips from the middle of the table
* If the player has no chip for the current round, they can take any other player's chip

Each player also has a checkbox in their UI "Move to the next round" which is unticked by default.
Once each player has a chip for the current round and they have their checkbox checked, the round is over. Chips of this
color are fixed until the end of the game, the checkbox automatically unchecks for the next round.

At the end of first round, 3 common cards are placed on the table. At the end of second and third rounds 1 more card is
placed on the table. Players cannot interact with the common cards.

Once the 4th round is over, each player gets a button "reveal cards" which, when pressed, shows their cards to everyone.
Players can still see the chips, cards, etc. but can't interact with any of them anymore.

All the time each player has a button "Stop the game", which stops the current game immediately and resets the app to
the "Lobby" phase. All the time, players also have a button "Restart" which starts the game with the same set of players,
effectively this should be equivalent to pressing "stop the game", entering with all the same names and starting a game.