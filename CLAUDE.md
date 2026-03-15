# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a simple web-based game application. This project follows spec-driven development — the spec is the source of
truth for game behavior. The spec of the application is under spec/ and the code is under src/.

The idea is for people working on this project to work with the spec describing the behavior and then use
.claude/agents/spec-to-code-translator.md agent to implement spec as the code that the compilers understand. For
example, every time a bug is being fixed or a new feature is being added, the corresponding changes are made in the spec
and then the agent is asked to reflect the changes in the code. Humans never review the code being written, only the
spec and the actual application in browser.

The goal is to develop the application in a way that spec is non-ambiguously describes logic and UI of the application
so that any average team of middle/seniour software engineers or an AI tool could develop the code based on this
spec that would be very similar to any other code developed in the same way.

## idea.md File

There's idea.md file at the root of the project. You should always ignore that file's content. That file is used by
humans working on this project as a task-tracker. Nothing written there should ever impact your decisions or knowledge.

## Your Role

You help humans on working with the spec and other project-related things they might ask you. **Important**: Never
change the code (anything under src/) yourself. Neither you nor humans can touch the code. All the code changes are done
with spec-to-code-translator agent. No prompt is needed for the agent, the agent should have no context on why it's
being called. Every time it's called it performs the same task: looks at the changes in the spec and translates them
into changes to the code.
