# ai-dev-mvp

## Overview

ai-dev-mvp is a Minimum Viable Product (MVP) project aimed at automating the software development process. It utilizes a multi-agent system to handle tasks such as code generation, testing, review, documentation, and debugging.

## Key Features

-   **Agent-Based Architecture:** The system is built around specialized agents, each responsible for a specific task in the development lifecycle.
-   **Automated Code Generation:** Automatically generate code snippets based on predefined templates and configurations.
-   **Automated Testing:** Generate test cases to ensure code correctness and stability.
-   **Automated Code Review:** Review code for potential issues and adherence to best practices.
-   **Automated Documentation Generation:** Generate project documentation, including API references and usage guides.
-   **Error Diagnosis:** Diagnose and provide debugging suggestions for code errors.

## Agents

-   **Code Agent (`code_agent.md`):** Generates code based on templates and configurations.
-   **Test Agent (`test_agent.md`):** Generates test cases for code components.
-   **Review Agent (`review_agent.md`):** Reviews code for quality and adherence to standards.
-   **Doc Agent (`doc_agent.md`):** Generates project documentation.
-   **Debug Agent (`debug_agent.md`):** Helps diagnose and debug code errors.

## Architecture

The system follows a main prompt-driven architecture (`main.prompt.md`). The `main.prompt.md` acts as a central dispatcher, receiving natural language instructions and routing tasks to the appropriate agents based on a predefined routing table. Agents communicate with each other through the central dispatcher, ensuring a coordinated workflow. The context management mechanism maintains the development process's context information (task ID, status, history, user preferences, project configuration, etc.).

## Usage

The system is designed to be driven by natural language instructions. For example, a user can input "Create a Button component", and the system will generate the necessary code, tests, and documentation.

### Instruction Processing Flow

1.  **Configuration Generation and Confirmation:**
    *   The user inputs a natural language instruction, such as `Create Button component`.
    *   The system parses the instruction and generates a configuration JSON.
    *   The configuration is displayed to the user for confirmation or modification.
2.  **Code Generation:**
    *   After the user confirms the configuration, the system calls the corresponding agent.
    *   The agent generates code based on the confirmed configuration.
    *   The generated code is returned to the user.

### Example

To create a button component, you might use the following instruction:

## Contributing

We welcome contributions to the project! To contribute, please follow 