---
auto_validation: true
time: 30
author_name: Daniel Wroblewski
author_profile: https://github.com/thecodester
tags: [ tutorial>beginner, topic>cloud ]
primary_tag: topic>cloud
parser: v2
---
  
# 5 - Create Skill to Create / Update Shipment
<!-- description --> Create a skill to enable the user to create a new shipment in the GTT system, or update an existing shipment.
 
## You will learn
- How to create a skill
- How to add a condition to a skill

## Prerequisites
- You have completed the previous tutorial in the Joule Studio CodeJam Mission, [Create Skill to Show Delayed Shipments](joule-studio-codejam-4-skill-delayed).


## Intro
The last skill creates or updates a shipment, and includes a few new things.

- You will use a different action and create a different destination variable

- You will use the **Check Condition** step to provide different messages based on whether you are adding or updating a shipment.

- You will define specific output using the **Send Response** step. 



### Create empty skill
1. In your project, select the **Overview** tab.

2. Click **Create**, and choose **Joule Skill**.

    ![Create skill](1-empty-1.png)

3. In the **Create Joule Skill** dialog, enter the following details:

    | Field         | Value                                     |
    |---------------|-------------------------------------------|
    | **Name**        | `Create Shipment`                  |
    | **Description** | `A skill to create shipment or update shipment with ONLY carrier name. During update only carrier is required.` |   

    Click **Create**.

    ![Name skill](1-empty-2.png)

    Once the Joule skill is created, you are taken to the skill builder.




### Add input parameters
You need to tell Joule to ask the user for the details of the shipment to create, so you will create input parameters.

1. Click the **Trigger** step.

2. Click the **Parameters** tab, and next to **Skill Inputs** click **Configure**.

    ![Configure inputs](2-input-1.png)

3. In the **Configure Skill Inputs** dialog, click **Add Input** five times and enter the following details:

    | **Name**       | **Identifier** | **Description**         | **Required** |
    |----------------|----------------|--------------------------|---------------|
    | ```shipmentid```     | shipmentid     | ```Shipment ID```              | ✅ Checked|
    | ```srclocation```    | srclocation    | ```Source Location```          | ✅ Checked|
    | ```destlocation```   | destlocation   | ```Destination Location```     | ✅ Checked|
    | ```datetime```       | datetime       | ```Pick up Date - Convert this into ISO 8601```             | ✅ Checked|
    | ```carrier```        | carrier        | ```Carrier Name```                | ⬜ Unchecked|

    >All identifiers are entered automatically and will be the same as the **Name** field.
    >
    >The parameter type is automatically a string.

    ![Add inputs](2-input-2.png)

    Once all inputs are added, click **Apply**.






### Add output parameters
You need to create output an parameter so that the skill returns the shipment ID back to Joule or the agent.
    
1. Click the **Trigger** step.

2. Click the **Parameters** tab, and the next to **Skill Outputs** click **Configure**.
  
    ![Configure outputs](3-output-1.png)

3. Click **Add Ouput** and add the following output parameter.

    | **Name**          |  **Description**     | **Type** | **Required** | **List** |
    |--------------------|-----------|---------------|-----------|-----------|
    | `Created Shipment Id`                        | `Created Shipment Id`                | String    | ✅ Checked| ⬜ Unchecked |

    Click **Apply**.

    ![Add outputs](3-output-2.png)

4. Click **Save** (upper right).






### Add action
Now you'll create the action that will call the API for adding or updating a shipment.

1. In the skill builder, click on the **+** button.

    ![Add step](4-action-1.png)

    Choose **Call Action**

    ![Call action](4-action-2.png)

2. Click **Browse All Actions**, and find the action **createshipment**.

    ![Browse actions](4-action-3.png)

    >If there a lot of actions, you can filter by **GTTShipment** (the name of the action project).

    Click **Add** to the right of the action.

    ![Add actions](4-action-4.png)

    The action is added to the skill flow.







### Add destination variable for action
In this action, we are creating a new shipment with a POST request, and using a different destination. So we need to create a new destination variable for this action.

1. Make sure the action is selected.

2. In the first, **General** tab, click inside the **Destination Variable** field, and then click **Create Destination Variable**.

    ![Add destination](5-destination-1.png)

