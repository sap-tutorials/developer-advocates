---
auto_validation: true
time: 20
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
- How to test a Joule skill inside the project (design time)

## Prerequisites
- You have completed the previous tutorial in the Joule Studio CodeJam Mission, [Create Environments for Testing](joule-studio-codejam-2-private-environment).


## Intro
**Joule skills** are modular components designed to execute **atomic, predefined operations** within a business context.

Each skill performs a single task — such as retrieving data, triggering transactions, or querying systems — based on structured inputs and deterministic logic. Their purpose is to streamline repetitive, rule-based activities by providing a **fast, reliable, and reusable automation mechanism**.

![Skill](0-intro-1.png)

&nbsp;

Functioning within clearly defined parameters, Joule skills are ideal for **low-complexity, high-frequency operations** where consistency and precision are critical.

They are often tightly integrated with **SAP and third-party APIs** via **SAP Build actions**, enabling seamless execution of system-level commands.

While they can understand conversation context, their logic is **non-adaptive** — flows are static, and outcomes are predictable.

![Joule Skills Overview](Joule%20Skills.jpg)

&nbsp;

>💡 **Note:** Joule skills can be triggered:
> 
>    - through Joule’s conversational interface
>    - through another Joule skill
>    - through a Joule agent

 

### Create Joule Studio project
A Joule Studio project contains a set of custom skills, agents, and data types deployed together.

1. From the SAP Build Lobby, click **Create**.

    ![Create project](1-project-1.png)

2. On the next screen, choose the **Joule Agent and Skill** tile, and click **Next**.
    
    ![Joule Studio type](1-project-2.png)

3. In the **Create Project** dialog, enter the following details.

    >**IMPORTANT:** In the project name, use **YOUR** unique user number and **YOUR** initials.
    >
    >So if your user is **003** and initials **AJM**, the name of the project should be **Logistics Agent 003 AJM**.
    >
    >DO NOT USE MY INITIALS, DBW 🙃

    | Field         | Value                                     |
    |---------------|-------------------------------------------|
    | **Name**        | `Logistics Agent <UserID> <YOUR INITIALS>`                  |
    | **Description** | `Joule skills for GTT shipment management.` |

    ![Name and description](1-project-3.png)

4.  After filling in the details, click **Review**, then click **Create**.

Your project will open to the **Overview** tab, where you can start adding skills and agents.

![New project](1-project-4.png)





### Create empty skill
You will create a new artifact to the project, a skill.

1. Click **Create**, and then choose **Joule Skill**.

    ![New skill](2-empty-1.png)

2. In the **Create Joule Skill** dialog, enter the following details. 

    | Field         | Value                                     |
    |---------------|-------------------------------------------|
    | **Name**        | `Track Shipment`                  |
    | **Description** | `A skill to track shipments in the GTT System.` |

    Click **Create**.

    ![Name skill](2-empty-2.png)

    >The identifier is autopopulated based on the skill name.

Once you create a new skill, the skill builder canvas opens for you to design the skill.

![Skill builder](2-empty-3.png)

>If you have any experience with SAP Build Process Automation, you will be familiar with the layout, which is used for designing processes.
>
>By default you get a flow that has just two steps: trigger and end. To this flow, you click the plus icon and add steps, then configure each step.






### Add input parameters
You can define parameters that are required by the skill. 

Joule will try to understand the values from the context. If any required input parameters are missing Joule will automatically prompt the user to enter them (or sometimes derive them without input). In the parameter description, you can define rules for the parameter, such as format.

1. Click open the right-side panel, which is used to define the skill settings and parameters.

    >You can also open the panel by clicking the **Trigger** step.

    ![Side pane](3-input-1.png)

2. Click the **Parameters** tab.

    ![Parameters pane](3-input-2.png)

3. Next to **Skill Inputs**, click **Configure**.

    ![Configure input](3-input-3.png)

    >**Skill Inputs:** Data derived from the conversation.

    >**Skill Outputs:** Data sent into the conversation context.

    >**Skill Variables:** Temporary data stored during the skill execution, which can be set with a **Set Variable** step.

4. In the **Configure Skill Inputs** dialog, click **Add Input** and enter the following details:

    | **Name**       | **Identifier** (auto-populated) | **Description**         | **Required** |
    |----------------|----------------|--------------------------|:---------------:|
    | `trackingID`     | `trackingid` (autopopulated)     | `Tracking Number`              | ✅ |

    >The identifier is autopopulated based on the skill name.

    Click **Apply**.

    ![Add input parameter](3-input-4.png)

    You should now see the new input parameter in the side panel.

    ![New input parameter](3-input-5.png)

5. Click **Save** (upper right).





### Add confirmation and status messages
Joule Studio lets you to provide response data and enable Joule to design/format the response based on that data.

But you can also design your own messages when you want the response to be exactly a certain format.

There are several types of messages you can send:

![Messages](messages1.png)

- **Send Message:** Contains the main response to the user, which can be formatted as a text message, a card or a list.

- **Send Status Message:** Contains info about the status of the request to Joule, so Joule can tell the user, for example, that a request to the backend is underway.

