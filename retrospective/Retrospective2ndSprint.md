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
    - 6 stories committed --- 5 stories done
- Total points committed vs. done 
    - 24 points committed --- 16 points done
- Nr of hours planned vs. spent (as a team)
    - time estimated: 96h --- time spent: 95h06m

**Remember**a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD if required (you cannot remove items!) 

### Detailed statistics

| Story | # Tasks | Points | Hours est. | Hours actual |
|-------|--------:|-------:|-----------:|-------------:|
| _Uncategorized_ | 14 | - | 35h40m | 35h10m |
| Report Details | 12 | 5 | 13h05m | 13h50m |
| Report approval and rejection | 8 | 1 | 8h35m | 8h45m |
| Report display on the map | 6 | 5 | 5h25m | 5h16m |
| Report assign overview | 8 | 2 | 10h05m | 10h05m |
| User account customization | 9 | 3 | 9h35m | 9h50m |
| Update report | 10 | 8 | 13h35m | 12h10m | 
we did not manage to finish the implementation of this story 
| **Total** | 67 | 24 | **96h** | **95h06m** |


> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean | StDev |
|------------|------|-------|
| Estimation | 1h26m | 1h11m30s | 
| Actual     | 1h25m | 1h12m |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1$$
  
  **Total Error Ration = -0,0094**
    
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left| \frac{spent_{task_i}}{estimation_{task_i}}-1 \right| $$

  **Absolute Relative Error = 0,0688**
  
## QUALITY MEASURES 

- Unit Testing:
  - Total hours estimated: 6h (stories 1, 2, 3 & 4 done)
  - Total hours spent: 5h (stories 1, 2, 3 & 4 done)
  - Nr of automated unit test cases : 189
  - Coverage (Jest report):
    - Statements: 93.68 %
    - Branches: 91.35 %
    - Functions: 88.15 %
    - Lines: 93.48 %
- E2E testing:
  - Total hours estimated: 1h 30m
  - Total hours spent: 1h 30m
  - Nr of test cases: 41
- Integration testing:
  - Total hours estimated: 6h (stories 1, 2, 3 & 4 done)
  - Total hours spent: 6h 30m (stories 1, 2, 3 & 4 done)
  - Nr of test cases: 64
- Code review 
  - Total hours estimated: 10h (stories 1, 2, 3 & 4 done)
  - Total hours spent: 9h 45m (stories 1, 2, 3 & 4 done)
  


## ASSESSMENT

- What did go wrong in the sprint?
    - The major issue has been the time management becuase we started implementing the stories too late, so we had most of the work done during the second week of the sprint. (This is due to the large number of projects all the team members are working on during this period)

- What caused your errors in estimation (if any)?
    - The errors in the estimation were caused by having encountered problems with docker configurations, in particular its alignement with the prisma schema.

- What lessons did you learn (both positive and negative) in this sprint?
    - **Negative**: We learned that our docker management was poor, in fact we had several issues with its alignement with our server and client.
    - **Positive**: We learned how to better describe tasks, in fact we did not have any kind of confusion when approaching a new story development. Moreover, thanks to the frontend code refactoring, the implementation of new features was easier. 

- Which improvement goals set in the previous retrospective were you able to achieve? 
      We succedeed in improving the task description, in fact during this sprint there was no kind of confusion in what to do during specific tasks. Furthermore, we did implement the "Swagger-first" approach, so we did not have alignement problems between tasks. Finally, we succeed to lower our total error ratio and absolute relative error.
  
- Which ones you were not able to achieve? Why?
      We managed to achieve both goals set in the previous retrospective.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  > Propose one or two
  - Improve the docker configuration files: we need to adjust both the docker alignement with our db and the management of the docker files.
  - Change from Prisma to TypeORM, due to the problems we encoutered.

- One thing you are proud of as a Team!!
  - We are proud of the efficient team collaboration: even if we encoutered many problems with Prisma and Docker, everytime someone had to solve one of them every member of the team was ready to support them.