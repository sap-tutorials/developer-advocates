---
auto_validation: true
time: 5
author_name: Daniel Wroblewski
author_profile: https://github.com/thecodester
tags: [ tutorial>beginner, topic>cloud ]
primary_tag: topic>cloud
parser: v2
---
  
# 🟣 Release and Deploy to Shared Environment
<!-- description --> Create a release version of your project and deploy to your shared environment, where you can perform more testing.
 
## You will learn
- How to create a release version of a Joule Studio project
- How to deploy a Joule Studio project
- How to test your Joule Studio project in your shared environment

## Prerequisites
- You have completed the previous tutorial in the Joule Studio CodeJam Mission, []().


## Intro




### Release project
### Part 2: Release and Deploy the Project

1. Open your **Project Overview** page in Joule Studio and click **Release**.  
<img width="1785" height="650" alt="image" src="https://github.com/user-attachments/assets/faccf2e2-4d91-48e1-94a6-e76771abcdd2" />

2. Once released, navigate to the **Released Version** of your project and click **Deploy**.  
<img width="1798" height="583" alt="image" src="https://github.com/user-attachments/assets/4203bcc9-071a-417c-9216-763f674d74dc" />



### Deploy project
3. In the deployment dialog, select the **Shared Environment** you just created and click **Deploy**.  
<img width="1799" height="576" alt="image" src="https://github.com/user-attachments/assets/b4edd086-1d3b-495d-9548-9102548ee0a0" />

4. In the next step, map the destinations as follows:

   | Destination | Value |
   |--------------|--------|
   | **AICore** | `included-ai-core` |
   | **GetFromGTT** | `gttGetService` |
   | **PostToGTT** | `gttwriteservice` |

<img width="1790" height="784" alt="image" src="https://github.com/user-attachments/assets/5abf7cf8-ff54-4318-b52b-9f7868c12051" />

5. Click **Deploy**.
  
> [!NOTE]
> If this step fails for any reason, refresh the entire page and try again.

   The project will begin deployment and show as **Deployed** once complete.  
<img width="1779" height="628" alt="image" src="https://github.com/user-attachments/assets/2fce907d-88b7-4819-b523-680e0a79a971" />


### Test in shared environment
1. Navigate to **Control Tower → Environments**.  
<img width="1790" height="790" alt="image" src="https://github.com/user-attachments/assets/4fb77b80-a21f-4b7c-a608-0d098e856dd3" />

2. Search for and open the **Shared Environment** where your project was deployed.  
<img width="1797" height="439" alt="image" src="https://github.com/user-attachments/assets/e2f25742-d7ff-4084-92fd-d627dcb34f2c" />

3. Click on the **Joule** tab, then click **Launch** to open the **Joule Assistant**.
> [!NOTE]
> If you do not see the Joule tab, it may be hidden due to yur screen resolution. Click the menu button to the right (3 vertical dots) to find the **Joule tab**.

4. Enter the same prompts used during private testing (see [Ex. 4.1](../ex4/ex4.1-test-joule-agent.md)) to validate the behavior.

<img width="1795" height="502" alt="image" src="https://github.com/user-attachments/assets/00e848fa-a6d5-4f19-8351-4dcdba54de0c" />

