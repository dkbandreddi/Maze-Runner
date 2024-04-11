Me (Dinesh Kumar 201927043) and my friend (Mehul Kapoor 201917168) have create the Maze Runner Game. This is a 3D maze-based game where a player navigates through a maze,
collects coins, and avoids or pursues NPCs based on power-ups. The game is built using Three.js and JavaScript for game logic.

How to Run.
make sure you have your necessary packages installed to run the game and enter npx vite on your terminal to get the game running.

Controls.
Use the arrow keys for the movement of the player.

Implemented Topics
1)Maze Generation: A random maze is procedurally generated for each game session using Depth First Maze Generation.
2)Pathfinding: NPCs use  the A* algorithm for pathfinding in the maze. The path can also be visible for a npc which is depicted by red circles which would make it easier for the player
to steer clear from the npc and also help navigate through the maze.
3) Steering Behaviors: The Steerinf behavior used are the wander, pursue simple path following and also evade. THe NPCs pursue the player or wander using steering behaviors and follow 
the path provided by the A* algorithm.
4) Player-NPC Interaction: NPCs wanders around the maze and upon the player being in the vicinity of the npc it calculates a path shortest to the player and follows that path
when the npc is close to the player it uses the pursue behavior to kill the player. upon killing the player the player then spawns randomly in the map with a life decreamented. 
and the player can evade or chase NPCs when powered up.

5)Power-Ups: Collectible items in the maze temporarily give the player the ability to chase NPCs ( this could not be accomplished). Alternative to this we made it such that 
upon collection of the power up the player would gain a extra life and the ground color changes to red for a second when it is collected.

6)Game Timer: A timer is set for game duration, after which the game ends.
7)Score Tracking: Player score is tracked based on the number of coins collected around the map.
8)Lives System: The player has a limited number of lives, which decreases on collision with NPCs and imcreases when power up item is collected.

Viewing Topics in Application
The maze generation is visible immediately upon starting the game.
Pathfinding can be observed as the NPCs navigate the maze.
Steering behaviors are noticeable in the movement patterns of NPCs.
Player-NPC interaction is seen when the player comes close to NPCs.
Power-ups are depicted by items in the maze which change the game dynamics when collected.
Game Timer is visible on the top-left corner of the game screen.
Score Tracking is updated in real-time on the game screen.
Lives System is reflected in the UI, and the game responds accordingly when lives are lost.

Work Contribution.

Dinesh

- Worked on movement of NPC's. Implemented the state machine for NPC where the npc follows the path given provided by the A* algorithm and chases the player 
when its in the vicinity of the npc.

- Implemented the timer and life concept.

- Added functionality to look at the path provided by the A* which is followed by the NPC.

Mehul
-  ⁠managing, sourcing assets for various entities
  
-  ⁠creation of game loop to add game play objects for progression.



