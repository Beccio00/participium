TEMPLATE FOR RETROSPECTIVE (Team 13)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed vs. done 
    - 4 stories committed --- 4 stories done
- Total points committed vs. done 
    - 14 points committed --- 14 points done
- Nr of hours planned vs. spent (as a team)
    - time estimated: 96h --- time spent: 92h05m

**Remember**a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD if required (you cannot remove items!) 

### Detailed statistics

| Story | # Tasks | Points | Hours est. | Hours actual |
|-------|--------:|-------:|-----------:|-------------:|
| _Uncategorized_ | 14 | - | 45h | 43h48m |
| Citizen registration | 9 | 2 | 11h45m | 10h15m |
| Municipality users setup | 9 | 2 | 10h5m | 10h45m |
| Municipality users role assignment | 10 | 2 | 10h5m | 8h47m |
| Location selection | 12 | 8 | 19h5m | 18h30m |
| **Total** | 54 | 14 | **96h** | **92h05m** |


> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean | StDev |
|------------|------|-------|
| Estimation | 2h08m | 2h13m | 
| Actual     | 2h20m30s | 2h22m |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1$$
  
  **Total Error Ration = 0,0996**
    
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_{task_i}}-1 \right| $$

  **Absolute Relative Error = 0,1583**
  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated: 4h (stories 1 & 2), 2h (story 3, not done)
  - Total hours spent: 3h 56m (stories 1 & 2), 0h (story 3, not done)
  - Nr of automated unit test cases : 212
  - Coverage (Jest report):
    - Statements: 25.92 %
    - Branches: 11.86 %
    - Functions: 16.14 %
    - Lines: 74.45 %
- E2E testing:
  - Total hours estimated: 0h
  - Total hours spent: 0h
  - Nr of test cases: 0
- Integration testing:
  - Total hours estimated: 4h (stories 1 & 2), 2h (story 3, not done) 
  - Total hours spent: 4h 30m (stories 1 & 2), 0h (story 3, not done)
  - Nr of test cases: 26
- Code review 
  - Total hours estimated: 7h (stories 1 & 2), 2h (story 3, not done) 
  - Total hours spent: 11h 40m (stories 1 & 2), 0h (story 3, not done)
  


## ASSESSMENT

- What did go wrong in the sprint?
    - The issues are related to task assignement which led to an uneven workload distribuition for each tema member. Compounding this, some task descriptions were too vague, making it difficult to understand the full scope of the work needed.

- What caused your errors in estimation (if any)?
    - Our main estimation errors were overestimations, caused by two factors:
      - decision tasks (e.g. Architecture design) took less tima than planned because many decicions were inherited from the previous project.
      - database update tasks were estimated for stories that ultimately did not require big changes
      We also had a few underestimated tasks, primarily due to unexpected issues with Git versioning.

- What lessons did you learn (both positive and negative) in this sprint?
    - **Negative**: We learned that our task descriptions must be more detailed during sprint planning to avoid ambiguity and ensure clarity.
    - **Positive**: We confirmed that, despite issues with individual tasks, our overall time estimation for the sprint was quite precise.

- Which improvement goals set in the previous retrospective were you able to achieve? 
    - First sprint, no previous set goals
  
- Which ones you were not able to achieve? Why?
    - First sprint, no previous set goals

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  > Propose one or two
  - Improve task definition and description during sprint planning to ensure a shared and clear understanding of the work to be done.
  - Adoption of "Swagger-first" approach, starting all stories development from the APi definition, in order to improve team alignment and consistency.

- One thing you are proud of as a Team!!
  - We are proud of our excellent and proactive communication, which consistently kept each other updated on the project's status and fostered a strong, collaborative environment by regularly providing feedback on each other's work.