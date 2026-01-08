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
| Estimation | 1h41m | 39m | 
| Actual     | 1h41m30s | 41m |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1$$
  
  **Total Error Ratio = 0.0049**
    
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_{task_i}}-1 \right| $$

  **Absolute Relative Error = 0,0588**

  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated: 7h55m
  - Total hours spent: 7h55m
  - Nr of automated unit test cases: 599
  - Coverage (if available): 
    - Statements: 84.25 %
    - Branches: 72.33 %
    - Functions: 71.09 %
    - Lines: 83.85 %
- Integration testing:
  - Total hours estimated: 7h55m
  - Total hours spent: 8h5m
- E2E testing:
  - Total hours estimated: 4h
  - Total hours spent: 4h25m
- Code review: 
  - Total hours estimated: 15h
  - Total hours spent: 13h25m
- Technical Debt management
  - Strategy adopted: We aimed to bring our codebase closer to the established quality standards. We successfully maintained this approach up to Sprint 2. For Sprint 3, however, the code quality ended up slightly above the expected technical debt threshold. We plan to pay off this debt in the next sprint.
  - Total hours estimated at sprint planning: 3h
  - Total hours spent: 3h
  


## ASSESSMENT

- What caused your errors in estimation (if any)?

    There were no major errors in estimation, the only task with a significant gap between estimated and spent time is the one related to the update of the database of story#25, which took less time than expected.

- What lessons did you learn (both positive and negative) in this sprint?
    
    **Positive**: We confirmed that our overall time estimation for the sprint was very precise, almost perfect.
    **Negative**: We learned that we need to improve our task management on YouTrack.

- Which improvement goals set in the previous retrospective were you able to achieve? 
    
    We were able to achieve both improvement goals set in the previous retrospective without issues.
- Which ones you were not able to achieve? Why?

    None.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)
  - Improve task management on YouTrack: we need to be quicker on assigning spent time to tasks and on moving them to the "To Verify" state, in order to let our colleagues know immediately when they can start working.
  - Improve Technical Debt Management: we need to improve our techniques to pay off Technical Debt, since we had some problems when merging different branches
  
- One thing you are proud of as a Team!!

  We are really proud of the improvements we have made since the first sprint, especially we were able to spread the amount of work evenly through all the sprint, without having to rush in the last days.