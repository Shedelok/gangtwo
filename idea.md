# Ideas

## General

- Make UI look good at 100% scale
- Get rid of spec duplication when describing different animations (chip move, card reveal, action card move)
- spec/addons/logic.md should not have UI spec, it all should be moved to ui/
- Fix that action card is appearing in 2 places when returned from another player to the table.
- Create Claude Code aliases for implementing spec changes and verifying them against full spec
- (Maybe) Make chips clickable

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
13. Right after dealing the cards each player says how many J,Q,K they have.
14. Cards of rank >10 are removed from the deck
15. One player can once tell all other players 50/50 their rank (all other players see 2 ranks: the actual and a random
    one).
16. When chip X is taken by a player who is actually Xth in the rank, the chip becomes black
17. When a black chip is taken by a player who is actually Xth, it stays normal, otherwise it becomes white
18. Rank X doesn't exist for this game (for example, flush is not a thing just as if it was never a poker hand).
19. Kickers (non-scoring cards) are reversed (go in reversed order).
20. If at least one of the community cards in Round 2 is a J, Q, or K, the following
    occurs: The player who has the white 1-star chip (from Round 1) must put their
    pocket cards face down in the discard pile and draw new pocket cards from
    the deck.
21. This challenge adds an extra condition for a successful heist. Before the player
    with the highest-value red chip reveals their hand in the showdown, you must
    do the following: The other players must confer and agree together on a card
    value (from 2 to ace) that they believe the player with the highest-value red
    chip has at least one of in their pocket cards. The player with the highest￾value red chip obviously cannot take
    part in this discussion or give hints. If the
    players are incorrect, the heist is unsuccessful, even if the ranking of the red
    chips was correct.
22. If none of the community cards in Round 2 is a J, Q, or K, the following
    occurs: The player who has the highest-value white chip (from Round 1) must
    put their pocket cards face down in the discard pile and draw new pocket
    cards from the deck.
23. Decide which of you will share what hand ranking their current hand has
    (pocket cards plus current community cards) with the rest of the players. They
    cannot share further details.
24. Once the pocket cards have been dealt in Round 1, each player says how
    many “face cards” (J, Q, K) they have.
25. Decide which of you will share with everyone how many cards of a specific
    value they have in their hand
26. Decide which of you will take one card from the deck and add it to their hand.
    Afterward, this player must place one of their pocket cards face down on the
    discard pile. This can be the card that they have just drawn from the deck.
27. Once the pocket cards have been dealt in Round 1, each of you chooses one
    of your pocket cards. Everyone then simultaneously passes their chosen card
    to the player on their left as a pocket card.
28. On a random round R a random player P is "prisoned". They can't do anything until the next round starts. There's 1
    less chip distributed in that round (or maybe not).
