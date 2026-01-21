---
auto_validation: true
time: 5
author_name: Daniel Wroblewski
author_profile: https://github.com/thecodester
tags: [ tutorial>beginner, topic>cloud ]
primary_tag: topic>cloud
parser: v2
---
  
# 6 - Create Agent to Coordinate Skills
<!-- description --> Create a Joule agent to coordinate the skills, allow us to control exactly how Joule interacts with the user.
 
## You will learn
- How to build a Joule agent

## Prerequisites
- You have completed the previous tutorial in the Joule Studio CodeJam Mission, [Create Skill to Create / Update Shipment](joule-studio-codejam-5-skill-create).


## Intro
**Joule agents** represent the next evolution of enterprise automation — intelligent, autonomous systems that **plan, reason, and act** across multiple tools and systems to achieve complex goals.  

While **Joule Skills** execute predefined, deterministic operations, Joule agents handle **multi-step, adaptive workflows**, deciding *what to do, when, and how* based on business context and user intent.

Functioning as orchestration layers, Joule agents combine analytical reasoning with real-time decision-making. They use **Large Language Models (LLMs)** to interpret user requests, dynamically select relevant tools (including Joule Skills), and generate contextual responses — enabling **goal-oriented, conversational automation**.

Each Joule Agent is built around four key cognitive abilities:

1. **Planning** – The agent determines the best sequence of actions to achieve a business goal, orchestrating multiple tools or Joule Skills as needed.  
2. **Reflection** – The agent evaluates its own steps, identifies errors or missing data, and self-corrects to reach the desired outcome.  
3. **Tool Usage** – The agent dynamically invokes SAP Build Actions, Joule Skills, or other APIs to perform operations, retrieve data, or trigger systems.  
4. **Collaboration** – Agents can cooperate with other agents or human users, engaging in dialogue, confirmation, or validation when business logic requires oversight.

![Joule Skills vs Agents](Joule%20Skills%20vs%20Agents.jpg)

While **Joule Skills** define *what* actions can be performed (e.g., analyze workloads or simulate optimizations), the **Joule Agent** defines *how* these skills are orchestrated in a conversational, goal-driven workflow.  

This agent:
- Combines multiple Joule Skills into an intelligent flow.  
- Makes autonomous decisions based on data and context.  
- Communicates naturally with warehouse supervisors.  

In short, this is where your **Logistics Agent** scenario becomes fully functional.

>Joule agents also enable the use of the following tools and capabilities which are not available via skills.
>
>- **Document Grounding:** You can have AI Core index or "embed" a set of documents and use them as context inside your agent.
>
>- **MCP Servers:** You can connect your agent to MCP servers and use their tools inside your agent.
>
>- **LLM Settings:** You can specify which LLMs you want to use, and set whether you want addition pre- and post-processing when the agent is figuring out what to do.


### Create empty agent
1. Select the **Overview** tab.

2. Click **Create**, and choose **Joule Agent**.

3. In the **Create Joule Agent** dialog, enter the following details:

    | Field         | Value                                     |
    |---------------|-------------------------------------------|
    | **Name**        | `Agent for Logistics`                  |
    | **Description** | `An agent to create OR update OR track shipments in GTT system, as well as to offer carrier options for shipments` |   

    Click **Create**.

    Once the Joule skill is created, you are taken to the skill builder.
    
    

### Add expertise, instructions and context
1. In the agent builder, enter the following for the **Expertise** section:

    ```Text
    Executes shipment creation and updates, retrieves tracking details, identifies delayed shipments, and presents carrier options according to the corporate Carrier Selection Guide.
    ```

    >**💡 Tip:** Expertise defines the agent's professional identity and field of knowledge.	This tells the agent which general business area it is operating in, such as finance, human resources, or supply chain. Your input here will help shape the agent's overall tone, vocabulary, and scope.

2. Enter the following for the **Instructions** section:

    >**💡 Tip:** Instructions specifies the agent's core goal, rules, and constraints.	This is the most critical part, as it dictates what the agent should accomplish. It directs the agent's behavior by providing guardrails and setting its primary objective.

    ```Text
    You are responsible for handling logistics-related user requests involving shipments and carriers. You must determine which action to take based on the user’s input. Select and execute the appropriate tool autonomously according to the rules below.

    1. Create Shipment

    Use the tool “Create Shipment” when the user asks to create a new shipment or provide shipment details. If required details are missing, request them from the user by listing only the required fields as a table with their descriptions -- do not ask for carrier. Once the shipment is created or updated, display the message returned by the tool.
    
    Examples of relevant prompts:
    “Create a shipment for this order.”
    “I need to ship the goods.”
    “Start a new shipment.”

    2. Suggest Carrier Options 

    If the user asks for carrier suggestions, use the document “Carrier Selection Guide.docx” to present all available carrier options. Display the list of carriers for the user to view as a simple table, displaying only the name of the carrier and the price. 

    Let the user decide which carrier they want to use and then ask the user for the Shipment ID and Carrier they to update the shipment with using the 'Create Shipment' tool. all other values of the shipment remain unchanged.

    Examples of relevant prompts:
    “Show me available carriers.”
    “Suggest a carrier for this shipment.”
    "Update the shipment <shipment id> with the carrier <carrier> "
    “Use UPS for this shipment.”

    3. Track Shipment

    If the user requests shipment tracking information, trigger the Track Shipment tool. Display the message from the tool exactly as provided.

    Examples of relevant prompts:
    “Track shipment 12345.”
    “Where is my delivery?”
    “Show the current status of the shipment.”

    4. Delayed Shipments

    If the user asks to see delayed shipments, execute the Delayed Shipments tool directly. Display the tool’s output exactly as received.

    Examples of relevant prompts:
    “Show me all delayed shipments.”
    “List shipments that are late.”
    “Any deliveries behind schedule?”

    5. Tool Selection Logic
    The user may request actions in any order (e.g., tracking first, then creating, or selecting carriers afterward).
    ```

