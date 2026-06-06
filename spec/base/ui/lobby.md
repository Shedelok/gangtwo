# About This File

This file describes the UI of the lobby page.

# Start Game Button

If the game cannot start for any logical reason, the Start Game button appears gray and cannot be pressed. Start Game
button only takes effect once all players in the lobby have it pressed. Players can press/unpress it, and they can see
how many players have it pressed. When the button is pressed, it reads "Waiting" and has less bright color. Players who
have the Start Game button pressed have a green tick on the right side visible to everyone. The space for the tick is
always reserved, so that when it appears/disappears, the size of the player's row doesn't change.

# Test Mode Checkbox

When in the lobby phase, there is a 'Test Mode' checkbox displayed to the right of the hand ranking button. When
unchecked, this checkbox has no effect. When checked, all players in the lobby can set specific cards for players and
for common cards. When the 'Test Mode' checkbox is checked, next to each player in the lobby there is a text input field
for cards. There is also one more text input above the Start Game button for common cards with "Common cards" text. Each
text input accepts cards
in a format like "As, 10d, 7h", etc. Specific cards can be set in each text input to be dealt to the player or on the
table instead of picking a random card from the deck. For example, if there are 3 players: Alice has empty text input,
Bob has "8c" in their text input, Clement has "7d, 7h" in their text input and the text input above start game button
has "2h, Ah, Ks, 8d", it means that Alice will receive 2 random cards from the deck, Bob will receive 8 of clubs and
another random card, Clement will receive 7 of diamonds and 7 of hearts, common cards will be 2 of hearts, Ace of
hearths, King of spades, 8 of diamonds and then a random card (in this order). Any additional common cards will be
random (but only after these 4 are dealt).

If the configuration inputted is invalid (can't parse cards or they conflict with the game rules or anything else), the
game cannot start.
