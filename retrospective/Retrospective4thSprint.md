TEMPLATE FOR RETROSPECTIVE (Team 13)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed vs done : 8 stories committed --- 8 stories done
- Total points committed vs done : 33 points committed --- 33 points done
- Nr of hours planned vs spent (as a team) : 96h05m planned --- 96h20m spent

**Remember**  a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing
- Integration Test passing
- Code review completed
- Code present on VCS
- End-to-End tests performed
- All tasks are in "Done" state on YouTrack


### Detailed statistics

| Story           | # Tasks | Points | Hours est.  | Hours actual |
|-------          |--------:|-------:|-----------: |-------------:|
| _Uncategorized_ | 12     | -       | 20h35m      | 20h35m       |
| PT28            | 8      | 1       | 4h          | 4h02m        |
| PT15            | 9      | 1       | 4h05m       | 4h46m        |
| PT30            | 9      | 5       | 1d5h35m     | 1d5h42m      |
| PT10            | 9      | 2       | 5h25m       | 5h41m        |
| PT11            | 6      | 8       | 2d5h10m     | 2d3h25m      |
| PT12            | 10     | 8       | 2d35m       | 2d44m        |
| PT13            | 9      | 5       | 1d6h05m     | 1d5h30m      |
| PT14            | 10     | 3       | 1d2h10m     | 1d2h05m      |
| **Total**       | 82     | 33      | **96h05m**  | **96h20m**   |
   

> place technical tasks corresponding to story `#0` and leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean | StDev |
|------------|------|-------|
| Estimation | 1h10m18s | 47m48s | 
| Actual     | 1h10m30s | 47m25s |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1$$
  
  **Total Error Ratio = 0.0026**
    
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_{task_i}}-1 \right| $$

  **Absolute Relative Error = 0,0623**

  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated: 9h 30m
  - Total hours spent: 9h 49m
  - Nr of automated unit test cases: 892
  - Coverage (if available): 
    - Statements: 81.02%
    - Branches: 73.46%
    - Functions: 72.86%
    - Lines: 80.65% 
- Integration testing:
  - Total hours estimated: 12h
  - Total hours spent: 12h 25m
- E2E testing:
  - Total hours estimated: 3h 30m
  - Total hours spent: 3h 35m
- Code review: 
  - Total hours estimated: 24h 05m
  - Total hours spent: 23h 35m
- Technical Debt management
  - Strategy adopted: We had two dedicated sessions, one at sprint start to address Sprint 3 debt and one at sprint end to fix debt accumulated during Sprint 4 implementation.
  - Total hours estimated at sprint planning: 3h
  - Total hours spent: 3h
  


## ASSESSMENT

- What caused your errors in estimation (if any)?
There were no significant estimation errors. In fact, we successfully reduced our total error ratio despite an increase in the volume of tasks, demonstrating improved estimation accuracy and consistency.
    

- What lessons did you learn (both positive and negative) in this sprint?
    
    **Positive**: We improved our YouTrack task management, which increased overall transparency and effectively eliminated the need for manual status updates between team members.

    **Negative**: Holiday schedules led to temporary team member unavailability, which created bottlenecks and occasionally blocked progress for other members.

- Which improvement goals set in the previous retrospective were you able to achieve? 
    
    We successfully met both improvement goals established in the previous retrospective, which resulted in a more efficient workflow throughout this sprint.

- Which ones you were not able to achieve? Why?

    None.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)
  -  Increase the frequency of Scrum meetings: at the moment we do 2 scrum meetings per sprint. We want to increase this number since they are fundamental for a good team coordination.
  - Improve task prioritization: we should assign the priority to task more frequently, in order to establish a clearer roadmap for the sprint and ensure the team is always focused on the most high-impact work.

  
- One thing you are proud of as a Team!!

  We are proud of the team work that our group showed during all four sprints, always having a positive attitude and collaborative spirit, even when facing critical challenges.