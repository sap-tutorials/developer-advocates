---
auto_validation: true
time: 5
author_name: Daniel Wroblewski
author_profile: https://github.com/thecodester
tags: [ tutorial>beginner, topic>cloud ]
primary_tag: topic>cloud
parser: v2
---
  
# 3 - Create Skill to Track Shipments
<!-- description --> Create a skill to enable the user to track a shipment, where the user specifies a shipment ID and the skill returns information on that shipment.
 
## You will learn
- How to create a Joule skill

## Prerequisites
- You have completed the previous tutorial in the Joule Studio CodeJam Mission, [Create Environments for Testing](joule-studio-codejam-2-private-environment).


## Intro
**Joule skills** are modular components designed to execute **atomic, predefined operations** within a business context.

Each skill performs a single task — such as retrieving data, triggering transactions, or querying systems — based on structured inputs and deterministic logic. Their purpose is to streamline repetitive, rule-based activities by providing a **fast, reliable, and reusable automation mechanism**.

Functioning within clearly defined parameters, Joule skills are ideal for **low-complexity, high-frequency operations** where consistency and precision are critical.

They are often tightly integrated with **SAP and third-party APIs** via **SAP Build actions**, enabling seamless execution of system-level commands.

While they can understand conversation context, their logic is **non-adaptive** — flows are static, and outcomes are predictable.

![Joule Skills Overview](Joule%20Skills.jpg)

>💡 **Note:** Joule Skills can be triggered:
> 
>    - through SAP Joule’s conversational interface
>    - through another Joule Skills
>    - through Joule Agent



### Create Joule Studio project
A Joule Studio project contains a set of custom skills, agents, and date types deployed together.

1. From the SAP Build Lobby, click **Create**.

2. On the next screen, choose the **Joule Agent and Skill** tile, and click **Next**.
    
3. In the **Create Project** dialog, enter the following details.

    >**IMPORTANT:** You must use your unique user number, and your initials.**
    >
    >The name of the project should be **Logistics Agent <user number> <YOUR INITIALS>**.
    >
    >So if your user is **002** and initials **DBW**, the name of the project should be **Logistics Agent 002 DBW**.

    | Field         | Value                                     |
    |---------------|-------------------------------------------|
    | **Name**        | `Logistics Agent <UserID> <INITIALS>`                  |
    | **Description** | `Joule skills for GTT shipment management.` |

4.  After filling in the details, click **Review**, then click **Create**.

Your project will open to the Overview tab, where you can start adding skills and agents.






### Create empty skill
1. Click **Create**, and then choose **Joule Skill**.

2. In the **Create Joule Skill** dialog, enter the following details. 

    | Field         | Value                                     |
    |---------------|-------------------------------------------|
    | **Name**        | `Track Shipment`                  |
    | **Description** | `A skill to track shipments in the GTT System.` |

    Click **Create**.
  
    >The identifier is autopopulated based on the skill name.

Once you create a new skill, the skill builder canvas opens for you to design the skill.

>If you have any experience with SAP Build Process Automation, you will be familiar with the layout, which is used for designing processes.






### Add input parameters
You can define parameters that are required by the skill. 

Joule will try to understand the values from the context; if any required input parameters are missing Joule will automatically prompt the user to enter them.

1. Click open the right-side panel, which is used to define the skill settings and parameters.

2. Click the **Parameters** tab.

  >**Skill Inputs:** Data derived from the conversation.

  >**Skill Outputs:** Data sent into the conversation context.

  >**Skill Variables:** Data stored during the skill execution, which can be set with a **Set Variable** step.
  
3. Next to **Skill Inputs**, click **Configure**.

4. In the **Configure Skill Inputs** dialog, click **Add Input** and enter the following details:

    | **Name**       | **Identifier** (auto-populated) | **Description**         | **Required** |
    |----------------|----------------|--------------------------|---------------|
    | trackingID     | trackingiD     | Tracking Number              | ✅ |

    >The identifier is autopopulated based on the skill name.

    Once all inputs are added, click **Apply**.




