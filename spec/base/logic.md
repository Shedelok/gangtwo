# About This File

This file describes the base logic of the game.

# Home Page

This is a very simple web-based game. Exactly 1 lobby exists at any time. Initially, when the game is not started yet,
any player opening the home page sees a text input for their name and "Join Lobby" button. To join the lobby, the player
must type in their lobby-unique name and press the button.

# Lobby

In the lobby, the player see full list of players joined and a "Start Game" button that they can press at any time.

# Game

Once the "Start Game" button is pressed, the game begins and the set of players is fixed. The players are random
shuffled. Let N be the number of players in the game.

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

Each player also has a way to (secretly) communicate to the game that they are ready to move to the next round.

Once each player has a chip for the current round, and is ready, the round is over. Chips of this color are fixed until
the end of the game.

At the end of first round, 3 common cards are placed on the table. At the end of second and third rounds 1 more card is
placed on the table. Players cannot interact with the common cards.

Once the 4th round is over, each player gets a button "reveal cards" which, when pressed, shows their cards to everyone.
A player can only reveal their cards once everyone with a smaller value last round chip have done so.
Players can still see the chips, cards, etc. but can't interact with any of them anymore.

# Disconnection and Reconnection

If a player disconnects while in the lobby, they are removed from it immediately. They can rejoin at any time by
entering their name again.

If a player disconnects during a game or the finished phase, their seat, chips, and cards remain on the table. If the
player reconnects in the same browser (e.g. after a page refresh or a brief network interruption), they automatically
resume their old seat and can continue playing. If they connect from a different browser or device, they join as a new
visitor.

# Stop and Restart

All the time each player has a button "Stop the game", which stops the current game immediately and resets the app to
the "Lobby" phase, opening the home page for all players. All the time, players also have
a button "Restart" which starts the game with the same set (and order) of players and any other settings.