3. In the **Create Destination Variable** dialog, enter the following details. 

    | Field         | Value                                     |
    |---------------|-------------------------------------------|
    | **Identifier**        | `PostToGTT`                  |
    | **Description** | `Destination to create shipment in the GTT System` |

    Click **Create**.

    ![Name destination](5-destination-2.png)

4. The variable is created but it likely will not be selected or even visible in the **Destination Variable** field.

    >**Important:** You may need to refresh the page, reopen the skill and reselect the action to see the new variable.

    Select the new **PostToGTT** variable for the action.

    ![Select destination](5-destination-3.png)





### Bind data to action inputs
You need to pass the input parameters into the input fields of the action.

1. Make sure the action is selected.

2. Select the **Inputs** tab.

    ![Input tab](6-bind-input-1.png)

3. Bind the action inputs from the skill inputs.

    >As the skill inputs are of type **String** and some of the action inputs are of type **DateTime**, you will have to use a formula for those action inputs.

    | Field Name              | Mapped Path or Value                 |
    |--------------------------|-----------------------------|
    | **actualBusinessTimestamp**  | Skill Input > datetime    |  
    | **altKey**                   | Apply a Formula<div>&nbsp;</div>```ConcatenateStrings(["xri://sap.com/id:LBN#10020007892:EWWCLNT220:FT1_SHIPMENT:", <Skill Input-shipmentId>], "")```<div>&nbsp;</div>Replace the <> with the skill input binding for shipment ID. |
    | **arrivalLocationId**        | Skill Inputs > destlocation | 
    | **departureLocationId**      | Skill Inputs > srclocation  | 
    | **plannedArrivalDateTime**   | ```2026-03-31T16:30:00+02:00```  |  
    | **plannedDepartureDateTime** | Skill Input > datetime   |  
    | **serviceAgentLbnId**       | Skill Inputs > carrier      | 
    | **shipmentNo**               | Skill Inputs > shipmentid   | 

4. Click **Save** (upper right).





### Bind data to output parameters
You created the output parameters to send data back to Joule or the agent. Now we need to supply the data.

1. Click the **End** activity, and click in the **Created Shipment Id** field.

    ![End binding](7-bindend-1.png)

2. For **Created Shipment Id** output parameter, map it to **Skill Inputs > shipmentid**.

    ![Binding shipment ID](7-bindend-2.png)

3. Click **Save** (upper-right).





### Create condition branch
You will now create a condition branch in the Skill builder to check if a carrier exists for the shipment (update) or you are creating a fresh shipment without a carrier. 


1. In the skill builder, click on the **+** button after the action.

    ![Add step](8-condition-1.png)

2. Choose **Check Condition**.

    ![Check Condition](8-condition-2.png)

3. In the right-side panel for the condition activity, name the step **Is Carrier ID Empty?**.

    ![Name Condition](8-condition-3.png)

4. Click **Open Condition Editor**.

    ![Open condition editor](8-condition-4.png)

5. In the **Edit Branch Condition** dialog, do the following:

    - Click the first input field and select the skill input **carrier**.
    
    - Click the second field, a dropdown box of conditions, and select **is empty**.

    - Click **Apply**.

    ![Add condition](8-condition-5.png)

6. Open the condition activity, so you can see parallel paths.

    ![Open condition](8-condition-6.png)




### Add Send Message for creating shipment
A **Send Message** step enables you to send a personalized and pre-defined message to the end user instead of letting Joule design the message as it sees fit.

You will create two **Send Message** steps, one for each of the condition branches created in the previous exercise. 

1. In the **If** branch (left), click the **+** button.

    ![Add step](9-message1-1.png)

2. Select **Send Response**.

    ![Send Response](9-message1-2.png)

    Click **Send Message**

    ![Send Message](9-message1-3.png)

3. Select the **Send Message** on the **If** branch, and name it **Create Shipment Message** (i.e., set the in the **Step Name** field).