### Add action to skill
1. In the skill builder, click on the **+** button.

    Choose **Call Action**

2. Click **Browse All Actions**, and find the action **getReadquery**.

    >If there a lot of actions, you can filter by **GTTReadService** (the name of the action project).

    Click **Add** to the right of the action.

    The action is added to the skill flow.


### Configure action
Actions define a specific API call. But each time you add the action you can provide different inputs and also specify different destinations so the call reaches different backends.

1. Make sure the action is selected.

2. In the first, **General** tab, click inside the **Destination Variable** field, and then click **Create Destination Variable**.

3. In the **Create Destination Variable** dialog, enter the following details. 

    | Field         | Value                                     |
    |---------------|-------------------------------------------|
    | **Identifier**        | `GetFromGTT`                  |
    | **Description** | `Destination to fetch data from the GTT System` |

    Click **Create**.

4. The variable is created but it likely will not be selected or even visible in the **Destination Variable** field.

    >**Important:** You may need to refresh the page, reopen the skill and reselect the action to see the new variable.

    Select the new **GetFromGTT** variable for the action.

5. To specify the shipment to track, we will add some filter data to the action.

    With the action selected, select the **Input** tab on the right pane. 

    Click inside the $filter field, and select **Apply a Formula**. The formula editor opens.
     
    Enter the following formula in the box:

    ```JavaScript
    ConcatenateStrings(["trackingId eq ", <Tracking ID>, ""], "'")
    ```

    In the formula editor, you need to replace `<Tracking ID>` with a reference to the input paramter. Select `<Tracking ID>` and then click **Skill Inputs > trackingID** from the left side, so that the formula looks like this:


    Click **Apply**.



### Create output parameters
You need to create output parameters so that the skill returns data to Joule (or to an agent if it is inside an agent -- more on that later). Joule can then use this output parameter to determine the correct response to the user.


1. Click anywhere in the skill builder's grey area.

2. Open the right-side pane.

3. Click the **Parameters** tab, and the next to **Skill Outputs** click **Configure**.
  
4. Click **Add Ouput** three times and add the following output parameters.

    | **Name**          | **Identifier**     | **Description**     | **Type** | **Required** | **List** |
    |--------------------|---------------------|-----------|---------------|-----------|
    | gttstatus        | gttstatus        | Status              | String | ⬜ Unchecked| ⬜ Unchecked|
    | destinationcity  | destinationcity  | Destination City    | String | ⬜ Unchecked| ⬜ Unchecked|
    | json             | json             | JSON                | Any    | ⬜ Unchecked| ⬜ Unchecked|

    Click **Apply**.



### Bind data to output parameters
You created the output parameters to send data back to Joule or the agent. Now we need to supply the data.

1. Click the **End** activity.

2. For each output parameter, bind the following:

    | **Field Name**     | **Mapped Value** | **Path** |
    |--------------------|------------------|------------------------|
    | destinationcity    | arrivalLocationId | getReadquery > result > d > list - results > arrivalLocationId |
    | gttstatus      | eventStatus_code     | getReadquery > result > d > results > plannedEvents > list - results > eventStatus_code |
    | json           | result           | getReadquery > result |

3. Click **Save** (upper-right).



### Test the skill
A nice feature of Joule Studio is that you can test your project without having to release and deploy it, right from within the design-time project itself.

1. Click **Test** in the upper-right.

2. In the **Test Project** dialog, enter the following details.

    | Field         | Value                                     |
    |---------------|-------------------------------------------|
    | **Environment**        | Select the email address of your user                  |
    | **Environment variables > GetFromGTT** | Select **gttGetService** |

    Click **Continue**.

    A new browser tab opens with Joule.

3. As a prompt, enter `I want to track the shipment 91001DBW`.

    Joule will output information from shipment **91001DBW**.

    The exact format varies, since we just returned data back to Joule and specified that Joule design the output. If we wanted to control the output, we could have specified a **Send Response** step and designed the output more precisely.

4. Enter `I want to track the shipment 91001DBW` again, and the response will likely be formatted differently.

5. Once you are done testing, click **Stop Testing**.



