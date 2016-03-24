# A Game of nomic

This is our game of nomic. If you wish to join, read through the laws.
In order to become an active player, submit a Pull Request into the players.yaml file
with your github username and points of 0. (Verify this process against the laws)

## Automation

This repository is being watched by our friend the Nomic Bot.
Nomic bot watches comments and will respond to commands. 

- **/open** - This will add the "Open For Voting" label to PRs.
- **yay** - This will cast a positive vote on a PR and Nomic Bot will manage the "Passing", "Failing", "Tied", and "Has Quorum" labels.
- **nay** - This will cast a negative vote on a PR and Nomic Bot will manage the labels.
- **/roll <generation string>** - This will instruct Nomic Bot to generate random numbers based on the generation string
  - **#d#** - (ex: 3d6) Will instruct Nomic Bot to roll 3 six sided dice. They will be reported individually.
  - **#d#+** - (ex: 3d6+) Will instruct Nomic bot to roll 3 six sided dice and add them together.
  - **#d#+#** - (ex: 3d6+4) Will instruct Nomic bot to roll 3 six sided dice, add them together, and add 4 to the total.
  - **#d#-#** - (ex: 3d6-1) Will instruct Nomic bot to roll 3 six sided dice, add them together, and subtract 1 from the total.

When the Nomic Bot receives a proper roll command, it will reply in a comment with the results.