4. **Open Message Editor** on the right-side panel.

    ![Open Message Editor](9-message1-4.png)

    Set the following configuration:

    | Field Name              | Value                |
    |--------------------------|-----------------------------|
    | **Message Type** | Illustrated Message    |
    | **Title**                   | `Success`|
    | **Text**        | ```Shipment Id ${context.startEvent.shipmentid} created successfully in GTT```  |
    | **Illustration**      | Success High Five  |

    For the **Action Button** section, click **Add Button** and enter the following details:
  
    | Field Name              | Value                |
    |--------------------------|-----------------------------|
    | **Title**                   | `View Shipment`|
    | **url**        | ```https://store-content-dev.gtt-flp-lbnplatform.cfapps.eu10.hana.ondemand.com/cp.portal/site?sap-language=en#Shipment-track?sap-ui-app-id-hint=com.sap.gtt.app.sts```  |

    ![Configure message](9-message1-5.png)

    >**IMPORTANT:** You will not be able to directly access the GTT system due to restricted authorization. Ask your instructor to show you the created shipment in the GTT system, or run the track shipment skill/agent. 

    In the **Preview** area on the right, you can see how the message will look.

    Click **Save**.



### Add Send Message for updating shipment
1. In the **Default** branch (right), click the **+** button.

    ![Add step](10-message2-1.png)

2. Select **Send Response**, and then **Send Message**.

3. Select the **Send Message** on the **Default** branch, and name it **Update Shipment Message** (i.e., set the in the **Step Name** field).

3. **Open Message Editor** on the right-side panel.

    ![Open Message Editor](10-message2-2.png)

    Set the following configuration:

    | Field Name              | Value                |
    |--------------------------|-----------------------------|
    | **Message Type** | Illustrated Message    |
    | **Title**                   | `Success`|
    | **Text**        | ```Carrier ${context.startEvent.carrier} has been updated for Shipment ${context.startEvent.shipmentid}```  |
    | **Illustration**      | Success Check Mark  |

    For the **Action Button** section, click **Add Button** and enter the following details:
  
    | Field Name              | Value                |
    |--------------------------|-----------------------------|
    | **Title**                   | `View Shipment`|
    | **url**        | ```https://store-content-dev.gtt-flp-lbnplatform.cfapps.eu10.hana.ondemand.com/cp.portal/site?sap-language=en#Shipment-track?sap-ui-app-id-hint=com.sap.gtt.app.sts```  |

    ![Configure message](10-message2-2.png)

    >**IMPORTANT:** You will not be able to directly access the GTT system due to restricted Authorization. Ask your instructor to show you the created shipment in the GTT system. 

    Click **Save**.

  4. Click **Save** (upper right).


### Test the skill
1. Click **Test** in the upper-right.

    ![Start test](11-test-1.png)

2. The **Test Project** dialog should now require an additional environmental variable, while the others should already be populated with the correct details.

    Set the following values:

    | Field         | Value                                     |
    |---------------|-------------------------------------------|
    | **Environment**        | Select the email address of your user                  |
    | **Environment variables > GetFromGTT** | Select **gttGetService** |
    | **Environment variables > PostToGTT** | Select **gttwriteservice** |

    Click **Continue**.

    ![Test variables](11-test-2.png)

    A new browser tab opens with Joule.

3. As a prompt, enter:

    ```Prompt
    Hello Joule, Could you please assist me in creating a Shipment?
    ```


    Joule will trigger your Create Shipment skill but required parameters will be missing. Joule will prompt you for them.

    ![Prompt for details](11-test-4.png)

4. Enter the following prompt, changing the shipment ID to 91001<user number><your initials>, for example, `91001002DBW` (or any unique string):

    ```Prompt
    Shipment ID: 91001<User number><your initials>
    Source Location: SFO
    Destination Location: NYC
    Pick-up Date and Time: December 15, 2025 5:00:00 PM CET
    ```

    Joule will create a new shipment in the GTT system.

    ![Shipment created](11-test-5.png)

5. You can check if it was created by entering a prompt to track the shipment (change the shipment ID to the one you created).

    ```Prompt
    Track the shipment 91001<User number><your initials>
    ```

    Joule will respond with the shipment you created.

    ![Shipment created](11-test-6.png)

    >If no such shipment exists, Joule would tell you that it cannot help you.

6. Update the shipment by typing the following prompt.

    ```Prompt
    Update the Shipment ID: 91001<User number><your initials> with the carrier Fly By Night.
    All other values remain the same.
    ```

    Joule will respond with the update message you created.

    ![Shipment updated](11-test-7.png)

    Feel free to track the shipment again.

7. Once you are done testing, click **Stop Testing**.

    ![Stop testing](11-test-8.png)