- **Send Confirmation Request:** Let's you ask for confirmation that the user wants to proceed.

You will make use of the **Send Message** in a later tutorial. In this tutorial, you will add the confirmation and status messages.

1. Just after the trigger step, click the **+** button.

    ![New step](confirm0.png)

    Click **Send Response**.

    ![Send Response](confirm1.png)

    Click **Send Confirmation Request**. 

    ![Send Confirmation Request](confirm2.png)

2. On the right-side panel, click **Open Message Editor**.

    ![Open Message Editor](confirm3.png)

3. Set the fields as follows:

    | Field         | Value                                     |
    |---------------|-------------------------------------------|
    | **Title**        | `Did you want to track this shipment ID?`                  |
    | **Text** | Click **<>** on the right side of the field, and bind this to the field **context > startEvent > trackingID**  |
    | **Confirm** | `Yes` |
    | **Cancel** | `No` |

    ![Configure confirmation message](confirm4.png)

    Click **Save**.

4. Under the **Confirm** branch, click the **+** button.

    ![Add step](messages2.png)

    Click **Send Response**.

    ![Send Response](messages3.png)

    Select **Send Status Update**.

    ![Send Status Update](messages4.png)

5. On the right-side panel, click **Open Message Editor**.

    ![Open Message Editor](messages5.png)

6. For the **Message** field, enter `Checking GTT system ... `.

    ![Configure status message](messages6.png)

    Click **Save**.

7. Click **Save** (upper right).



    



### Add action to skill
Actions let skills retrieve data from a backend. Here, you want to retrieve info about a particular shipment.

1. In the skill builder, click the **+** icon under the status message (in the **Confirm** branch).

    ![New step](4-action-1.png)

    Choose **Call Action**.

    ![Call action](4-action-2.png)

2. Click **Browse All Actions**.

    ![Browse actions](4-action-3.png)

    Find the action **getReadquery**

    ![getReadquery](4-action-4.png)

    >If there are a lot of actions, you can filter by **GTTReadService** (the name of the action project).

    Click **Add** to the right of the action.

    The action is added to the skill flow.

    ![Action added](4-action-5.png)

>By adding a skill, you automatically add to the project a dependency to the action project that contains the action.
>
>You can see this by opening up the project settings. Click the cog.
>
>![Dependency](dependency1.png)
>
>Under **Dependencies**, you can see the action project you added.
>
>![Dependency](dependency2.png)






### Configure action
Actions define a specific API call. But each time you add the action you can provide different inputs and also specify different destinations so the call reaches different backends.

1. Make sure the action is selected.

2. In the first, **General** tab, click inside the **Destination Variable** field, and then click **Create Destination Variable**.

    ![Create destination](5-action2-1.png)


3. In the **Create Destination Variable** dialog, enter the following details. 

    | Field         | Value                                     |
    |---------------|-------------------------------------------|
    | **Identifier**        | `GetFromGTT`                  |
    | **Description** | `Destination to fetch data from the GTT System` |

    Click **Create**.

    ![Name destination](5-action2-2.png)

4. The variable is created but it likely will not be selected or even visible in the **Destination Variable** field.

    >**IMPORTANT:** To see the destination, you may need to:
    >
    >1. Close the configuration panel.
    >
    >2. Click the action again, which will reopen the configuration panel, and now you will see the destination.
    >
    >![Reopen](refresh.png)
    >
    >You can also refresh the page and then navigate back to your skill and then action.

    Select the new **GetFromGTT** variable for the action.

    ![Select destination](5-action2-3.png)

    The destination should then appear in the field.

    ![Destination added](5-action2-4.png)

5. To specify the shipment to track, you will add some filter data to the action.

    With the action selected, select the **Input** tab on the right pane. 

    Click inside the **$filter** field, and select **Apply a Formula**. The formula editor opens.

    ![Open editor for filter](5-action2-5.png)

    >**IMPORTANT:** DO NOT ENTER THE FORMULA DIRECTLY INTO THE FIELD. You must click **Apply a Formula** and enter the formula in the formula box.
    >
    >DO NOT DO THIS:
    >
    >![Do not do this](5-action2-5a.png)
    
    Enter the following formula in the box:

    ```JavaScript
    ConcatenateStrings(["trackingId eq ", <Tracking ID>, ""], "'")
    ```

    ![Formula added](5-action2-6.png)

    The formula editor will show that the syntax is invalid.
    
    In the formula editor, you need to replace `<Tracking ID>` with a reference to the input paramter. Select `<Tracking ID>` and then double-click **Skill Inputs > trackingID** from the left side.

    ![Bind tracking ID](5-action2-7.png)

    Now the formula editor will show the syntax is valid (green).

    ![Formula updated](5-action2-8.png)

    >This creates the same input value you used to test the action in the first tutorial, except now the shipment ID will be taken from the input parameter, which takes it from the conversation.

    Click **Apply**.



### Create output parameters
You need to create output parameters so that the skill returns data to Joule (or to an agent if it is inside an agent -- more on that later). Joule can then use this output parameter to determine the correct response to the user.


1. Click the **Trigger** step.

