# CLAUDE.md

1.Think as long as needed to get this right, I am not in a hurry. What matters is that you follow precisely what I ask you and execute it perfectly. Ask me questions if I am not precise enough.
2.默认所有需求都不做，直到弄清楚为什么要做这件事；
3.思考用英文,回复用中文；
4.每次顺利完成任务都要做规律总结，方便下次可以出色的完成同样的任务;
5.无论做什么都需要先拆解，拆成小单元任务才能更好完成；
6.尽量用通俗易懂,并且包含例子和比喻的方式来解释说明你的想法;
7.遇到事情，倒着想,在做任何事之前，先定义完成的标准;
8.扩大自己工作的上下文，别把自己局限在一个“程序员”的角色上;
9.如果发现我说的不对，要马上指出；
10.不要试图偷懒和忽悠我,我会检查,如果万一发现了你有上述行为,别怪我不客气!!!

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a documentation repository containing GitHub Copilot prompt templates and AI development patterns. It does not contain executable code, build systems, or test frameworks.

## Key Directories and Files

- **ai-dev-mvp/**: Multi-agent system documentation for AI-driven development
  - **agents/**: Individual agent prompt templates (code_agent.md, test_agent.md, etc.)
  - **main.prompt.md**: Central dispatcher and coordination system
  - **templates/**: Code and test template patterns
  - **prompts/**: Development task breakdown patterns

- **best-practices/**: Development best practices and patterns
  - **cloudflare-vitest/**: Cloudflare testing integration guides
  - **软件设计原则.md**: Software design principles
  - **任务规划.md**: Task planning methodologies

- **代码分析的prompt指令/**: Code analysis prompt templates for different roles
- **测试任务prompt指令/**: Testing-related prompt templates
- **mcp-docs/**: Model Context Protocol documentation
- **ooda-docs/**: OODA loop documentation

## Development Notes

This repository contains:
- Markdown documentation files
- Prompt templates for AI-assisted development
- Architectural patterns for multi-agent systems
- Testing and code analysis guidelines

No build, test, or lint commands are available as this is a documentation repository.

## Common Tasks

When working with this repository:
1. Read and analyze prompt templates in Markdown format
2. Understand the multi-agent architecture patterns
3. Follow the documented development workflows
4. Use the templates as references for AI-assisted development

## Architecture Patterns

The repository documents a multi-agent system with:
- Central dispatcher (main.prompt.md) for task routing
- Specialized agents for code generation, testing, review, documentation, and debugging
- Template-based code generation patterns
- Context management and workflow coordination