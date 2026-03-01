# Ideas

## General

- Chip layout: show 4 chips in a single row (currently wraps freely). Fix in `PlayerSeat.tsx`.
- Restart / Stop Game buttons: fix margin between them — currently positioned with fixed `right` offsets that look
  uneven. Fix in `App.tsx`.
- "Move to next round": replace checkbox+label with a proper button. Fix in `PlayerSeat.tsx`.
- Add animation and sound for when more common cards are revealed.
- When your chip is stolen, the "Move to next round" checkbox should be unchecked.
- Add hint with poker hand rankings.
- Add hash for lobby settings for an easy "just paste" setup.
- Addons should not just apply, they should be randomized.

## Addons

1. You can only see chips from the current round, not from the previous ones
2. The chips of value R are black (R is a random number from 1 to N fixed at the beginning of the game).
3. For each round there's a timer (like 1m for example) after which all chips on the table are assigned automatically
   and
   the end of the round is forced
4. Player can only steal from neighbors (the person next to them either on left or right)
5. Each player starts with a counter (for example, 10) each time they steal from another player the counter is
   decreased.
   Once the counter becomes zero, the player can't still anymore, they can only take from the middle of the table.
6. Additional card on flop
7. Additional card on turn
8. Additional card on river
9. Everyone has 3 pocket cards instead of 2
10. After the turn is over, its card is randomly rerolled
11. After the flop is over, a random card from it is rerolled
12. One player doesn't see one of their cards
13. You can see all other players' pocket hands, but you can't see yours
14. Everyone sees their cards as well as the cards of the player to their left
15. At preflop you give one of your cards to the person to your left
16. At preflop you look at your cards and then all hands are randomly shuffled and redistributed.
17. Somewhere in the middle of the game the hand rankings are random shuffled, shown to all players and these new
    rankings
    are used for the rest of the game.