2. Click the **Parameters** tab, and the next to **Skill Outputs** click **Configure**.
  
    ![Configure output parameters](6-output-1.png)

3. Click **Add Ouput** three times and add the following output parameters.

    | **Name**          | **Description**     | **Type** | **Required** | **List** |
    |--------------------|---------------------|-----------|---------------|-----------|
    | `gttstatus`        |  `Status`              | **String** | ⬜ Unchecked| ⬜ Unchecked|
    | `destinationcity`  | `Destination City`    | **String** | ⬜ Unchecked| ⬜ Unchecked|
    | `json`             |  `JSON`                | **Any**    | ⬜ Unchecked| ⬜ Unchecked|

    >The identifiers are autopopulated.

    Click **Apply**.

    ![Output parameters](6-output-2.png)

4. Click **Save** (upper right).



### Bind data to output parameters
You created the output parameters to send data back to Joule or the agent. Now you need to supply the data.

1. Click the **End** activity.

    ![End binding](7-end-1.png)

2. For each output parameter, bind the following by clicking inside the parameter field and navigating to the indicated field:

    | **Field Name**     | **Mapped Value**  |
    |--------------------|------------------|
    | **destinationcity**     | getReadquery > result > d > list - results > arrivalLocationId |
    | **gttstatus**      |  getReadquery > result > d > list - results > plannedEvents > list - results > eventStatus_code |
    | **json**             | getReadquery > result |

    The mapped fields should look like this:

    ![Fields mapped](7-end-2.png)

    >**IMPORTANT:** Do not copy and paste the above texts into the field. The text represent a path to the field to bind; find the field, and double-click it.

3. Click **Save** (upper right).





### Test the skill
A nice feature of Joule Studio is that you can test your project without having to release and deploy it, right from within the design-time project itself.

1. Click **Test** in the upper-right.

    ![Start test](8-test-1.png)

2. In the **Test Project** dialog, enter the following details.

    | Field         | Value                                     |
    |---------------|-------------------------------------------|
    | **Environment**        | Select the email address of your user                  |
    | **Environment variables > GetFromGTT** | Select **gttGetService** |

    Click **Continue**.

    ![Test variables](8-test-2.png)

    A new browser tab opens with Joule. 

    >The first time you run the test, it might take a couple of minutes for the browser tab to open.

3. Enter into the prompt **Track Shipment**.

    ![Enter prompt](8-test-3.png)

    Since the skill requires a shipmentv ID as input, Joule will ask for it.

    ![Enter shipment ID](8-test-3a.png)

    Enter `91001DBW`.

    Joule will now give you a confirmation message to check if the correct shipment ID was selected.

    ![Confirmation](8-test-3b.png)

    Click **Yes**. 
    
    Joule will briefly show your status message.

    ![Status](8-test-3c.png)
    
    And then Joule will output information from shipment **91001DBW**.

    ![Response](8-test-4.png)

    The exact format varies, since the skill returns data back to Joule and specified that Joule design the output. If you wanted to control the output, you could have specified a **Send Response** step and designed the output more precisely.

4. Request the same thing again, this time by entering the following prompt, and then clicking **Yes** to confirm:

    ```Prompt
    I want to track the shipment 91001DBW
    ```

    The response will likely be formatted differently. 
    
    ![Response again](8-test-5.png)

    >Why didn't Joule return exactly the same answer?

5. Notice that **Timeline** on the right of the screen, which gives you information on how the response was derived. The exact nodes are different depending on your flow.

    If you performed the steps up to now, you probably will get the following:

    - **Joule text message** represents the text response asking for the shipment ID. Under this, **Joule selected a scenario to execute** shows which skill (or agent) was selected in response to the prompt.

    ![Logs](logs1.png)

    You will see the moment after confirmation where your status message was displayed.

    ![Logs](logs1a.png)

    **The scenario trackShipment is called with parameters** shows you which skill was triggered with what input parameters.

    ![Logs](logs2.png)

    And **Dialog function trackShipment finished** will show the actual data that was returned from the backend by the action.

    ![Logs](logs3.png)
 
6. Once you are done testing, click **Stop Testing**.

    ![Stop testing](8-test-6.png)



### Test the skill in your language
You can talk to Joule in your language.

1. Start the testing again.

    ![Joule German](Joule-German.png)

2. Enter a prompt in your language.

    Here is a sample prompt in English:

    ```Prompt
    I want to track the shipment 91001DBW
    ```    

    For example, in German, type in:

    ```Prompt
    Ich möchte die Sendung 91001DBW verfolgen.
    ```

3. Click **Yes** to confirm.

    You should get the same response as before, and if your browser is set for Portuguese, your response will be in Portuguese.

    ![German](German.png)


### Questions to ponder

- Was there a faster way than what was written to create a project?

- Why would I want Joule to make the messages and not me?

- There are 2 places in this skill where you see output fields. What are they?

- When you added output parameters, this caused an error on the **End** step. Why?

- If you don't save the project, what happens when you try to test?

- When you tested, you got different formats and different fields for the same prompt. Why is that, based on AI and based on our actual project?


