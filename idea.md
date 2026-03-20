# Ideas

## General

### Maybe Now

### Maybe Later

- (Maybe) Make chips clickable
- (Maybe) Create a bot that would help with testing by doing random stuff
- Maybe move "tick/cross next to player's name" UI spec into a single place (now it's in 3+ places).
- Make UI look good at 100% scale
- Get rid of spec duplication when describing different animations (chip move, card reveal, action card move)
- spec/addons/logic.md should not have UI spec, it all should be moved to ui/. Probably whole spec/logic should be
  restructured and split in a different way rather than ui vs logic
- Make it that incompatible addons can't be rolled together. If no config is possible, the game can't start
- Make sure multiple guesses have the same order in buttons and clouds
- New agent is too expensive

## Addons

1. For each round there's a timer (like 1m for example) after which all chips on the table are assigned automatically
   and
   the end of the round is forced
2. Each player starts with a counter (for example, 10) each time they steal from another player the counter is
   decreased.
   Once the counter becomes zero, the player can't still anymore, they can only take from the middle of the table.
3. Everyone has 3 pocket cards instead of 2
4. After the turn is over, its card is randomly rerolled
5. After the flop is over, a random card from it is rerolled
6. One player doesn't see one of their cards
7. You can see all other players' pocket hands, but you can't see yours
8. At preflop you give one of your cards to the person to your left
9. At preflop you look at your cards and then all hands are randomly shuffled and redistributed.
10. Somewhere in the middle of the game the hand rankings are random shuffled, shown to all players and these new
    rankings
    are used for the rest of the game.
11. You get 3 cards on preflop, but on flop you have to discard one of them.
12. One player once can swap one of their cards with one of the common cards.
13. One player can once tell all other players 50/50 their rank (all other players see 2 ranks: the actual and a random
    one).
14. When chip X is taken by a player who is actually Xth in the rank, the chip becomes black
15. When a black chip is taken by a player who is actually Xth, it stays normal, otherwise it becomes white
16. Rank X doesn't exist for this game (for example, flush is not a thing just as if it was never a poker hand).
17. Kickers (non-scoring cards) are reversed (go in reversed order).
18. If at least one of the community cards in Round 2 is a J, Q, or K, the following
    occurs: The player who has the white 1-star chip (from Round 1) must put their
    pocket cards face down in the discard pile and draw new pocket cards from
    the deck.
19. If none of the community cards in Round 2 is a J, Q, or K, the following
    occurs: The player who has the highest-value white chip (from Round 1) must
    put their pocket cards face down in the discard pile and draw new pocket
    cards from the deck.
20. Decide which of you will share what hand ranking their current hand has
    (pocket cards plus current community cards) with the rest of the players. They
    cannot share further details.
21. Decide which of you will share with everyone how many cards of a specific
    value they have in their hand
22. Decide which of you will take one card from the deck and add it to their hand.
    Afterward, this player must place one of their pocket cards face down on the
    discard pile. This can be the card that they have just drawn from the deck.
23. Once the pocket cards have been dealt in Round 1, each of you chooses one
    of your pocket cards. Everyone then simultaneously passes their chosen card
    to the player on their left as a pocket card.
24. All names are hidden (you don't know where is who) and players are random shuffled every time.
25. On a random round (or during whole game) instead of being placed on the table, chips are randomly distributed to
    players (maybe everyone gets same rank chip as their last one). Instead of taking, dropping, stealing players can
    only swap their current chip to the one in someone's hands.
26. One player once can secretly check the number of cards with a specific card value/suit in the deck. For example,
    they can check how many Jacks are in the deck.