3. Enter the following for the **Additional Context** section:

    >**💡 Tip:** Context allows you to feed the agent more specific, relevant, and potentially evolving information. It can help the agent make more nuanced decisions and produce more accurate results.

    ```Text
    Maintain a professional, clear, and courteous tone throughout all communications. Ensure every response is precise, concise, and free from ambiguity. Use straightforward language, avoid unnecessary details, and never use vague or ambiguous wording. If any information is missing or unclear, politely ask the user for clarification instead of making assumptions.

    You are an operational logistics assistant supporting shipment creation, carrier coordination, and delivery visibility. Your responses should reflect efficiency, accuracy, and execution reliability.

    When displaying carrier options, ensure usability by presenting them as a table and offering selectable options directly within the interface (Select/checkbox).

    **Example Communication**
    User: "Can you show me available carriers?"
    Agent: "Here are the available carriers for your shipment. Please select one from the table below."

    User: "Update the shipment with UPS."
    Agent: "Please provide the Shipment ID to update the carrier to UPS."

    User: "Track shipment 12345."
    Agent: "Tracking details for shipment 12345: [display tracking information]."
    ```



### Set the models and settings
1. Choose the **Model Settings** options as follows:
  
    | Field         | Value                                     |
    |---------------|-------------------------------------------|
    | **LLM provider** | `OpenAI` |
    | **Base Model** | `GPT4o` |
    | **Advanced Model** | `GPT4o` |
    | **Enable Backup LLM Provider** | Toggle Off |

2. Keep the settings under **Agent Execution Steps** as they are.




### Add skills as tools
Agents need at least one tool. Tools are the way agents perform tasks to fulfill their instructions.

1. In the **Tools** section, click **Add Tool**, and then **Joule Skill**.

2. In the **Add Tool** dialog, select all the skills, and then click **Add**.

    The tools will be added under **Tools**.





### Add document grounding as tool
Document Grounding allows you "index" a set of documents located in a repository, such the SAP BTP Object Store service, so that the information can be fed into and used by an LLM, and your agent.

For this CodeJam, we have created a small document with pairs of start and destination locations (airport codes) and the price for sending a shipment on that route.

This document has been uploaded to an Object Store service and destinations have already been set up to our AI Core and Object Store services. In addition, we have deined a document grounding resource group in the Control Tower for you to use.

1. In the **Tools** section, click **Add Tool**, and then **Documents**.

2. In the **Add Tool** dialog, enter the following.

    | Field         | Value                                     |
    |---------------|-------------------------------------------|
    | **Tool name**        | `Carrier Selection Guide`                  |
    | **Description** | `Internal guidelines required by the agent to select cheapest carrier based on the costs provided in the document. It covers the carrier selection guide as a table with all possible carriers for the given source and destination location.` |
    | **Resource Group**        | Select **AI163**                |

    Click **Add**.

    >Document grounding in an SAP Build Joule agent is a capability that uses a Retrieval-Augmented Generation (RAG) technique to provide users with accurate, specific answers based on an organization's internal business documents. Instead of relying only on a large language model's (LLM) general training data, Joule can reference a customer's private data, such as HR policies, manuals and FAQs. 

    >This process enhances the reliability and relevance of Joule's responses by reducing inaccuracies and hallucinations that can occur when an LLM operates without specific context. 

3. Click **Save** (upper right).

In this CodeJam, we will not set up Document Grounding. But here is some information about the process.

    - An admin sets up an instance of the AI Core service in SAP BTP, which can break down a set of documents so an LLM can make use of the information.

    - An admin sets up a document store, for example the Object Store service in SAP BTP.

    - An admin sets destinations for both AI Core and Object Store, using a additional property so they are available for use in Joule Studio for setting up document grounding.

    - An admin goes to the **Control Tower > Document Grounding** tile and specifies which AI Core to use to index the documents and from which Object Store to take the documents. After a minute or two of "embedding" the documents, the document grounding is available for use in Joule Studio.

The full setup of document grounding for Joule Studio is described in this blog post, [Joule Studio: How to Create Document Grounding](https://community.sap.com/t5/tooling-sap-build-blog-posts/joule-studio-how-to-create-document-grounding/ba-p/14306631). 


### Disable direct triggering of skills
Sometimes you want to control how skills are used, both the input and the output, and want only an agent to call the skill.

That is what we will do here. For each of the 3 skills:

1. Open the skill.

2. Open the right-side panel.

3. Toggle off the setting **Allow skill to be started directly by a user**.



### Let Joule format output
You can tell Joule to display the agent response as is, or ask Joule to take that information and format as it sees fit.

Let's let Joule reformat the agent response.

Scroll to the bottom of the agent and toggle on the setting **Allow Joule to interpret the output of the agent**. 


